import React from 'react'
import { Activity, Zap, Globe, RefreshCw } from 'lucide-react'

export default function Header({ onRefresh, isLoading, activeMode, onModeChange }) {
  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Frosted glass bar */}
      <div className="bg-surface-900/80 backdrop-blur-md border-b border-white/[0.06]">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* Logo + Brand */}
          <div className="flex items-center gap-3">
            {/* Animated logo mark */}
            <div className="relative flex items-center justify-center w-9 h-9">
              <div className="absolute inset-0 rounded-lg bg-brand-500/20 animate-pulse-slow" />
              <Globe className="w-5 h-5 text-brand-400 relative z-10" />
            </div>
            <div>
              <span className="font-display font-700 text-white text-lg tracking-tight">
                Geo<span className="text-brand-400">Alpha</span>
              </span>
              <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest -mt-0.5">
                Geo-Financial Intelligence
              </div>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center bg-white/[0.03] p-0.5 rounded-lg border border-white/[0.06] shadow-inner">
            <button
              onClick={() => onModeChange('news')}
              className={`px-3 py-1 rounded-md text-xs font-semibold tracking-wide transition-all duration-300 flex items-center gap-1.5 ${
                activeMode === 'news'
                  ? 'bg-brand-500 text-white shadow-[0_0_12px_rgba(37,168,255,0.25)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${activeMode === 'news' ? 'bg-white' : 'bg-emerald-400'} ${activeMode === 'news' ? 'animate-none' : 'animate-pulse'}`} />
              Live News
            </button>
            <button
              onClick={() => onModeChange('scenario')}
              className={`px-3 py-1 rounded-md text-xs font-semibold tracking-wide transition-all duration-300 flex items-center gap-1.5 ${
                activeMode === 'scenario'
                  ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.25)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${activeMode === 'scenario' ? 'bg-white' : 'bg-purple-400'} ${activeMode === 'scenario' ? 'animate-none' : 'animate-pulse'}`} />
              Scenario
            </button>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {/* Live indicator */}
            <div className="hidden sm:flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs text-slate-500 font-mono">Groq & FinBERT</span>
            </div>

            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500/10 border border-brand-500/25 text-brand-300 text-sm font-semibold hover:bg-brand-500/20 hover:border-brand-500/40 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_12px_rgba(37,168,255,0.05)] hover:shadow-[0_0_18px_rgba(37,168,255,0.15)]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Subtle top accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />
    </header>
  )
}
