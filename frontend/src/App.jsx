import React, { useState, useCallback, useEffect, useRef } from 'react'
import Header from './components/Header'
import NewsPanel from './components/NewsPanel'
import SentimentPanel from './components/SentimentPanel'
import SectorCards from './components/SectorCards'
import ReasoningPanel from './components/ReasoningPanel'
import StocksPanel from './components/StocksPanel'
import { fetchNews, analyzeArticle, getReasoning } from './services/api'

export default function App() {
  // ── 1. State Variables ──────────────────────────────────────────────────────
  // These variables hold the data for our app. When they change, the screen updates automatically.
  const [articles, setArticles] = useState([])                 // Stores the list of news articles
  const [selectedArticle, setSelectedArticle] = useState(null) // Which article the user clicked on

  // Caching: We save the analysis so we don't have to ask the AI twice for the same article
  const [analyses, setAnalyses] = useState({})

  // Current selected article's AI data
  const [currentAnalysis, setCurrentAnalysis] = useState(null)   // Sentiment & Sectors
  const [currentReasoning, setCurrentReasoning] = useState(null) // Groq Reasoning

  // Loading states (shows spinners on the screen)
  const [isLoadingNews, setIsLoadingNews] = useState(false)
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false)
  const [isLoadingReasoning, setIsLoadingReasoning] = useState(false)

  const [error, setError] = useState(null)
  const selectedArticleIdRef = useRef(null)

  // ── 2. Load News When App Starts ────────────────────────────────────────────
  // useEffect runs this code once when the page first loads
  useEffect(() => {
    loadNews()
  }, [])

  // Function to fetch the news from our backend
  const loadNews = async () => {
    setIsLoadingNews(true)
    setError(null)
    try {
      const data = await fetchNews(8) // Get 8 articles
      setArticles(data.articles || [])
      
      // Bonus: Automatically run a quick AI analysis in the background for all articles
      if (data.articles?.length > 0) {
        backgroundAnalyzeAll(data.articles)
      }
    } catch (err) {
      setError('Failed to fetch news. Check if backend is running.')
      console.error(err)
    } finally {
      setIsLoadingNews(false)
    }
  }

  // A helper to analyze all articles silently in the background
  const backgroundAnalyzeAll = async (articleList) => {
    const batch = articleList.map(async (article) => {
      try {
        const result = await analyzeArticle({
          article_id: article.id,
          title: article.title,
          summary: article.summary,
        })
        // Save the result in our cache
        setAnalyses((prev) => ({ ...prev, [article.id]: result }))
      } catch (e) {
        // We silently ignore errors in the background
      }
    })
    await Promise.allSettled(batch)
  }

  // ── 3. What Happens When You Click An Article ───────────────────────────────
  const handleArticleSelect = useCallback(async (article) => {
    setSelectedArticle(article)
    selectedArticleIdRef.current = article.id

    // Check if we already analyzed this article before
    const cached = analyses[article.id]
    if (cached) {
      if (selectedArticleIdRef.current === article.id) {
        setCurrentAnalysis(cached) // Load it from memory instantly
      }
      await fetchReasoning(article, cached) // Fetch the deeper reasoning
      return
    }

    // If we haven't analyzed it yet, start loading...
    setIsLoadingAnalysis(true)
    setCurrentAnalysis(null)
    setCurrentReasoning(null)

    try {
      // Step A: Get Sentiment (Positive/Negative) and Sectors
      const analysis = await analyzeArticle({
        article_id: article.id,
        title: article.title,
        summary: article.summary,
      })
      
      if (selectedArticleIdRef.current === article.id) {
        setCurrentAnalysis(analysis)
        setIsLoadingAnalysis(false)
      }
      
      // Save it to our cache
      setAnalyses((prev) => ({ ...prev, [article.id]: analysis }))

      // Step B: Ask Groq for deep reasoning based on this analysis
      await fetchReasoning(article, analysis)
    } catch (err) {
      if (selectedArticleIdRef.current === article.id) {
        setError('Analysis failed. Check backend connection.')
        setIsLoadingAnalysis(false)
      }
    }
  }, [analyses])

  // ── 4. Fetch Deep Reasoning from Groq AI ────────────────────────────────────
  const fetchReasoning = async (article, analysis) => {
    const sectors = analysis?.sectors || ['general']
    const sentiment = analysis?.sentiment?.label || 'neutral'

    if (selectedArticleIdRef.current === article.id) {
      setIsLoadingReasoning(true)
    }

    try {
      // Send the article info to our backend (which talks to Groq)
      const reasoning = await getReasoning({ 
        title: article.title, 
        summary: article.summary, 
        sentiment, 
        sectors 
      })
      if (selectedArticleIdRef.current === article.id) {
        setCurrentReasoning(reasoning)
      }
    } catch (err) {
      console.error(err)
    } finally {
      if (selectedArticleIdRef.current === article.id) {
        setIsLoadingReasoning(false)
      }
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-surface-900">
      {/* Ambient background glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-brand-700/10 blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-80 h-80 rounded-full bg-purple-700/8 blur-3xl" />
        <div className="absolute -bottom-20 left-1/3 w-72 h-72 rounded-full bg-brand-600/8 blur-3xl" />
      </div>

      {/* Header */}
      <Header onRefresh={loadNews} isLoading={isLoadingNews} />

      {/* Main content */}
      <main className="relative z-10 max-w-[1600px] mx-auto px-4 sm:px-6 py-6">

        {/* Error banner */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-200"
            >
              ✕
            </button>
          </div>
        )}

        {/* ── Row 1: News Feed + Sentiment + Stocks ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr_280px] gap-4 mb-4">
          {/* News Feed */}
          <div className="lg:row-span-2 min-h-[500px] lg:max-h-[700px]">
            <NewsPanel
              articles={articles}
              selectedArticle={selectedArticle}
              onSelect={handleArticleSelect}
              analyses={analyses}
              isLoading={isLoadingNews}
            />
          </div>

          {/* Sentiment */}
          <SentimentPanel
            analysis={currentAnalysis}
            isLoading={isLoadingAnalysis}
            article={selectedArticle}
          />

          {/* Stocks */}
          <div className="lg:row-span-2">
            <StocksPanel
              reasoning={currentReasoning}
              isLoading={isLoadingReasoning}
            />
          </div>

          {/* AI Reasoning */}
          <ReasoningPanel
            reasoning={currentReasoning}
            isLoading={isLoadingReasoning}
          />
        </div>

        {/* ── Row 2: Sector Impact ── */}
        <div className="mb-4">
          <SectorCards
            analysis={currentAnalysis}
            isLoading={isLoadingAnalysis}
          />
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-[11px] text-slate-600 font-mono">
          Geo Alpha · Groq AI Sentiment & Reasoning
          <span className="mx-2">·</span>
          Not financial advice
        </footer>
      </main>
    </div>
  )
}
