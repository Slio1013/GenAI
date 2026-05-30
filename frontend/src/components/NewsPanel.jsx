import React, { useState } from 'react'
import { ExternalLink, Clock, TrendingUp, Link as LinkIcon, Loader2 } from 'lucide-react'
import { formatTime, truncate, getSentimentBadgeClass, formatSector } from '../utils/helpers'

function NewsCard({ article, isSelected, onClick, analysis }) {
  const sentiment = analysis?.sentiment?.label || null

  return (
    <div
      onClick={() => onClick(article)}
      className={`
        relative p-4 rounded-xl border cursor-pointer transition-all duration-300 overflow-hidden
        ${isSelected
          ? 'bg-brand-500/[0.08] border-brand-500/35 shadow-[0_4px_20px_rgba(37,168,255,0.08)]'
          : 'bg-white/[0.01] border-white/[0.05] hover:bg-white/[0.04] hover:border-white/[0.1] hover:translate-x-0.5'
        }
      `}
    >
      {isSelected && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-500 shadow-[0_0_8px_#25a8ff]" />
      )}
      {/* Source + time row */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-brand-400 font-mono uppercase tracking-wider">
          {article.source}
        </span>
        <div className="flex items-center gap-1 text-slate-500">
          <Clock className="w-3 h-3" />
          <span className="text-[10px] font-mono">{formatTime(article.timestamp)}</span>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-sm font-display font-medium text-slate-200 leading-snug mb-2 line-clamp-2">
        {article.title}
      </h3>

      {/* Summary */}
      <p className="text-xs text-slate-500 leading-relaxed mb-3 line-clamp-2">
        {truncate(article.summary, 100)}
      </p>

      {/* Footer row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {sentiment && (
            <span className={getSentimentBadgeClass(sentiment)}>
              {sentiment.charAt(0).toUpperCase() + sentiment.slice(1).toLowerCase()}
            </span>
          )}
          {analysis?.sectors?.slice(0, 2).map((s) => (
            <span key={s} className="sector-pill">
              {formatSector(s)}
            </span>
          ))}
        </div>
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-slate-600 hover:text-brand-400 transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  )
}

function NewsCardSkeleton() {
  return (
    <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
      <div className="flex justify-between mb-2">
        <div className="h-3 w-16 shimmer rounded" />
        <div className="h-3 w-12 shimmer rounded" />
      </div>
      <div className="h-4 w-full shimmer rounded mb-1" />
      <div className="h-4 w-3/4 shimmer rounded mb-3" />
      <div className="h-3 w-full shimmer rounded mb-1" />
      <div className="h-3 w-2/3 shimmer rounded" />
    </div>
  )
}

export default function NewsPanel({ articles, selectedArticle, onSelect, analyses, isLoading, onIngestUrl }) {
  const [urlInput, setUrlInput] = useState('')
  const [isIngesting, setIsIngesting] = useState(false)
  const [ingestError, setIngestError] = useState(null)

  const handleIngest = async (e) => {
    e.preventDefault()
    if (!urlInput.trim()) return
    
    setIsIngesting(true)
    setIngestError(null)
    
    try {
      if (onIngestUrl) {
        await onIngestUrl(urlInput.trim())
        setUrlInput('')
      }
    } catch (err) {
      setIngestError(err.response?.data?.detail || err.message || 'Failed to ingest URL')
    } finally {
      setIsIngesting(false)
    }
  }

  return (
    <div className="glass-card p-5 h-full flex flex-col">
      {/* Panel header */}
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-brand-400" />
        <h2 className="text-sm font-display font-semibold text-white uppercase tracking-wide">
          Live News Feed
        </h2>
        {articles.length > 0 && (
          <span className="ml-auto text-[10px] font-mono text-slate-500">
            {articles.length} articles
          </span>
        )}
      </div>

      {/* URL Ingestion Form */}
      <form onSubmit={handleIngest} className="mb-4 relative">
        <div className="relative flex items-center">
          <div className="absolute left-3 text-slate-500">
            {isIngesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <LinkIcon className="w-4 h-4" />}
          </div>
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Paste news article URL here..."
            disabled={isIngesting}
            className="w-full bg-white/[0.02] border border-white/[0.06] rounded-lg py-2 pl-9 pr-20 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-brand-500/50 focus:bg-white/[0.04] transition-all disabled:opacity-50"
            required
          />
          <button
            type="submit"
            disabled={isIngesting || !urlInput.trim()}
            className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-brand-500 hover:bg-brand-400 text-white text-xs font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            Analyze
          </button>
        </div>
        {ingestError && (
          <div className="mt-2 text-[11px] text-red-400 flex items-center gap-1">
            <span>⚠️</span> {ingestError}
          </div>
        )}
      </form>

      {/* Articles list */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <NewsCardSkeleton key={i} />)
        ) : articles.length === 0 ? (
          <div className="text-center text-slate-500 text-sm py-8">
            No articles loaded
          </div>
        ) : (
          articles.map((article) => (
            <NewsCard
              key={article.id}
              article={article}
              isSelected={selectedArticle?.id === article.id}
              onClick={onSelect}
              analysis={analyses[article.id]}
            />
          ))
        )}
      </div>
    </div>
  )
}
