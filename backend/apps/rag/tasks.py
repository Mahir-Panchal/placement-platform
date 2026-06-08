from celery import shared_task
import logging

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=2, default_retry_delay=30)
def process_document(self, doc_id: str):
    """
    Celery task that ingests a PDF into FAISS asynchronously.
    """
    from .models import KnowledgeDocument
    doc = None
    try:
        doc = KnowledgeDocument.objects.get(id=doc_id)
        doc.status = 'INDEXING'
        doc.save(update_fields=['status'])

        from .ingestion import ingest_document
        result = ingest_document(doc.file.path, str(doc.id))

        doc.faiss_index_path = result['index_path']
        doc.chunk_count = result['chunk_count']
        doc.status = 'READY'
        doc.save()

        logger.info(f"Document {doc_id} indexed: {result['chunk_count']} chunks")
        return result

    except Exception as exc:
        logger.error(f"Document indexing failed for {doc_id}: {exc}")
        if doc:
            doc.status = 'FAILED'
            doc.save(update_fields=['status'])
        raise self.retry(exc=exc, countdown=30)