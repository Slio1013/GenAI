import React, { useState, useCallback, useEffect, useRef } from 'react'
import Header from './components/Header'
import NewsPanel from './components/NewsPanel'
import SentimentPanel from './components/SentimentPanel'
import SectorCards from './components/SectorCards'
import ReasoningPanel from './components/ReasoningPanel'
import StocksPanel from './components/StocksPanel'
import ScenarioPanel from './components/ScenarioPanel'
import { fetchNews, analyzeArticle, getReasoning, ingestArticleUrl } from './services/api'

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

  // Scenario Sandbox specific states
  const [activeMode, setActiveMode] = useState('news') // 'news' | 'scenario'
  const [scenarioData, setScenarioData] = useState(null)
  const [scenarioAnalysis, setScenarioAnalysis] = useState(null)
  const [scenarioReasoning, setScenarioReasoning] = useState(null)
  const [isLoadingScenarioAnalysis, setIsLoadingScenarioAnalysis] = useState(false)
  const [isLoadingScenarioReasoning, setIsLoadingScenarioReasoning] = useState(false)

  const [error, setError] = useState(null)
  const selectedArticleIdRef = useRef(null)

  // Function to analyze custom scenarios
  const handleAnalyzeScenario = async (scenarioText) => {
    setIsLoadingScenarioAnalysis(true)
    setIsLoadingScenarioReasoning(true)
    setScenarioAnalysis(null)
    setScenarioReasoning(null)
    setError(null)

    // Extract a short title (first sentence or first 80 characters)
    let title = scenarioText.split(/[.!?]\s/)[0]
    if (title.length > 80) {
      title = title.substring(0, 77) + '...'
    }
    const summary = scenarioText
    setScenarioData({ title, summary })

    try {
      // Step A: Get Sentiment (Positive/Negative) and Sectors
      const analysis = await analyzeArticle({
        title,
        summary,
      })
      setScenarioAnalysis(analysis)
      setIsLoadingScenarioAnalysis(false)

      // Step B: Get Deep Reasoning from Groq
      const sectors = analysis?.sectors || ['general']
      const sentiment = analysis?.sentiment?.label || 'neutral'

      const reasoning = await getReasoning({
        title,
        summary,
        sentiment,
        sectors,
      })
      setScenarioReasoning(reasoning)
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to analyze scenario. Check if backend is running.')
      setScenarioAnalysis(null)
      setScenarioReasoning(null)
    } finally {
      setIsLoadingScenarioAnalysis(false)
      setIsLoadingScenarioReasoning(false)
    }
  }

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
      const data = await fetchNews(40) // Get 40 articles
      setArticles(data.articles || [])

      // Automatically run a quick AI analysis in the background for the top articles
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

  // Function to handle top-right Refresh button click
  const handleRefresh = async () => {
    setError(null)
    if (activeMode === 'news') {
      setSelectedArticle(null)
      setCurrentAnalysis(null)
      setCurrentReasoning(null)
      selectedArticleIdRef.current = null
      await loadNews()
    } else {
      setScenarioData(null)
      setScenarioAnalysis(null)
      setScenarioReasoning(null)
    }
  }

  // A helper to analyze all articles silently in small chunks to avoid API rate limits
  const backgroundAnalyzeAll = async (articleList) => {
    // Process 4 at a time in sequence to avoid rate-limiting
    for (let i = 0; i < articleList.length; i += 4) {
      const chunk = articleList.slice(i, i + 4)
      await Promise.allSettled(chunk.map(async (article) => {
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
      }))
    }
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

  // ── 5. Ingest Custom URL ────────────────────────────────────────────────────
  const handleIngestUrl = async (url) => {
    // Throws on error, caught by NewsPanel to show inline error
    const newArticle = await ingestArticleUrl(url)

    setArticles(prev => [newArticle, ...prev])
    handleArticleSelect(newArticle)
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
      <Header
        onRefresh={handleRefresh}
        isLoading={isLoadingNews}
        activeMode={activeMode}
        onModeChange={setActiveMode}
      />

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

        {/* ── Row 1: News Feed / Scenario Sandbox + Sentiment + Stocks ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr_280px] gap-4 mb-4">
          {/* News Feed or Scenario Sandbox */}
          <div className="lg:row-span-2 lg:h-[700px] flex flex-col">
            {activeMode === 'news' ? (
              <NewsPanel
                articles={articles}
                selectedArticle={selectedArticle}
                onSelect={handleArticleSelect}
                analyses={analyses}
                isLoading={isLoadingNews}
                onIngestUrl={handleIngestUrl}
              />
            ) : (
              <ScenarioPanel
                onAnalyze={handleAnalyzeScenario}
                isLoading={isLoadingScenarioAnalysis || isLoadingScenarioReasoning}
              />
            )}
          </div>

          {/* Sentiment */}
          <div className="lg:h-[342px] flex flex-col">
            <SentimentPanel
              analysis={activeMode === 'news' ? currentAnalysis : scenarioAnalysis}
              isLoading={activeMode === 'news' ? isLoadingAnalysis : isLoadingScenarioAnalysis}
              article={activeMode === 'news' ? selectedArticle : scenarioData}
              placeholderText={
                activeMode === 'news'
                  ? 'Select an article to analyze sentiment'
                  : 'Enter a custom scenario and run analysis to view sentiment'
              }
            />
          </div>

          {/* Stocks */}
          <div className="lg:row-span-2 lg:h-[700px] flex flex-col">
            <StocksPanel
              reasoning={activeMode === 'news' ? currentReasoning : scenarioReasoning}
              isLoading={activeMode === 'news' ? isLoadingReasoning : isLoadingScenarioReasoning}
              placeholderText={
                activeMode === 'news'
                  ? 'Select an article to see stock signals'
                  : 'Enter a custom scenario and run analysis to view stock signals'
              }
            />
          </div>

          {/* AI Reasoning */}
          <div className="lg:h-[342px] flex flex-col">
            <ReasoningPanel
              reasoning={activeMode === 'news' ? currentReasoning : scenarioReasoning}
              isLoading={activeMode === 'news' ? isLoadingReasoning : isLoadingScenarioReasoning}
              placeholderText={
                activeMode === 'news'
                  ? 'Select an article to generate AI analysis'
                  : 'Enter a custom scenario and run analysis to view AI reasoning'
              }
            />
          </div>
        </div>

        {/* ── Row 2: Sector Impact ── */}
        <div className="mb-4">
          <SectorCards
            analysis={activeMode === 'news' ? currentAnalysis : scenarioAnalysis}
            isLoading={activeMode === 'news' ? isLoadingAnalysis : isLoadingScenarioAnalysis}
            placeholderText={
              activeMode === 'news'
                ? 'Select an article to detect affected sectors'
                : 'Enter a custom scenario and run analysis to view affected sectors'
            }
          />
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-[11px] text-slate-500 font-mono">
          Geo Alpha · FinBERT Sentiment & Groq AI Reasoning
          <span className="mx-2">·</span>
          Not financial advice
        </footer>
      </main>
    </div>
  )
}
