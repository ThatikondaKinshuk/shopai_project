"""
Unit tests for ShopMind AI backend
Run with: pytest tests/ -v
"""

import pytest
from pipeline.preprocessor import preprocess_query, detect_aspect, detect_intent
from explainability.explainer import ExplainabilityModule


# ── Preprocessor Tests ───────────────────────────────────────────────────────

class TestPreprocessor:
    def test_clean_text(self):
        result = preprocess_query("How LONG does the BATTERY last???")
        assert result["cleaned_query"] == "how long does the battery last"

    def test_aspect_battery(self):
        assert detect_aspect("How long does the battery last?") == "battery"

    def test_aspect_sound(self):
        assert detect_aspect("Is the audio quality good?") == "sound"

    def test_aspect_price(self):
        assert detect_aspect("Is this worth the money?") == "price"

    def test_aspect_build(self):
        assert detect_aspect("Is the build quality durable?") == "build"

    def test_aspect_general_fallback(self):
        assert detect_aspect("Tell me about this product") == "general"

    def test_intent_factual(self):
        assert detect_intent("What is the battery capacity?") == "factual"

    def test_intent_recommendation(self):
        assert detect_intent("Should I buy this?") == "recommendation"

    def test_intent_comparison(self):
        assert detect_intent("How does it compare to the old model?") == "comparison"

    def test_full_pipeline(self):
        result = preprocess_query("How is the battery life compared to other headphones?")
        assert result["aspect"] == "battery"
        assert result["intent"] == "comparison"
        assert isinstance(result["tokens"], list)
        assert len(result["tokens"]) > 0


# ── Explainability Tests ─────────────────────────────────────────────────────

class TestExplainability:
    def setup_method(self):
        self.explainer = ExplainabilityModule()

    def test_empty_chunks(self):
        result = self.explainer.explain(chunks=[], answer="", query="test")
        assert result["confidence"] == 0.0
        assert result["evidence"] == []

    def test_confidence_range(self):
        chunks = [
            {"text": "Great battery life!", "source": "review", "sentiment": "positive",
             "aspect": "battery", "relevance_score": 0.9},
            {"text": "Lasts all day.", "source": "review", "sentiment": "positive",
             "aspect": "battery", "relevance_score": 0.85},
        ]
        result = self.explainer.explain(chunks=chunks, answer="Battery lasts 10 hours.", query="battery?")
        assert 0.0 <= result["confidence"] <= 1.0

    def test_sentiment_summary(self):
        chunks = [
            {"text": "Great!", "source": "review", "sentiment": "positive",
             "aspect": "general", "relevance_score": 0.8},
            {"text": "Okay.", "source": "review", "sentiment": "neutral",
             "aspect": "general", "relevance_score": 0.6},
            {"text": "Bad.", "source": "review", "sentiment": "negative",
             "aspect": "general", "relevance_score": 0.5},
        ]
        result = self.explainer.explain(chunks=chunks, answer="Mixed reviews.", query="quality?")
        summary = result["sentiment_summary"]
        assert summary["positive"] == 1
        assert summary["neutral"] == 1
        assert summary["negative"] == 1

    def test_evidence_truncation(self):
        long_text = "A" * 500
        chunks = [{"text": long_text, "source": "review", "sentiment": "positive",
                   "aspect": "general", "relevance_score": 0.7}]
        result = self.explainer.explain(chunks=chunks, answer="Some answer.", query="test?")
        assert len(result["evidence"][0]["text"]) <= 210  # 200 chars + "..."
