from dotenv import load_dotenv
load_dotenv() # This loads the environment variables from the .env file

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import news, analyze, reasoning

# 1. Create the backend application
app = FastAPI(
    title="Market Intelligence API",
    description="AI-powered financial market intelligence platform",
    version="1.0.0"
)

# 2. Allow the Frontend to talk to the Backend (CORS setup)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows requests from any website (Vercel, localhost, etc)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Register our API Routes (the URLs our frontend will call)
app.include_router(news.router, prefix="/news", tags=["News"])          # Handles fetching news
app.include_router(analyze.router, prefix="/analyze", tags=["Analysis"])    # Handles Groq AI sentiment
app.include_router(reasoning.router, prefix="/reasoning", tags=["Reasoning"]) # Handles Groq AI reasoning

# 4. A simple home route just to check if the server is running
@app.get("/")
async def root():
    return {"status": "ok", "message": "Market Intelligence API is running"}

# 5. A health check route used by hosting platforms like Render
@app.get("/health")
async def health():
    return {"status": "healthy"}
