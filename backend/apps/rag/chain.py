import os
from langchain_groq import ChatGroq
from langchain.chains import RetrievalQA
from langchain_core.prompts import ChatPromptTemplate
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.chains import create_retrieval_chain


def build_qa_chain(index_path: str):
    """
    Builds a RAG Q&A chain using FAISS retriever + Groq LLM.
    """
    from .ingestion import load_index

    # Load FAISS index
    db = load_index(index_path)
    retriever = db.as_retriever(search_kwargs={'k': 4})

    # LLM
    llm = ChatGroq(
        model="llama-3.1-8b-instant",
        temperature=0,
        groq_api_key=os.getenv('GROQ_API_KEY'),
    )

    # Prompt
    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are a helpful assistant that answers questions based on the provided context.
Answer the question using ONLY the information from the context below.
If the answer is not in the context, say "I couldn't find that information in the document."
Be concise and clear.

Context:
{context}"""),
        ("human", "{input}"),
    ])

    # Build chain
    document_chain = create_stuff_documents_chain(llm, prompt)
    retrieval_chain = create_retrieval_chain(retriever, document_chain)

    return retrieval_chain