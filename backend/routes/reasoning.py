"""
/reasoning endpoint - generates AI economic reasoning via Groq
"""

from fastapi import APIRouter, HTTPException
from models.schemas import ReasoningRequest
from services.reasoning_service import generate_reasoning

router = APIRouter()


@router.post("/")
async def get_reasoning(request: ReasoningRequest):
    """
    Generate comprehensive economic reasoning for a news event.
    Uses Groq (llama3) for analyst-style explanations.
    Includes bullish/bearish stock suggestions.
    """
    try:
        # Generate AI reasoning
        reasoning = await generate_reasoning(
            title=request.title,
            summary=request.summary,
            sentiment=request.sentiment,
            sectors=request.sectors,
        )

        # Extract stock suggestions
        stocks = reasoning.get("stock_suggestions", [])

        # Separate reasoning details from stock suggestions
        reasoning_details = {k: v for k, v in reasoning.items() if k != "stock_suggestions"}

        return {
            "reasoning": reasoning_details,
            "stock_suggestions": stocks,
        }
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
