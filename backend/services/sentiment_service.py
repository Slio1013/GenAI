"""
Sentiment Analysis Service.
Uses Groq API (llama-3.1-8b-instant) instead of FinBERT to save memory on Render Free Tier.
"""

import os
import httpx
import json
import asyncio

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.1-8b-instant"

def _build_sentiment_prompt(text: str) -> str:
    """Build the prompt for Groq to classify sentiment."""
    return f"""You are a financial sentiment analyzer.
Analyze the following financial text and determine the sentiment.
Respond ONLY with a valid JSON object in this exact format (no markdown, no explanation):
{{
  "label": "positive" or "negative" or "neutral",
  "confidence": 0.0 to 1.0
}}

TEXT: {text}"""

async def analyze_sentiment_async(text: str) -> dict:
    """
    Analyze sentiment of financial text using Groq.
    Returns: {"label": "positive|negative|neutral", "confidence": float}
    """
    if not GROQ_API_KEY:
        print("Warning: GROQ_API_KEY is not set. Defaulting to neutral.")
        return {"label": "neutral", "confidence": 0.5}

    prompt = _build_sentiment_prompt(text[:2000]) # limit text length

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": GROQ_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.1,
        "max_tokens": 100,
        "response_format": {"type": "json_object"},
    }

    async with httpx.AsyncClient(timeout=15) as client:
        try:
            resp = await client.post(GROQ_API_URL, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            content = data["choices"][0]["message"]["content"]
            result = json.loads(content)
            
            label = result.get("label", "neutral").lower()
            if label not in ["positive", "negative", "neutral"]:
                label = "neutral"
                
            try:
                confidence = float(result.get("confidence", 0.5))
            except ValueError:
                confidence = 0.5
                
            return {
                "label": label,
                "confidence": confidence,
            }

        except Exception as e:
            print(f"Groq Sentiment API error: {e}")
            return {"label": "neutral", "confidence": 0.5}

def analyze_sentiment(text: str) -> dict:
    """Sync wrapper if needed."""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            raise Exception("Cannot run sync function in running loop")
        return loop.run_until_complete(analyze_sentiment_async(text))
    except RuntimeError:
        return asyncio.run(analyze_sentiment_async(text))
