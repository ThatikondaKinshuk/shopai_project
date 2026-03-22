"""
Explainable AI Product QA System - FastAPI Backend
Author: Kinshuk Jain | UMass Dartmouth MS Data Science
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uvicorn

from api.routes import router as qa_router

app = FastAPI(
    title="Explainable AI Product QA System",
    description="AI-powered product question answering using Amazon reviews and ChromaDB + Ollama",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(qa_router, prefix="/api/v1")


@app.get("/")
def root():
    return {"message": "Explainable AI Product QA API is running", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "healthy"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
