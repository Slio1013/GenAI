"""
Sentiment Analysis Service.
Uses FinBERT (local transformers model) for financial sentiment classification.
"""

import asyncio
from transformers import pipeline

print("Loading FinBERT model...")
try:
    classifier = pipeline("sentiment-analysis", model="ProsusAI/finbert")
    print("FinBERT model loaded successfully.")
except Exception as e:
    print(f"Error loading FinBERT model: {e}")
    classifier = None

def _run_classifier(text: str) -> dict:
    """Sync classification helper running FinBERT."""
    if classifier is None:
        return {"label": "neutral", "confidence": 0.5}
    try:
        # Pass truncation=True to prevent errors for text exceeding model sequence length
        result = classifier(text[:2000], truncation=True)
        if result and len(result) > 0:
            res = result[0]
            label = res.get("label", "neutral").lower()
            confidence = float(res.get("score", 0.5))
            return {"label": label, "confidence": confidence}
    except Exception as e:
        print(f"Error during FinBERT classification: {e}")
    return {"label": "neutral", "confidence": 0.5}

async def analyze_sentiment_async(text: str) -> dict:
    """
    Analyze sentiment of financial text using FinBERT.
    Runs the synchronous pipeline in a separate thread to avoid blocking the event loop.
    Returns: {"label": "positive|negative|neutral", "confidence": float}
    """
    return await asyncio.to_thread(_run_classifier, text)

def analyze_sentiment(text: str) -> dict:
    """Sync wrapper if needed."""
    return _run_classifier(text)
