import { useState } from 'react'

export interface Slice {
  label: string
  value: number
  color: string // valor CSS, ex: 'var(--pie-1)'
}

const R = 80
const C = 90

function arcPath(start: number, end: number) {
  const a0 = (start - 0.25) * 2 * Math.PI
  const a1 = (end - 0.25) * 2 * Math.PI
  const x0 = C + R * Math.cos(a0)
  const y0 = C + R * Math.sin(a0)
  const x1 = C + R * Math.cos(a1)
  const y1 = C + R * Math.sin(a1)
  const large = end - start > 0.5 ? 1 : 0
  return `M${C},${C} L${x0},${y0} A${R},${R} 0 ${large} 1 ${x1},${y1} Z`
}

const pct = (v: number, total: number) => (total ? Math.round((v / total) * 100) : 0)

export function PieChart({ slices, total }: { slices: Slice[]; total: number }) {
  const [hover, setHover] = useState<number | null>(null)
  let acc = 0

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
      <div className="relative shrink-0">
        <svg viewBox="0 0 180 180" className="h-44 w-44" role="img" aria-label="Distribuição das ligações do dia">
          {total === 0 ? (
            <circle cx={C} cy={C} r={R} fill="var(--surface-2)" stroke="var(--line)" strokeDasharray="4 4" />
          ) : (
            slices.map((s, i) => {
              if (s.value === 0) return null
              const start = acc / total
              acc += s.value
              const end = acc / total
              const common = {
                fill: s.color,
                stroke: 'var(--surface)',
                strokeWidth: 2,
                strokeLinejoin: 'round' as const,
                opacity: hover !== null && hover !== i ? 0.35 : 1,
                onMouseEnter: () => setHover(i),
                onMouseLeave: () => setHover(null),
                className: 'transition-opacity',
              }
              const tip = `${s.label}: ${s.value} (${pct(s.value, total)}%)`
              return end - start >= 0.9999 ? (
                <circle key={i} cx={C} cy={C} r={R} {...common}>
                  <title>{tip}</title>
                </circle>
              ) : (
                <path key={i} d={arcPath(start, end)} {...common}>
                  <title>{tip}</title>
                </path>
              )
            })
          )}
        </svg>
        {total === 0 && (
          <p className="absolute inset-0 grid place-items-center px-10 text-center text-xs text-muted">Sem ligações neste dia</p>
        )}
      </div>

      <ul className="w-full space-y-1">
        {slices.map((s, i) => (
          <li
            key={s.label}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            className={`flex items-center gap-3 rounded-xl px-3 py-2 transition ${hover === i ? 'bg-surface-2' : ''}`}
          >
            <span className="h-3 w-3 shrink-0 rounded-[4px]" style={{ background: s.color }} aria-hidden />
            <span className="flex-1 text-sm text-ink-2">{s.label}</span>
            <span className="font-mono text-sm font-medium tabular">{s.value}</span>
            <span className="w-11 text-right font-mono text-xs text-muted tabular">{pct(s.value, total)}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
