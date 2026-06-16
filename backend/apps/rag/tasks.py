from celery import shared_task
import logging

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=0)
def process_document(self, doc_id: str):
    """
    Processes a PDF into FAISS index synchronously.
    max_retries=0 — no retries on free tier, fail fast and show FAILED status.
    """
    from .models import KnowledgeDocument

    doc = None
    try:
        doc = KnowledgeDocument.objects.get(id=doc_id)
        doc.status = "INDEXING"
        doc.save(update_fields=["status"])

        from .ingestion import ingest_document

        result = ingest_document(doc.file.path, str(doc.id))

        doc.faiss_index_path = result["index_path"]
        doc.chunk_count = result["chunk_count"]
        doc.status = "READY"
        doc.save()

        logger.info(f"Document {doc_id} indexed: {result['chunk_count']} chunks")
        return result

    except Exception as exc:
        logger.error(f"Document indexing failed for {doc_id}: {exc}")
        if doc:
            doc.status = "FAILED"
            doc.save(update_fields=["status"])
        # Don't retry — just return so status stays FAILED
        return {"error": str(exc)}
