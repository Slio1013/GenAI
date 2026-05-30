"""
Groq AI Reasoning Service.
Uses Groq API (llama3-8b-8192) to generate economic reasoning.
Only generates human-readable explanations - no prediction models.
"""

import os
import httpx
import json
from typing import Optional

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.1-8b-instant"


def _build_analysis_prompt(title: str, summary: str, sentiment: str, sectors: list[str]) -> str:
    """Build the analyst-style prompt for Groq."""
    sector_list = ", ".join(sectors)

    return f"""You are a senior financial analyst providing concise market intelligence.

NEWS: {title}
SUMMARY: {summary}
SENTIMENT: {sentiment}
AFFECTED SECTORS: {sector_list}

Respond ONLY with a valid JSON object (no markdown, no explanation):
{{
  "economic_reasoning": "2-3 sentence explanation of the economic implications",
  "chain_reaction": "Step-by-step chain of economic effects (3-4 steps, use → between steps)",
  "sector_impact": "1-2 sentence explanation of sector-level impact",
  "bullish_sectors": ["sector1", "sector2"],
  "bearish_sectors": ["sector1", "sector2"],
  "stock_suggestions": [
    {{
      "ticker": "TICKER1",
      "company": "Company Name 1",
      "direction": "bullish",
      "sector": "sector_name",
      "reason": "Specific 1-sentence reason why this stock is bullish."
    }},
    ...
  ]
}}

Requirements for stock_suggestions:
- Include exactly 3 bullish stock suggestions (direction is "bullish") that stand to benefit.
- Include exactly 3 bearish stock suggestions (direction is "bearish") that are negatively impacted.
- Total of exactly 6 suggestions.
- Be concise, specific, and analytical. Use real, valid stock ticker symbols."""


async def generate_reasoning(
    title: str,
    summary: str,
    sentiment: str,
    sectors: list[str]
) -> dict:
    """
    Generate economic reasoning using Groq API.
    Raises exception if API call fails or key is missing.
    """
    if not GROQ_API_KEY:
        raise Exception("GROQ_API_KEY environment variable is not set in backend/.env")

    prompt = _build_analysis_prompt(title, summary, sentiment, sectors)

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": GROQ_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.3,       # Low temperature for consistent analysis
        "max_tokens": 1000,
        "response_format": {"type": "json_object"},
    }

    async with httpx.AsyncClient(timeout=20) as client:
        try:
            resp = await client.post(GROQ_API_URL, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            content = data["choices"][0]["message"]["content"]

            # Parse the JSON response
            result = json.loads(content)

            suggestions = result.get("stock_suggestions", [])
            formatted_suggestions = []
            for s in suggestions:
                direction = str(s.get("direction", "bullish")).lower()
                if direction not in ["bullish", "bearish"]:
                    direction = "bullish"
                formatted_suggestions.append({
                    "ticker": str(s.get("ticker", "")).upper(),
                    "company": str(s.get("company", "")),
                    "direction": direction,
                    "sector": str(s.get("sector", "general")).lower(),
                    "reason": str(s.get("reason", "Indirect impact from market events."))
                })

            # Ensure all required fields exist
            return {
                "economic_reasoning": result.get("economic_reasoning", "Analysis unavailable"),
                "chain_reaction": result.get("chain_reaction", "Chain analysis unavailable"),
                "sector_impact": result.get("sector_impact", "Sector analysis unavailable"),
                "bullish_sectors": result.get("bullish_sectors", []),
                "bearish_sectors": result.get("bearish_sectors", []),
                "stock_suggestions": formatted_suggestions,
            }

        except json.JSONDecodeError as e:
            print(f"Groq JSON parse error: {e}")
            raise Exception(f"Failed to parse Groq response as JSON: {e}")
        except httpx.HTTPError as e:
            print(f"Groq API HTTP error: {e}")
            raise Exception(f"Groq API request failed with HTTP error: {e}")
        except Exception as e:
            print(f"Groq API error: {e}")
            raise Exception(f"Groq API request failed: {e}")
