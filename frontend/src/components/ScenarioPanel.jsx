import React, { useState } from 'react'
import { Sparkles, Trash2, Play, AlertCircle } from 'lucide-react'

export default function ScenarioPanel({ onAnalyze, isLoading }) {
  const [scenario, setScenario] = useState('')
  const [error, setError] = useState('')

  const handleClear = () => {
    setScenario('')
    setError('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!scenario.trim()) {
      setError('Please describe your scenario.')
      return
    }
    setError('')
    onAnalyze(scenario.trim())
  }

  return (
    <div className="glass-card p-5 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 flex-shrink-0">
        <Sparkles className="w-4 h-4 text-purple-400" />
        <h2 className="text-sm font-semibold text-white uppercase tracking-wide">
          Scenario
        </h2>
      </div>
      <p className="text-xs text-slate-400 leading-relaxed mb-4 flex-shrink-0">
        Type a hypothetical event to simulate financial, sentiment, and sector impact.
      </p>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between">
        <div className="flex-1 flex flex-col mb-4">
          <label className="block text-[10px] text-slate-500 font-mono uppercase tracking-wider mb-2 font-semibold flex-shrink-0">
            Describe the Scenario
          </label>
          <textarea
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            placeholder="Describe a hypothetical scenario..."
            disabled={isLoading}
            className="flex-1 w-full bg-white/[0.02] border border-white/[0.06] focus:border-purple-500/50 rounded-lg p-3 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none resize-none transition-all duration-300 leading-relaxed min-h-[150px]"
          />
        </div>

        {error && (
          <div className="text-[10px] text-red-400 flex items-center gap-1.5 bg-red-500/5 border border-red-500/10 p-2 rounded-lg mb-4 flex-shrink-0">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 flex-shrink-0">
          <button
            type="submit"
            disabled={isLoading || !scenario.trim()}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-gradient-to-r from-purple-600 to-brand-500 hover:from-purple-500 hover:to-brand-400 active:scale-[0.98] text-white text-xs font-semibold shadow-[0_0_15px_rgba(168,85,247,0.15)] hover:shadow-[0_0_20px_rgba(168,85,247,0.25)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
          >
            <Play className="w-3 h-3 fill-current" />
            {isLoading ? 'Analyzing...' : 'Analyze Scenario'}
          </button>
          
          <button
            type="button"
            onClick={handleClear}
            disabled={isLoading || !scenario}
            className="px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.05] hover:border-white/[0.1] text-slate-400 hover:text-slate-200 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Clear input"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  )
}
