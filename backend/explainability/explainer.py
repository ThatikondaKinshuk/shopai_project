"""
Explainability Module
- Computes confidence scores for answers
- Aggregates sentiment across retrieved chunks
- Returns evidence with source attribution
- Powers the "Why this answer?" transparency feature
"""

from typing import List, Dict
import re


SENTIMENT_SCORES = {"positive": 1.0, "neutral": 0.5, "negative": 0.0}


class ExplainabilityModule:
    def explain(self, chunks: List[Dict], answer: str, query: str) -> Dict:
        """
        Given retrieved chunks and a generated answer, produce:
        - Evidence list with source attribution
        - Confidence score
        - Sentiment summary breakdown
        """
        if not chunks:
            return {
                "confidence": 0.0,
                "evidence": [],
                "sentiment_summary": {"positive": 0, "neutral": 0, "negative": 0},
            }

        # --- Evidence: top chunks with cleaned text ---
        evidence = []
        for chunk in chunks[:5]:
            relevance = chunk.get("relevance_score", 0.5)
            evidence.append({
                "text": self._truncate(chunk["text"], max_chars=200),
                "source": chunk.get("source", "review"),
                "sentiment": chunk.get("sentiment", "neutral"),
                "relevance_score": relevance,
                "aspect": chunk.get("aspect", "general"),
            })

        # --- Confidence Score ---
        # Based on: avg relevance of top chunks + review count + sentiment agreement
        relevance_scores = [e["relevance_score"] for e in evidence]
        avg_relevance = sum(relevance_scores) / len(relevance_scores) if relevance_scores else 0.0

        sentiments = [c.get("sentiment", "neutral") for c in chunks if c.get("source") == "review"]
        sentiment_agreement = self._compute_agreement(sentiments)

        # Weight: 60% relevance + 40% agreement
        confidence = round((0.6 * avg_relevance) + (0.4 * sentiment_agreement), 3)
        confidence = min(confidence, 0.99)  # Never claim 100% certainty

        # --- Sentiment Summary ---
        sentiment_summary = {"positive": 0, "neutral": 0, "negative": 0}
        for s in sentiments:
            sentiment_summary[s] = sentiment_summary.get(s, 0) + 1

        total = sum(sentiment_summary.values())
        if total > 0:
            sentiment_summary["positive_pct"] = round(sentiment_summary["positive"] / total * 100)
            sentiment_summary["neutral_pct"] = round(sentiment_summary["neutral"] / total * 100)
            sentiment_summary["negative_pct"] = round(sentiment_summary["negative"] / total * 100)

        # --- Answer Quality Check ---
        if not answer or len(answer.strip()) < 10:
            confidence *= 0.5  # Penalize empty or very short answers

        return {
            "confidence": confidence,
            "evidence": evidence,
            "sentiment_summary": sentiment_summary,
        }

    def _compute_agreement(self, sentiments: List[str]) -> float:
        """
        Measures how consistent sentiment is across reviews.
        High agreement (mostly positive or mostly negative) = more confident answer.
        """
        if not sentiments:
            return 0.5

        counts = {"positive": 0, "neutral": 0, "negative": 0}
        for s in sentiments:
            counts[s] = counts.get(s, 0) + 1

        total = len(sentiments)
        dominant = max(counts.values())
        return round(dominant / total, 3)

    def _truncate(self, text: str, max_chars: int = 200) -> str:
        """Truncate text to max_chars, ending at a word boundary."""
        if len(text) <= max_chars:
            return text
        truncated = text[:max_chars]
        last_space = truncated.rfind(" ")
        return truncated[:last_space] + "..." if last_space > 0 else truncated + "..."
