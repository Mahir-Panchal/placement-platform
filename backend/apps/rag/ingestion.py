import os
from langchain_community.document_loaders import PyMuPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings.fastembed import FastEmbedEmbeddings


def get_embeddings():
    """
    Uses FastEmbed — extremely lightweight, no PyTorch needed.
    Downloads a tiny 50MB model on first use.
    """
    return FastEmbedEmbeddings(model_name="BAAI/bge-small-en-v1.5")


def ingest_document(file_path: str, doc_id: str) -> dict:
    try:
        loader = PyMuPDFLoader(file_path)
        documents = loader.load()

        if not documents:
            raise ValueError("No content extracted from PDF")

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=500,
            chunk_overlap=50,
        )
        chunks = splitter.split_documents(documents)

        if not chunks:
            raise ValueError("No chunks created from document")

        embeddings = get_embeddings()
        db = FAISS.from_documents(chunks, embeddings)

        index_dir = os.path.join("media", "faiss_indexes", str(doc_id))
        os.makedirs(index_dir, exist_ok=True)
        db.save_local(index_dir)

        return {
            "chunk_count": len(chunks),
            "index_path": index_dir,
        }

    except Exception as e:
        print(f"Ingestion error: {e}")
        raise e


def load_index(index_path: str):
    embeddings = get_embeddings()
    return FAISS.load_local(
        index_path, embeddings, allow_dangerous_deserialization=True
    )
