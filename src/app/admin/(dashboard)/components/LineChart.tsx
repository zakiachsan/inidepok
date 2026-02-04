'use client'

interface MonthlyData {
  label: string
  value: number
}

interface LineChartProps {
  data: MonthlyData[]
  title?: string
}

export function LineChart({ data, title = 'Artikel Dipublikasi' }: LineChartProps) {
  const currentYear = new Date().getFullYear()

  // Chart dimensions - wider chart with minimal padding
  const maxCount = Math.max(...data.map(d => d.value), 10)
  const chartWidth = 500
  const chartHeight = 200
  const padding = { top: 20, right: 20, bottom: 35, left: 40 }
  const innerWidth = chartWidth - padding.left - padding.right
  const innerHeight = chartHeight - padding.top - padding.bottom

  // Y-axis scale
  const yMax = Math.ceil(maxCount / 10) * 10 || 10
  const yTicks = [0, Math.round(yMax / 2), yMax]

  // Calculate points
  const points = data.map((d, i) => {
    const x = padding.left + (i / (data.length - 1)) * innerWidth
    const y = padding.top + innerHeight - (d.value / yMax) * innerHeight
    return { x, y, ...d }
  })

  // SVG paths
  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ')

  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(2)} ${(padding.top + innerHeight).toFixed(2)} L ${padding.left} ${(padding.top + innerHeight).toFixed(2)} Z`

  return (
    <div>
      <h3 className="text-sm font-semibold mb-3">{title}</h3>
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-48" preserveAspectRatio="xMidYMid meet">
        {/* Grid lines */}
        {yTicks.map((tick, i) => {
          const y = padding.top + innerHeight - (tick / yMax) * innerHeight
          return (
            <g key={i}>
              <line x1={padding.left} y1={y} x2={chartWidth - padding.right} y2={y} stroke="#e5e7eb" strokeWidth="1" />
              <text x={padding.left - 8} y={y} fill="#9ca3af" fontSize="12" textAnchor="end" dominantBaseline="middle">{tick}</text>
            </g>
          )
        })}

        {/* Area fill with gradient */}
        <defs>
          <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#dc2626" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#dc2626" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#chartGradient)" />

        {/* Line */}
        <path d={linePath} fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points & X-axis labels */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="5" fill="#dc2626" />
            <text x={p.x} y={chartHeight - 10} fill="#6b7280" fontSize="12" textAnchor="middle">{p.label}</text>
          </g>
        ))}
      </svg>
      <div className="text-center text-xs text-gray-500 mt-2">
        <span className="flex items-center justify-center gap-1.5">
          <span className="w-3 h-0.5 bg-red-600 rounded"></span>
          Tahun {currentYear}
        </span>
      </div>
    </div>
  )
}
