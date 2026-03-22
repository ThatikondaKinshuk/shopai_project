import { useState } from 'react'
import { ThumbsUp, ThumbsDown, Minus, FileText, Star } from 'lucide-react'

const sentimentConfig = {
  positive: {
    icon: <ThumbsUp size={11} />,
    cls: 'badge-positive',
    bar: '#065F46',
  },
  negative: {
    icon: <ThumbsDown size={11} />,
    cls: 'badge-negative',
    bar: '#9B1C1C',
  },
  neutral: {
    icon: <Minus size={11} />,
    cls: 'badge-neutral',
    bar: '#D97706',
  },
}

/**
 * EvidencePanel — displays retrieved chunks that support the AI answer
 * Shows source (review vs metadata), sentiment, relevance score, and aspect
 */
export default function EvidencePanel({ evidence }) {
  const [expanded, setExpanded] = useState(null)

  if (!evidence || evidence.length === 0) return null

  return (
    <div className="space-y-2">
      {evidence.map((chunk, i) => {
        const cfg = sentimentConfig[chunk.sentiment] || sentimentConfig.neutral
        const isOpen = expanded === i
        const relevancePct = Math.round((chunk.relevance_score || 0) * 100)

        return (
          <div
            key={i}
            className="border border-slate-100 bg-slate-50 overflow-hidden transition-all duration-200"
          >
            {/* Header row */}
            <button
              onClick={() => setExpanded(isOpen ? null : i)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-100 transition-colors"
            >
              {/* Source icon */}
              <div className="shrink-0 text-slate-300">
                {chunk.source === 'review' ? <Star size={12} /> : <FileText size={12} />}
              </div>

              {/* Source label */}
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider shrink-0">
                {chunk.source === 'review' ? 'Review' : 'Metadata'}
              </span>

              {/* Aspect badge */}
              <span className={`badge ${cfg.cls} shrink-0`}>
                {cfg.icon} {chunk.aspect}
              </span>

              {/* Relevance bar */}
              <div className="flex-1 flex items-center gap-2">
                <div className="flex-1 h-1 bg-slate-200 overflow-hidden">
                  <div
                    className="h-full transition-all duration-500"
                    style={{ width: `${relevancePct}%`, backgroundColor: cfg.bar }}
                  />
                </div>
                <span className="text-[10px] font-mono text-slate-400 shrink-0">{relevancePct}%</span>
              </div>

              {/* Expand toggle */}
              <span className="text-[10px] font-mono text-slate-300 shrink-0">
                {isOpen ? '▲' : '▼'}
              </span>
            </button>

            {/* Expanded text */}
            {isOpen && (
              <div className="px-4 pb-3 pt-1 border-t border-slate-100">
                <p className="text-xs font-sans text-slate-600 leading-relaxed italic">
                  "{chunk.text}"
                </p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
