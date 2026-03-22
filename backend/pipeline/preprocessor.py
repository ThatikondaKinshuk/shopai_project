"""
NLP Preprocessing Pipeline
- Query cleaning and normalization
- Aspect detection from user questions
- Intent classification
"""

import re
from typing import Dict, List

# Aspect keyword mapping
ASPECT_KEYWORDS = {
    "battery": ["battery", "charge", "charging", "power", "last", "drain", "mah", "hours"],
    "sound": ["sound", "audio", "bass", "treble", "volume", "noise", "music", "speaker", "mic", "microphone"],
    "build": ["build", "quality", "material", "durable", "sturdy", "solid", "plastic", "metal", "premium"],
    "comfort": ["comfort", "comfortable", "fit", "wear", "ergonomic", "light", "weight", "heavy"],
    "price": ["price", "cost", "worth", "value", "money", "cheap", "expensive", "affordable", "budget"],
    "connectivity": ["bluetooth", "wifi", "connect", "pair", "signal", "wireless", "range", "lag"],
    "display": ["screen", "display", "resolution", "bright", "color", "pixel", "sharp", "hdr", "refresh"],
    "performance": ["fast", "slow", "performance", "speed", "lag", "responsive", "processor", "ram"],
    "camera": ["camera", "photo", "video", "picture", "megapixel", "lens", "zoom", "selfie"],
    "general": [],
}

STOPWORDS = {
    "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "shall", "can", "need", "dare", "ought",
    "used", "to", "of", "in", "for", "on", "with", "at", "by", "from",
    "as", "into", "through", "during", "before", "after", "above", "below",
    "this", "that", "these", "those", "it", "its", "what", "which", "who",
    "whom", "how", "when", "where", "why", "all", "both", "each", "few",
    "more", "most", "other", "some", "such", "no", "not", "only", "own",
    "same", "so", "than", "too", "very", "just", "but", "and", "or",
    "i", "me", "my", "we", "our", "you", "your", "he", "she", "they",
}


def clean_text(text: str) -> str:
    """Remove special characters, extra spaces, lowercase."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s\?\!\.]", "", text)
    text = re.sub(r"\s+", " ", text)
    return text


def remove_stopwords(text: str) -> List[str]:
    """Tokenize and remove stopwords."""
    tokens = text.split()
    return [t for t in tokens if t not in STOPWORDS and len(t) > 1]


def detect_aspect(query: str) -> str:
    """
    Detects the most relevant product aspect from the query.
    Returns aspect label like 'battery', 'sound', 'price', etc.
    """
    query_lower = query.lower()
    scores = {}

    for aspect, keywords in ASPECT_KEYWORDS.items():
        if aspect == "general":
            continue
        score = sum(1 for kw in keywords if kw in query_lower)
        if score > 0:
            scores[aspect] = score

    if not scores:
        return "general"

    return max(scores, key=scores.get)


def detect_intent(query: str) -> str:
    """
    Classify user intent: comparison, opinion, factual, recommendation.
    """
    query_lower = query.lower()

    if any(w in query_lower for w in ["better", "vs", "compare", "difference", "versus"]):
        return "comparison"
    if any(w in query_lower for w in ["should i", "recommend", "worth", "good for"]):
        return "recommendation"
    if any(w in query_lower for w in ["how long", "how many", "what is", "specs", "specification"]):
        return "factual"
    if any(w in query_lower for w in ["do people", "do customers", "most reviewers", "common complaint"]):
        return "opinion_aggregation"

    return "general_qa"


def preprocess_query(query: str) -> Dict:
    """
    Full preprocessing pipeline for user queries.
    Returns cleaned query, tokens, detected aspect and intent.
    """
    cleaned = clean_text(query)
    tokens = remove_stopwords(cleaned)
    aspect = detect_aspect(query)
    intent = detect_intent(query)

    return {
        "original_query": query,
        "cleaned_query": cleaned,
        "tokens": tokens,
        "aspect": aspect,
        "intent": intent,
        "search_query": " ".join(tokens),
    }
