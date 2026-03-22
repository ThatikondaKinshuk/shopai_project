/**
 * AspectRadar — horizontal bar chart showing per-aspect sentiment scores
 * Each bar represents the positivity score for a product aspect
 * (battery, sound, build quality, comfort, price, etc.)
 */

const ASPECT_LABELS = {
  battery: '🔋 Battery',
  sound: '🔊 Sound',
  build: '🏗️ Build',
  comfort: '🛋️ Comfort',
  price: '💰 Price',
  connectivity: '📡 Connect',
  display: '🖥️ Display',
  performance: '⚡ Performance',
  camera: '📷 Camera',
  general: '⭐ General',
}

export default function AspectRadar({ aspects }) {
  if (!aspects || Object.keys(aspects).length === 0) return null

  const sorted = Object.entries(aspects)
    .filter(([, v]) => v.total > 0)
    .sort(([, a], [, b]) => b.score - a.score)

  return (
    <div className="space-y-2.5">
      {sorted.map(([aspect, data]) => {
        const pct = Math.round(data.score * 100)
        const color =
          pct >= 65 ? '#065F46'
          : pct >= 40 ? '#D97706'
          : '#9B1C1C'

        return (
          <div key={aspect}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-[11px] font-mono text-slate-500">
                {ASPECT_LABELS[aspect] || aspect}
              </span>
              <span className="text-[11px] font-mono font-medium" style={{ color }}>
                {pct}%
              </span>
            </div>
            <div className="h-1.5 bg-slate-100 w-full overflow-hidden">
              <div
                className="h-full transition-all duration-700 ease-out"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
            <div className="text-[9px] font-mono text-slate-300 mt-0.5">
              {data.total} mention{data.total !== 1 ? 's' : ''}
            </div>
          </div>
        )
      })}
    </div>
  )
}
