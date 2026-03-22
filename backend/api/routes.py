"""
API Routes for Product QA System
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
import time

from pipeline.preprocessor import preprocess_query
from retrieval.chroma_store import ChromaRetriever
from llm.ollama_client import OllamaClient
from explainability.explainer import ExplainabilityModule

router = APIRouter()

retriever = ChromaRetriever()
ollama = OllamaClient()
explainer = ExplainabilityModule()


class QuestionRequest(BaseModel):
    product_id: str
    question: str
    top_k: Optional[int] = 5


class EvidenceChunk(BaseModel):
    text: str
    source: str  # "review" or "metadata"
    sentiment: str
    relevance_score: float
    aspect: str


class QAResponse(BaseModel):
    answer: str
    confidence: float
    evidence: List[EvidenceChunk]
    aspect_detected: str
    sentiment_summary: dict
    response_time_ms: float


class ProductSearchResponse(BaseModel):
    products: List[dict]
    total: int


@router.post("/ask", response_model=QAResponse)
async def ask_question(request: QuestionRequest):
    """
    Ask a natural language question about a product.
    Returns an AI-generated answer with explainability evidence.
    """
    start = time.time()

    # 1. Preprocess query
    processed = preprocess_query(request.question)

    # 2. Retrieve relevant chunks
    chunks = retriever.retrieve(
        product_id=request.product_id,
        query=processed["cleaned_query"],
        top_k=request.top_k,
    )

    if not chunks:
        raise HTTPException(
            status_code=404,
            detail=f"No data found for product_id: {request.product_id}",
        )

    # 3. Build prompt and generate answer via Ollama
    context = "\n\n".join([c["text"] for c in chunks])
    answer = ollama.generate_answer(
        question=request.question,
        context=context,
        aspect=processed["aspect"],
    )

    # 4. Explain the answer
    explanation = explainer.explain(chunks=chunks, answer=answer, query=request.question)

    elapsed = round((time.time() - start) * 1000, 2)

    return QAResponse(
        answer=answer,
        confidence=explanation["confidence"],
        evidence=[EvidenceChunk(**e) for e in explanation["evidence"]],
        aspect_detected=processed["aspect"],
        sentiment_summary=explanation["sentiment_summary"],
        response_time_ms=elapsed,
    )


@router.get("/products", response_model=ProductSearchResponse)
async def search_products(
    q: Optional[str] = Query(None, description="Search query"),
    category: Optional[str] = Query(None),
    limit: int = Query(20, le=100),
    offset: int = Query(0),
):
    """
    Search and browse products in the database.
    """
    products = retriever.search_products(query=q, category=category, limit=limit, offset=offset)
    return ProductSearchResponse(products=products, total=len(products))


@router.get("/products/{product_id}")
async def get_product(product_id: str):
    """
    Get full product metadata + review summary for a given product.
    """
    product = retriever.get_product(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.get("/products/{product_id}/aspects")
async def get_product_aspects(product_id: str):
    """
    Get aspect-level sentiment breakdown for a product.
    (e.g., battery, comfort, price, durability)
    """
    aspects = retriever.get_aspect_summary(product_id)
    return {"product_id": product_id, "aspects": aspects}


@router.get("/stats")
async def get_stats():
    """
    Returns system statistics: number of products, reviews indexed, etc.
    """
    return retriever.get_stats()
