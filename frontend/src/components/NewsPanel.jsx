import React, { useState, useRef, useEffect } from 'react'
import { ExternalLink, Clock, TrendingUp, Loader2 } from 'lucide-react'
import { formatTime, truncate, getSentimentBadgeClass, formatSector } from '../utils/helpers'

function NewsCard({ article, isSelected, onClick, analysis }) {
  const sentiment = analysis?.sentiment?.label || null
  return (
    <div
      onClick={() => onClick(article)}
      className={`p-3 rounded-lg border cursor-pointer transition-all ${
        isSelected
          ? 'bg-brand-500/[0.08] border-brand-500/35'
          : 'bg-white/[0.01] border-white/[0.05] hover:bg-white/[0.03]'
      }`}
    >
      <div className="flex justify-between items-center text-[10px] text-slate-500 mb-1 font-mono">
        <span className="text-brand-400 uppercase">{article.source}</span>
        <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{formatTime(article.timestamp)}</span>
      </div>
      <h3 className="text-sm font-medium text-slate-200 line-clamp-2 mb-1 leading-snug">{article.title}</h3>
      <p className="text-xs text-slate-500 line-clamp-2 mb-2 leading-relaxed">{truncate(article.summary, 90)}</p>
      <div className="flex justify-between items-center text-[10px]">
        <div className="flex gap-1">
          {sentiment && <span className={getSentimentBadgeClass(sentiment)}>{sentiment}</span>}
          {analysis?.sectors?.slice(0, 1).map(s => <span key={s} className="sector-pill">{formatSector(s)}</span>)}
        </div>
        <a href={article.url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="text-slate-500 hover:text-brand-400">
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  )
}

export default function NewsPanel({ articles, selectedArticle, onSelect, analyses, isLoading, onIngestUrl }) {
  const [urlInput, setUrlInput] = useState('')
  const [isIngesting, setIsIngesting] = useState(false)
  const [ingestError, setIngestError] = useState(null)
  const [visibleCount, setVisibleCount] = useState(10)
  const listRef = useRef(null)

  useEffect(() => { setVisibleCount(Math.min(10, articles.length || 10)) }, [articles])

  const handleIngest = async (e) => {
    e.preventDefault()
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

  const handleScroll = () => {
    if (!listRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = listRef.current
    if (scrollHeight - scrollTop - clientHeight < 60 && visibleCount < articles.length) {
      setVisibleCount(prev => Math.min(prev + 8, articles.length))
    }
  }

  return (
    <div className="glass-card p-4 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-brand-400" />
        <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Live News Feed</h2>
        {articles.length > 0 && <span className="ml-auto text-[10px] font-mono text-slate-500">{articles.length} articles</span>}
      </div>

      <form onSubmit={handleIngest} className="mb-3 relative flex items-center">
        <input
          type="url"
          value={urlInput}
          onChange={e => setUrlInput(e.target.value)}
          placeholder="Paste news URL here..."
          disabled={isIngesting}
          className="w-full bg-white/[0.02] border border-white/[0.06] rounded-md py-1.5 pl-3 pr-20 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-brand-500/50"
          required
        />
        <button type="submit" disabled={isIngesting || !urlInput.trim()} className="absolute right-1 px-2.5 py-1 bg-brand-500 hover:bg-brand-400 text-white text-xs rounded transition-colors disabled:opacity-50">
          {isIngesting ? '...' : 'Analyze'}
        </button>
      </form>
      {ingestError && <div className="mb-2 text-[10px] text-red-400">⚠️ {ingestError}</div>}

      <div ref={listRef} onScroll={handleScroll} className="flex-1 overflow-y-auto space-y-2 pr-1 scroll-smooth">
        {isLoading ? (
          <div className="text-center text-slate-500 text-xs py-8"><Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-400" />Loading news...</div>
        ) : articles.length === 0 ? (
          <div className="text-center text-slate-500 text-xs py-8">No articles loaded</div>
        ) : (
          <>
            {articles.slice(0, visibleCount).map(article => (
              <NewsCard key={article.id} article={article} isSelected={selectedArticle?.id === article.id} onClick={onSelect} analysis={analyses[article.id]} />
            ))}
            {visibleCount < articles.length && (
              <div className="py-2 text-center text-slate-500 text-[10px] font-mono animate-pulse">Scroll down for more...</div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
