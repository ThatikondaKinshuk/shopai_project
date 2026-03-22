/**
 * SentimentBar — stacked bar showing positive / neutral / negative %
 */
export default function SentimentBar({ summary }) {
  if (!summary) return null

  const pos = summary.positive_pct ?? 0
  const neu = summary.neutral_pct ?? 0
  const neg = summary.negative_pct ?? 0

  return (
    <div className="space-y-1.5">
      {/* Stacked bar */}
      <div className="flex h-2 w-full overflow-hidden">
        {pos > 0 && (
          <div style={{ width: `${pos}%`, backgroundColor: '#065F46' }} className="transition-all duration-700" />
        )}
        {neu > 0 && (
          <div style={{ width: `${neu}%`, backgroundColor: '#D97706' }} className="transition-all duration-700" />
        )}
        {neg > 0 && (
          <div style={{ width: `${neg}%`, backgroundColor: '#9B1C1C' }} className="transition-all duration-700" />
        )}
      </div>
      {/* Legend */}
      <div className="flex gap-3 text-[10px] font-mono text-slate-400">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 inline-block" style={{ backgroundColor: '#065F46' }} />
          {pos}% positive
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 inline-block" style={{ backgroundColor: '#D97706' }} />
          {neu}% neutral
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 inline-block" style={{ backgroundColor: '#9B1C1C' }} />
          {neg}% negative
        </span>
      </div>
    </div>
  )
}
