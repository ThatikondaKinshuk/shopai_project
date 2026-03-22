# 🛍️ ShopMind AI — Explainable Product Question Answering System

> **Master's Capstone Project · UMass Dartmouth · MS Data Science**
> An end-to-end AI system that lets users ask natural language questions about e-commerce products and receive grounded, explainable answers — powered by ChromaDB, Ollama (Llama 3), and React.

---

![CI Pipeline](https://github.com/YOUR_USERNAME/ecom-qa-system/actions/workflows/ci.yml/badge.svg)
![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?logo=fastapi)
![ChromaDB](https://img.shields.io/badge/ChromaDB-Vector_DB-orange)
![Ollama](https://img.shields.io/badge/Ollama-Local_LLM-black)

---

## 📌 Problem Statement

E-commerce platforms present thousands of reviews and product specs that overwhelm users. Existing platforms lack an intelligent interface that can interpret specific user questions and deliver precise, evidence-backed answers.

**ShopMind AI** solves this with a full RAG (Retrieval-Augmented Generation) pipeline that:
- Understands what aspect the user is asking about (battery, sound, comfort, price…)
- Retrieves the most semantically relevant review snippets and metadata using vector search
- Generates a concise, grounded answer via a locally-running LLM
- Explains *why* it answered that way — with confidence scores, source attribution, and sentiment breakdowns

---

## 🏗️ System Architecture

```
Amazon Product Reviews + Metadata
          │
          ▼
  NLP Preprocessing
  (tokenization, aspect detection, intent classification)
          │
          ▼
  ChromaDB Vector Store
  (sentence-transformers/all-MiniLM-L6-v2 embeddings)
          │
          ▼
  Semantic Retrieval (top-k relevant chunks)
          │
          ▼
  Ollama / Llama 3 (local, no API key)
  (RAG-prompted answer generation)
          │
          ▼
  Explainability Layer
  (confidence score, evidence attribution, sentiment summary)
          │
          ▼
  FastAPI Backend ↔ React Frontend
```

---

## ✨ Features

| Feature | Description |
|---|---|
| **Natural Language QA** | Ask any product question in plain English |
| **Semantic Retrieval** | ChromaDB + sentence-transformers for vector similarity search |
| **Local LLM (Ollama)** | Llama 3 / Mistral — zero API cost, full privacy |
| **Explainability** | Confidence score, evidence sources, sentiment attribution per answer |
| **Aspect Detection** | Auto-detects query intent: battery, sound, price, build, comfort… |
| **Aspect Sentiment** | Per-aspect positive/neutral/negative breakdown across all reviews |
| **Product Browsing** | Search and filter products by category and keyword |
| **Production-ready** | Docker Compose, Nginx, GitHub Actions CI |

---

## 🛠️ Tech Stack

### Backend
| Tool | Purpose |
|---|---|
| **FastAPI** | REST API server |
| **ChromaDB** | Vector database for semantic search |
| **sentence-transformers** | `all-MiniLM-L6-v2` for embedding generation |
| **Ollama** | Local LLM inference (Llama 3, Mistral, Phi-3) |
| **Pydantic v2** | Data validation and API schemas |

### Frontend
| Tool | Purpose |
|---|---|
| **React 18** | UI framework |
| **Vite** | Fast build tool |
| **TanStack Query** | Data fetching and caching |
| **Tailwind CSS** | Utility-first styling |
| **Framer Motion** | Animations |
| **Recharts** | Sentiment visualizations |
| **lucide-react** | Icon system |

### Infrastructure
| Tool | Purpose |
|---|---|
| **Docker Compose** | Multi-service orchestration |
| **Nginx** | Production frontend serving + API proxy |
| **GitHub Actions** | CI pipeline (lint, test, build) |

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Python 3.11+
- Node.js 20+
- [Ollama](https://ollama.ai) installed

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/ecom-qa-system.git
cd ecom-qa-system
```

### 2. Run the setup script
```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

This will:
- Install all Python + Node dependencies
- Pull the Llama 3 model via Ollama
- Generate the Amazon-style sample dataset
- Index everything into ChromaDB

### 3. Start the servers

**Terminal 1 — Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

### 4. Open the app
```
http://localhost:3000
```

API docs available at: `http://localhost:8000/docs`

---

## 🐳 Docker (Production)

```bash
# Start all services
docker compose up --build

# Access
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

To pull an Ollama model inside Docker:
```bash
docker exec -it shopmind_ollama ollama pull llama3
```

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/ask` | Ask a question about a product |
| `GET` | `/api/v1/products` | Browse/search products |
| `GET` | `/api/v1/products/{id}` | Get product details |
| `GET` | `/api/v1/products/{id}/aspects` | Get aspect sentiment breakdown |
| `GET` | `/api/v1/stats` | System stats |
| `GET` | `/health` | Health check |

### Example: Ask a question
```bash
curl -X POST http://localhost:8000/api/v1/ask \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "ABCD1234EF",
    "question": "How long does the battery last?",
    "top_k": 5
  }'
```

**Response:**
```json
{
  "answer": "Based on customer reviews, the battery lasts approximately 8-10 hours with regular use...",
  "confidence": 0.82,
  "aspect_detected": "battery",
  "response_time_ms": 1240.5,
  "evidence": [
    {
      "text": "Battery life is outstanding. Lasts all day on a single charge.",
      "source": "review",
      "sentiment": "positive",
      "relevance_score": 0.91,
      "aspect": "battery"
    }
  ],
  "sentiment_summary": {
    "positive": 14,
    "neutral": 3,
    "negative": 2,
    "positive_pct": 74,
    "neutral_pct": 16,
    "negative_pct": 10
  }
}
```

---

## 📁 Project Structure

```
ecom-qa-system/
├── backend/
│   ├── main.py                    # FastAPI entrypoint
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── api/
│   │   └── routes.py              # All API route handlers
│   ├── pipeline/
│   │   └── preprocessor.py        # NLP preprocessing + aspect detection
│   ├── retrieval/
│   │   └── chroma_store.py        # ChromaDB indexing + semantic retrieval
│   ├── llm/
│   │   └── ollama_client.py       # Ollama client + RAG prompting
│   ├── explainability/
│   │   └── explainer.py           # Confidence + evidence + sentiment
│   └── data/
│       └── ingestion.py           # Dataset generation/loading
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                # Router + layout
│   │   ├── main.jsx               # React entry
│   │   ├── index.css              # Tailwind + global styles
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── ConfidenceMeter.jsx
│   │   │   ├── SentimentBar.jsx
│   │   │   ├── EvidencePanel.jsx
│   │   │   └── AspectRadar.jsx
│   │   ├── pages/
│   │   │   ├── HomePage.jsx
│   │   │   ├── BrowsePage.jsx
│   │   │   └── ProductPage.jsx
│   │   └── utils/
│   │       └── api.js             # Axios API client
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── vite.config.js
│   └── package.json
│
├── scripts/
│   └── setup.sh                   # One-command local setup
├── docker-compose.yml
├── .github/
│   └── workflows/
│       └── ci.yml                 # GitHub Actions CI
└── README.md
```

---

## 🔬 Evaluation Metrics

The system is evaluated on three axes as described in the project proposal:

**Technical Metrics**
- Retrieval Precision@k (relevant chunks retrieved / total retrieved)
- Answer Relevance Score (ChromaDB cosine similarity of answer vs. query)
- API Response Time (target < 2s for retrieval, < 30s with LLM generation)

**Explainability Metrics**
- Confidence calibration (does high confidence → better answers?)
- Evidence attribution accuracy (do retrieved chunks support the answer?)
- Aspect detection accuracy

**User-Centric (Survey)**
- 5-point Likert scale: answer helpfulness, clarity, trustworthiness
- A/B comparison: reviews-only vs. metadata-only vs. combined approach

---

## 🗺️ Roadmap

- [ ] Fine-tune embedding model on Amazon product review domain
- [ ] Add multi-product comparison QA
- [ ] Integrate real Amazon Reviews 2023 dataset (McAuley Lab)
- [ ] Add user feedback loop (thumbs up/down per answer)
- [ ] Evaluation dashboard with retrieval metrics
- [ ] LangChain integration for conversational memory

---

## 👤 Author

**Kinshuk Thatikonda**
MS Data Science · University of Massachusetts Dartmouth · GPA 3.83/4.0
Data Analyst / Data Engineer @ L.L.Bean

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue?logo=linkedin)](https://linkedin.com/in/YOUR_HANDLE)
[![GitHub](https://img.shields.io/badge/GitHub-Follow-black?logo=github)](https://github.com/YOUR_USERNAME)

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.
