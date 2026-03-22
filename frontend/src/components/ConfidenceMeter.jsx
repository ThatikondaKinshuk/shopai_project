/**
 * ConfidenceMeter — visual confidence score bar
 * Shows how confident the AI is in its answer (0–1 scale)
 */
export default function ConfidenceMeter({ value }) {
  const pct = Math.round((value || 0) * 100)

  const color =
    pct >= 70 ? '#065F46'   // forest green
    : pct >= 45 ? '#D97706' // amber
    : '#9B1C1C'             // rouge

  const label =
    pct >= 70 ? 'High'
    : pct >= 45 ? 'Moderate'
    : 'Low'

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-xs font-mono text-slate-400">{label}</span>
        <span className="text-xs font-mono font-semibold" style={{ color }}>{pct}%</span>
      </div>
      <div className="h-2 bg-slate-100 w-full overflow-hidden">
        <div
          className="h-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}
