import React, { useState } from 'react'
import { Cpu, Zap } from 'lucide-react'
import { formatSector } from '../utils/helpers'

function ChainStep({ step, index, isLast }) {
  return (
    <div className="flex gap-3">
      {/* Timeline spine */}
      <div className="flex flex-col items-center">
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 border border-purple-500/50 flex items-center justify-center shadow-[0_0_8px_rgba(168,85,247,0.3)]">
          <span className="text-[9px] text-purple-300 font-mono font-bold">{index + 1}</span>
        </div>
        {!isLast && (
          <div className="w-px flex-1 mt-1 bg-gradient-to-b from-purple-500/40 to-purple-500/05 min-h-[20px]" />
        )}
      </div>
      {/* Content */}
      <div className={`pb-3 flex-1 ${isLast ? '' : ''}`}>
        <p className="text-xs text-slate-300 leading-relaxed pt-1">{step.trim()}</p>
      </div>
    </div>
  )
}

export default function ReasoningPanel({ reasoning, isLoading, placeholderText }) {
  const [expanded, setExpanded] = useState(true)

  if (isLoading) {
    return (
      <div className="glass-card p-5 h-full">
        <div className="flex items-center gap-2 mb-4">
          <Cpu className="w-4 h-4 text-brand-400" />
          <h2 className="text-sm font-display font-semibold text-white uppercase tracking-wide">
            AI Reasoning Engine
          </h2>
          <div className="ml-auto flex items-center gap-1.5 animate-pulse">
            <Zap className="w-3 h-3 text-slate-500" />
            <span className="text-[10px] font-mono text-slate-500">Groq processing...</span>
          </div>
        </div>
        <div className="space-y-3">
          {[80, 60, 90, 50, 70].map((w, i) => (
            <div key={i} className={`h-3 shimmer rounded`} style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>
    )
  }

  if (!reasoning) {
    return (
      <div className="glass-card p-5 h-full flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <Cpu className="w-4 h-4 text-brand-400" />
          <h2 className="text-sm font-display font-semibold text-white uppercase tracking-wide">
            AI Reasoning Engine
          </h2>
          <div className="ml-auto flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-slate-500" />
            <span className="text-[10px] font-mono text-slate-500">Groq</span>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center -translate-y-4">
          <p className="text-sm text-slate-500 text-center py-6">
            {placeholderText || 'Select an article to generate AI analysis'}
          </p>
        </div>
      </div>
    )
  }

  const r = reasoning.reasoning || {}
  const chainSteps = (r.chain_reaction || '').split('→').filter(Boolean)

  return (
    <div className="glass-card p-5 animate-fade-in h-full flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 flex-shrink-0">
        <Cpu className="w-4 h-4 text-brand-400" />
        <h2 className="text-sm font-display font-semibold text-white uppercase tracking-wide">
          AI Reasoning Engine
        </h2>
        <div className="ml-auto flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-slate-500" />
          <span className="text-[10px] font-mono text-slate-500">Groq</span>
        </div>
      </div>

      <div className="space-y-4 flex-1">
        {/* Economic Reasoning */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-brand-500/[0.05] to-transparent border border-brand-500/15 shadow-[0_4px_16px_rgba(37,168,255,0.02)]">
          <p className="text-[10px] text-brand-400 font-mono uppercase tracking-wider mb-1.5 font-semibold">
            Economic Reasoning
          </p>
          <p className="text-xs text-slate-300 leading-relaxed font-normal">{r.economic_reasoning}</p>
        </div>

        {/* Chain Reaction */}
        {chainSteps.length > 0 && (
          <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/[0.05] to-transparent border border-purple-500/15 shadow-[0_4px_16px_rgba(168,85,247,0.02)]">
            <p className="text-[10px] text-purple-400 font-mono uppercase tracking-wider mb-3 font-semibold">
              Chain Reaction
            </p>
            <div>
              {chainSteps.map((step, i) => (
                <ChainStep key={i} step={step} index={i} isLast={i === chainSteps.length - 1} />
              ))}
            </div>
          </div>
        )}

        {/* Sector Impact */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/[0.05] to-transparent border border-emerald-500/15 shadow-[0_4px_16px_rgba(16,185,129,0.02)]">
          <p className="text-[10px] text-emerald-400 font-mono uppercase tracking-wider mb-1.5 font-semibold">
            Sector Impact
          </p>
          <p className="text-xs text-slate-300 leading-relaxed font-normal">{r.sector_impact}</p>
        </div>

        {/* Bullish / Bearish sectors */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded-xl bg-gradient-to-b from-emerald-500/[0.04] to-transparent border border-emerald-500/15">
            <p className="text-[10px] text-emerald-400 font-mono uppercase mb-2 font-semibold">↑ Bullish</p>
            <div className="flex flex-wrap gap-1">
              {(r.bullish_sectors || []).map((s) => (
                <span key={s} className="text-[10px] text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono">
                  {formatSector(s)}
                </span>
              ))}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-b from-red-500/[0.04] to-transparent border border-red-500/15">
            <p className="text-[10px] text-red-400 font-mono uppercase mb-2 font-semibold">↓ Bearish</p>
            <div className="flex flex-wrap gap-1">
              {(r.bearish_sectors || []).map((s) => (
                <span key={s} className="text-[10px] text-red-300 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full font-mono">
                  {formatSector(s)}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
