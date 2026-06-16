from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
import os

from .models import KnowledgeDocument
from .serializers import (
    DocumentUploadSerializer,
    DocumentSerializer,
    QuerySerializer,
)


class DocumentUploadView(APIView):
    """
    POST /api/rag/upload/
    Uploads a PDF and indexes it synchronously.
    """

    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer = DocumentUploadSerializer(data=request.data)
        if serializer.is_valid():
            doc = serializer.save(user=request.user, status="PENDING")

            # Run synchronously — no Celery worker needed
            from .tasks import process_document

            try:
                process_document.apply(args=[str(doc.id)])
            except Exception:
                pass

            doc.refresh_from_db()

            return Response(
                DocumentSerializer(doc).data, status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DocumentListView(APIView):
    """
    GET /api/rag/documents/
    Lists all knowledge documents for the current user.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        docs = KnowledgeDocument.objects.filter(user=request.user)
        return Response(DocumentSerializer(docs, many=True).data)


class DocumentDeleteView(APIView):
    """
    DELETE /api/rag/documents/{id}/
    Deletes document record and FAISS index from disk.
    """

    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        doc = get_object_or_404(KnowledgeDocument, id=pk, user=request.user)

        if doc.faiss_index_path and os.path.exists(doc.faiss_index_path):
            import shutil

            shutil.rmtree(doc.faiss_index_path, ignore_errors=True)

        if doc.file and os.path.isfile(doc.file.path):
            os.remove(doc.file.path)

        doc.delete()
        return Response({"message": "Document deleted"})


class DocumentQueryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = QuerySerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        doc_id = serializer.validated_data["document_id"]
        question = serializer.validated_data["question"]

        try:
            doc = get_object_or_404(KnowledgeDocument, id=doc_id, user=request.user)
        except Exception:
            return Response(
                {"error": "Document not found"}, status=status.HTTP_404_NOT_FOUND
            )

        if doc.status != "READY":
            return Response(
                {
                    "error": f"Document is {doc.status}. Please wait for indexing to complete."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            from .chain import build_qa_chain

            chain = build_qa_chain(doc.faiss_index_path)
            result = chain.invoke({"input": question})

            return Response(
                {
                    "question": question,
                    "answer": result.get("answer", ""),
                    "document": doc.title,
                    "sources": [
                        d.page_content[:200] for d in result.get("context", [])
                    ],
                }
            )
        except Exception as e:
            return Response(
                {"error": f"Query failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
