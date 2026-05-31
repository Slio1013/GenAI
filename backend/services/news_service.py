"""
News fetching service.
Finnhub API
"""
import os
import httpx
import uuid
from datetime import datetime, timezone
from bs4 import BeautifulSoup
from urllib.parse import urlparse

FINNHUB_API_KEY = os.getenv("FINNHUB_API_KEY", "")
FINNHUB_BASE_URL = "https://finnhub.io/api/v1"

async def fetch_news_finnhub(category: str = "general", count: int = 40) -> list[dict]:
    """Fetch news from Finnhub API."""
    if not FINNHUB_API_KEY:
        raise Exception("Finnhub API key is not configured in the environment.")

    async with httpx.AsyncClient(timeout=10) as client:
        try:
            resp = await client.get(
                f"{FINNHUB_BASE_URL}/news",
                params={"category": category, "token": FINNHUB_API_KEY}
            )
            resp.raise_for_status()
            articles = resp.json()[:count]

            return [
                {
                    "id": str(article.get("id", uuid.uuid4())),
                    "title": article.get("headline", "No title"),
                    "summary": article.get("summary", "")[:400],
                    "source": article.get("source", "Finnhub"),
                    "timestamp": datetime.fromtimestamp(
                        article.get("datetime", 0), tz=timezone.utc
                    ).isoformat(),
                    "url": article.get("url", "#"),
                }
                for article in articles
                if article.get("headline")
            ]
        except Exception as e:
            print(f"Finnhub fetch error: {e}")
            raise Exception(f"Finnhub API error: {e}")


async def get_news(count: int = 40) -> list[dict]:
    """Main news fetching function. Uses Finnhub API."""
    return await fetch_news_finnhub(count=count)


async def scrape_article_from_url(url: str) -> dict:
    """Scrape title and summary from an arbitrary news URL."""
    async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
        try:
            headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}
            resp = await client.get(url, headers=headers)
            resp.raise_for_status()
            
            soup = BeautifulSoup(resp.content, "lxml")
            
            title = ""
            og_title = soup.find("meta", property="og:title")
            if og_title and og_title.get("content"):
                title = og_title["content"]
            elif soup.title and soup.title.string:
                title = soup.title.string
                
            if not title:
                raise Exception("Could not extract article title")
                
            summary = ""
            og_desc = soup.find("meta", property="og:description")
            if og_desc and og_desc.get("content"):
                summary = og_desc["content"]
            else:
                paragraphs = soup.find_all("p")
                if paragraphs:
                    text_blocks = [p.get_text(strip=True) for p in paragraphs if len(p.get_text(strip=True)) > 40]
                    summary = " ".join(text_blocks[:3])
            
            summary = summary[:800]
            if not summary:
                summary = "No summary could be extracted from this article."
                
            timestamp_str = datetime.now(timezone.utc).isoformat()
            pub_time = soup.find("meta", property="article:published_time")
            if pub_time and pub_time.get("content"):
                timestamp_str = pub_time["content"]
            
            domain = urlparse(url).netloc.replace("www.", "")
            
            return {
                "id": str(uuid.uuid4()),
                "title": title.strip(),
                "summary": summary.strip(),
                "source": domain,
                "timestamp": timestamp_str,
                "url": url,
            }
        except httpx.HTTPStatusError as e:
            if e.response.status_code in (401, 403):
                raise Exception(f"This website actively blocks automated access (Status {e.response.status_code}). Try a different news source.")
            raise Exception(f"Failed to extract article from URL: HTTP {e.response.status_code}")
        except Exception as e:
            print(f"Scraping error: {e}")
            raise Exception(f"Failed to extract article from URL: {e}")
