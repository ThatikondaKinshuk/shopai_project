"""
ChromaDB Vector Store for Semantic Retrieval
Indexes product metadata + customer reviews as embeddings
Uses sentence-transformers for embedding generation
"""

import json
import os
from pathlib import Path
from typing import List, Dict, Optional

import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer

from data.ingestion import load_or_generate_data

CHROMA_DB_PATH = Path(__file__).parent.parent / "chroma_db"
EMBEDDING_MODEL = "all-MiniLM-L6-v2"  # Fast, lightweight, good quality


class ChromaRetriever:
    def __init__(self):
        self.client = chromadb.PersistentClient(
            path=str(CHROMA_DB_PATH),
            settings=Settings(anonymized_telemetry=False),
        )
        self.model = SentenceTransformer(EMBEDDING_MODEL)

        # Two collections: one for reviews, one for product metadata
        self.reviews_collection = self.client.get_or_create_collection(
            name="product_reviews",
            metadata={"hnsw:space": "cosine"},
        )
        self.meta_collection = self.client.get_or_create_collection(
            name="product_metadata",
            metadata={"hnsw:space": "cosine"},
        )

        # Load product lookup dict
        self._product_cache: Dict[str, dict] = {}
        self._ensure_indexed()

    def _ensure_indexed(self):
        """Index data into ChromaDB if not already done."""
        if self.reviews_collection.count() == 0:
            print("🔄 Indexing data into ChromaDB...")
            self._index_all()
        else:
            print(f"✅ ChromaDB ready: {self.reviews_collection.count()} review chunks indexed")
            self._load_product_cache()

    def _index_all(self):
        """Load data and embed into ChromaDB."""
        data = load_or_generate_data()

        # Index product metadata
        meta_docs, meta_ids, meta_embeddings, meta_metas = [], [], [], []
        for product in data["products"]:
            pid = product["product_id"]
            self._product_cache[pid] = product

            doc_text = (
                f"Product: {product['title']}. "
                f"Brand: {product['brand']}. "
                f"Category: {product['category']}. "
                f"Price: ${product['price']}. "
                f"Description: {product['description']}. "
                f"Specs: {json.dumps(product['specifications'])}."
            )
            meta_docs.append(doc_text)
            meta_ids.append(f"meta_{pid}")
            meta_metas.append({
                "product_id": pid,
                "source": "metadata",
                "category": product["category"],
                "price": str(product["price"]),
                "aspect": "general",
                "sentiment": "neutral",
            })

        embeddings = self.model.encode(meta_docs).tolist()
        self.meta_collection.add(
            documents=meta_docs,
            embeddings=embeddings,
            ids=meta_ids,
            metadatas=meta_metas,
        )

        # Index reviews in batches
        batch_size = 100
        rev_docs, rev_ids, rev_embeddings, rev_metas = [], [], [], []

        for review in data["reviews"]:
            rev_docs.append(review["text"])
            rev_ids.append(f"rev_{review['review_id']}")
            rev_metas.append({
                "product_id": review["product_id"],
                "source": "review",
                "sentiment": review["sentiment"],
                "aspect": review["aspect"],
                "rating": str(review["rating"]),
                "verified": str(review["verified_purchase"]),
            })

        # Batch embedding
        for i in range(0, len(rev_docs), batch_size):
            batch_docs = rev_docs[i:i + batch_size]
            batch_ids = rev_ids[i:i + batch_size]
            batch_metas = rev_metas[i:i + batch_size]
            batch_embeddings = self.model.encode(batch_docs).tolist()
            self.reviews_collection.add(
                documents=batch_docs,
                embeddings=batch_embeddings,
                ids=batch_ids,
                metadatas=batch_metas,
            )

        print(f"✅ Indexed {len(meta_docs)} products and {len(rev_docs)} reviews")

    def _load_product_cache(self):
        """Repopulate product cache from ChromaDB metadata collection."""
        data = load_or_generate_data()
        for product in data["products"]:
            self._product_cache[product["product_id"]] = product

    def retrieve(self, product_id: str, query: str, top_k: int = 5) -> List[Dict]:
        """
        Retrieve top-k most relevant review and metadata chunks for a product.
        """
        query_embedding = self.model.encode([query]).tolist()

        results = []

        # Query reviews
        rev_results = self.reviews_collection.query(
            query_embeddings=query_embedding,
            n_results=min(top_k, self.reviews_collection.count()),
            where={"product_id": product_id},
            include=["documents", "metadatas", "distances"],
        )

        for doc, meta, dist in zip(
            rev_results["documents"][0],
            rev_results["metadatas"][0],
            rev_results["distances"][0],
        ):
            results.append({
                "text": doc,
                "source": meta.get("source", "review"),
                "sentiment": meta.get("sentiment", "neutral"),
                "aspect": meta.get("aspect", "general"),
                "relevance_score": round(1 - dist, 4),
            })

        # Always include product metadata
        meta_results = self.meta_collection.query(
            query_embeddings=query_embedding,
            n_results=1,
            where={"product_id": product_id},
            include=["documents", "metadatas", "distances"],
        )

        if meta_results["documents"][0]:
            results.insert(0, {
                "text": meta_results["documents"][0][0],
                "source": "metadata",
                "sentiment": "neutral",
                "aspect": "general",
                "relevance_score": round(1 - meta_results["distances"][0][0], 4),
            })

        return results

    def search_products(
        self,
        query: Optional[str] = None,
        category: Optional[str] = None,
        limit: int = 20,
        offset: int = 0,
    ) -> List[Dict]:
        """Search products by text query or filter by category."""
        products = list(self._product_cache.values())

        if category:
            products = [p for p in products if p["category"].lower() == category.lower()]

        if query:
            query_lower = query.lower()
            products = [
                p for p in products
                if query_lower in p["title"].lower()
                or query_lower in p["category"].lower()
                or query_lower in p["brand"].lower()
            ]

        return products[offset:offset + limit]

    def get_product(self, product_id: str) -> Optional[Dict]:
        """Get product metadata by ID."""
        return self._product_cache.get(product_id)

    def get_aspect_summary(self, product_id: str) -> Dict:
        """
        Aggregates aspect-level sentiment for a product from indexed reviews.
        """
        data = load_or_generate_data()
        reviews = [r for r in data["reviews"] if r["product_id"] == product_id]

        aspect_summary = {}
        for review in reviews:
            aspect = review["aspect"]
            sentiment = review["sentiment"]
            if aspect not in aspect_summary:
                aspect_summary[aspect] = {"positive": 0, "neutral": 0, "negative": 0, "total": 0}
            aspect_summary[aspect][sentiment] += 1
            aspect_summary[aspect]["total"] += 1

        # Compute scores
        for aspect in aspect_summary:
            total = aspect_summary[aspect]["total"]
            pos = aspect_summary[aspect]["positive"]
            aspect_summary[aspect]["score"] = round(pos / total, 2) if total > 0 else 0

        return aspect_summary

    def get_stats(self) -> Dict:
        """Return system stats."""
        return {
            "total_products": len(self._product_cache),
            "total_review_chunks": self.reviews_collection.count(),
            "total_metadata_chunks": self.meta_collection.count(),
            "embedding_model": EMBEDDING_MODEL,
            "vector_db": "ChromaDB",
        }
