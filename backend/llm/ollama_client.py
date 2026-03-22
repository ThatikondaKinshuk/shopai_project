"""
Ollama LLM Client
Connects to locally running Ollama instance (llama3 or mistral)
No API key required — fully local inference
"""

import requests
import json
from typing import Optional

OLLAMA_BASE_URL = "http://localhost:11434"
DEFAULT_MODEL = "llama3"  # Change to "mistral" or "phi3" based on what you have pulled


SYSTEM_PROMPT = """You are an expert product assistant for an e-commerce platform.
Your job is to answer customer questions about specific products based on:
1. Official product metadata (description, specifications, price)
2. Real customer reviews and feedback

Guidelines:
- Be concise, clear, and helpful
- Ground your answer in the provided context
- If the context doesn't fully answer the question, acknowledge what you know
- Use a friendly, professional tone
- Keep answers under 100 words unless detail is specifically requested
"""


def build_prompt(question: str, context: str, aspect: str) -> str:
    aspect_note = f"\nFocus on the '{aspect}' aspect of this product." if aspect != "general" else ""

    return f"""{SYSTEM_PROMPT}

Product Context:
{context}
{aspect_note}

Customer Question: {question}

Answer:"""


class OllamaClient:
    def __init__(self, model: str = DEFAULT_MODEL, base_url: str = OLLAMA_BASE_URL):
        self.model = model
        self.base_url = base_url
        self._check_connection()

    def _check_connection(self):
        try:
            resp = requests.get(f"{self.base_url}/api/tags", timeout=3)
            if resp.status_code == 200:
                models = [m["name"] for m in resp.json().get("models", [])]
                if models:
                    print(f"✅ Ollama connected. Available models: {models}")
                    # Auto-select available model
                    preferred = ["llama3", "llama3:8b", "mistral", "phi3", "gemma"]
                    for pref in preferred:
                        if any(pref in m for m in models):
                            self.model = next(m for m in models if pref in m)
                            print(f"✅ Using model: {self.model}")
                            break
                else:
                    print("⚠️  Ollama running but no models found. Run: ollama pull llama3")
        except requests.exceptions.ConnectionError:
            print("⚠️  Ollama not running. Start with: ollama serve")
            print("   Then pull a model: ollama pull llama3")

    def generate_answer(
        self,
        question: str,
        context: str,
        aspect: str = "general",
        temperature: float = 0.3,
        max_tokens: int = 300,
    ) -> str:
        """
        Generate an answer using Ollama with RAG context.
        Falls back to context-based summary if Ollama is unavailable.
        """
        prompt = build_prompt(question=question, context=context, aspect=aspect)

        try:
            response = requests.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": temperature,
                        "num_predict": max_tokens,
                        "top_p": 0.9,
                    },
                },
                timeout=60,
            )

            if response.status_code == 200:
                result = response.json()
                return result.get("response", "").strip()
            else:
                return self._fallback_answer(context, question)

        except requests.exceptions.ConnectionError:
            return self._fallback_answer(context, question)
        except Exception as e:
            return f"Error generating answer: {str(e)}"

    def _fallback_answer(self, context: str, question: str) -> str:
        """
        Rule-based fallback when Ollama is not available.
        Extracts the most relevant snippet from context.
        """
        lines = [line.strip() for line in context.split(".") if len(line.strip()) > 20]
        if lines:
            return (
                f"Based on available product information: {lines[0]}. "
                f"(Note: AI model offline — showing retrieved context)"
            )
        return "I couldn't find specific information to answer your question. Please check the product details."

    def list_models(self):
        """List all available Ollama models."""
        try:
            resp = requests.get(f"{self.base_url}/api/tags", timeout=3)
            return [m["name"] for m in resp.json().get("models", [])]
        except Exception:
            return []
