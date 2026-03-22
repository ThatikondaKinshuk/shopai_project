#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# ShopMind AI — Local Development Setup Script
# Explainable AI Product QA System
# Author: Kinshuk Jain | UMass Dartmouth MS Data Science
# ─────────────────────────────────────────────────────────────────────────────

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

info()    { echo -e "${BLUE}[INFO]${NC}  $1"; }
success() { echo -e "${GREEN}[OK]${NC}    $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

echo ""
echo "  ╔═══════════════════════════════════════════╗"
echo "  ║     ShopMind AI — Setup Script            ║"
echo "  ║     Explainable Product QA System         ║"
echo "  ╚═══════════════════════════════════════════╝"
echo ""

# ── 1. Check Python ──────────────────────────────────────────────────────────
info "Checking Python version..."
python3 --version &>/dev/null || error "Python 3 not found. Install from https://python.org"
PY_VER=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
info "Python $PY_VER detected"

# ── 2. Check Node ────────────────────────────────────────────────────────────
info "Checking Node.js version..."
node --version &>/dev/null || error "Node.js not found. Install from https://nodejs.org"
success "Node $(node --version) detected"

# ── 3. Check Ollama ──────────────────────────────────────────────────────────
info "Checking Ollama..."
if ! command -v ollama &>/dev/null; then
  warn "Ollama not found. Installing..."
  curl -fsSL https://ollama.ai/install.sh | sh
else
  success "Ollama $(ollama --version) detected"
fi

# ── 4. Start Ollama and pull model ───────────────────────────────────────────
info "Starting Ollama server..."
ollama serve &>/dev/null &
sleep 2

info "Checking for llama3 model..."
if ollama list 2>/dev/null | grep -q "llama3"; then
  success "llama3 model already available"
else
  info "Pulling llama3 model (~4.7GB — this may take a while)..."
  ollama pull llama3 || warn "Could not pull llama3. Trying mistral..."
  ollama pull mistral || warn "Could not pull mistral. You can pull any model manually: ollama pull phi3"
fi

# ── 5. Backend setup ─────────────────────────────────────────────────────────
info "Setting up Python backend..."
cd backend

if [ ! -d "venv" ]; then
  python3 -m venv venv
  success "Virtual environment created"
fi

source venv/bin/activate
pip install --upgrade pip -q
pip install -r requirements.txt -q
success "Backend dependencies installed"

# Pre-generate sample data + ChromaDB index
info "Generating sample Amazon dataset and indexing into ChromaDB..."
python3 -c "
from data.ingestion import load_or_generate_data
from retrieval.chroma_store import ChromaRetriever
data = load_or_generate_data()
print(f'  → {len(data[\"products\"])} products, {len(data[\"reviews\"])} reviews')
retriever = ChromaRetriever()
stats = retriever.get_stats()
print(f'  → ChromaDB: {stats[\"total_review_chunks\"]} chunks indexed')
"
success "Data pipeline ready"
deactivate
cd ..

# ── 6. Frontend setup ────────────────────────────────────────────────────────
info "Setting up React frontend..."
cd frontend
npm install -q
success "Frontend dependencies installed"
cd ..

# ── 7. Summary ───────────────────────────────────────────────────────────────
echo ""
echo "  ✅  Setup complete! Start the app with:"
echo ""
echo "  Terminal 1 (Backend):"
echo "    cd backend && source venv/bin/activate && uvicorn main:app --reload"
echo ""
echo "  Terminal 2 (Frontend):"
echo "    cd frontend && npm run dev"
echo ""
echo "  Then open: http://localhost:3000"
echo ""
