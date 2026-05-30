import React from 'react'
import { TrendingUp, TrendingDown, DollarSign, Zap } from 'lucide-react'
import { formatSector, getDirectionConfig } from '../utils/helpers'

function StockCard({ stock }) {
  const config = getDirectionConfig(stock.direction)

  return (
    <div className={`p-3.5 rounded-xl border ${config.bg} ${config.border} transition-all hover:shadow-md hover:translate-y-[-2px] duration-300 flex items-center justify-between gap-4`}>
      <div className="flex-1 min-w-0">
        {/* Ticker & Sector */}
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className={`text-base font-display font-bold tracking-tight ${config.color}`}>
            {stock.ticker}
          </span>
          <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider truncate">
            {formatSector(stock.sector)}
          </span>
        </div>
        {/* Company name */}
        <p className="text-[11px] text-slate-400 truncate">{stock.company}</p>
      </div>

      {/* Direction badge */}
      <div className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/80 border ${config.border} shadow-inner`}>
        <span className={`text-[9px] font-mono font-bold tracking-wider ${config.color}`}>
          {config.icon} {config.label}
        </span>
      </div>
    </div>
  )
}

function StockSection({ title, stocks, Icon, color }) {
  if (!stocks?.length) return null

  return (
    <div>
      <div className="flex items-center gap-2 mb-2.5">
        <Icon className="w-3.5 h-3.5" style={{ color }} />
        <span className="text-[11px] font-mono uppercase tracking-wider" style={{ color }}>
          {title}
        </span>
        <span className="ml-auto text-[10px] text-slate-600 font-mono">
          {stocks.length} picks
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {stocks.map((stock) => (
          <StockCard key={stock.ticker} stock={stock} />
        ))}
      </div>
    </div>
  )
}

export default function StocksPanel({ reasoning, isLoading }) {
  if (isLoading) {
    return (
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-4 h-4 text-brand-400" />
          <h2 className="text-sm font-display font-semibold text-white uppercase tracking-wide">
            Stock Signals
          </h2>
          <div className="ml-auto flex items-center gap-1.5 animate-pulse">
            <Zap className="w-3 h-3 text-slate-500" />
            <span className="text-[10px] font-mono text-slate-500">Groq processing...</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 shimmer rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  const stocks = reasoning?.stock_suggestions || []
  const bullish = stocks.filter((s) => s.direction === 'bullish')
  const bearish = stocks.filter((s) => s.direction === 'bearish')

  return (
    <div className="glass-card p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <DollarSign className="w-4 h-4 text-brand-400" />
        <h2 className="text-sm font-display font-semibold text-white uppercase tracking-wide">
          Stock Signals
        </h2>
        <div className="ml-auto flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-slate-500" />
          <span className="text-[10px] font-mono text-slate-500">
            Groq
          </span>
        </div>
      </div>

      {stocks.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-6">
          Select an article to see stock signals
        </p>
      ) : (
        <div className="space-y-4">
          <StockSection
            title="Bullish Picks"
            stocks={bullish}
            Icon={TrendingUp}
            color="#34d399"
          />
          <StockSection
            title="Bearish Picks"
            stocks={bearish}
            Icon={TrendingDown}
            color="#f87171"
          />

          {/* Disclaimer */}
          <p className="text-[9px] text-slate-600 text-center mt-4 border-t border-white/[0.04] pt-3 leading-relaxed">
            Note: For informational purposes only. Not financial advice.
          </p>
        </div>
      )}
    </div>
  )
}
