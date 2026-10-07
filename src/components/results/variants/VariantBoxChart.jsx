import { useEffect, useRef, useState } from 'react'
import AxisTickY from './AxisTickY'
import BoxGroup from './BoxGroup'

const HEIGHT = 360
const M = { top: 10, right: 8, bottom: 30, left: 44 }
const N_TICKS = 5

// Container width, tracked so the SVG lays out in real pixels (text stays
// legible instead of scaling with a viewBox).
function useWidth(fallback = 900) {
  const ref = useRef(null)
  const [width, setWidth] = useState(fallback)
  useEffect(() => {
    if (!ref.current) return undefined
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])
  return [ref, width]
}

// A 1-2-2.5-5 tick step giving ~N_TICKS ticks up to `v`, and the axis top.
function niceAxis(v) {
  const raw = (v || 1) / N_TICKS
  const mag = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].find((m) => m * mag >= raw) * mag
  const top = Math.ceil(v / step - 1e-9) * step
  return { top, ticks: Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step) }
}

// Grouped box plot of per-batch AE: x = base method, one box per variant
// (classic / cdt / ibdd / syn), recharts has no box primitive so this is
// plain SVG. `scopeStats` is one scope of `variantBoxes.scopes`.
export default function VariantBoxChart({ boxes, scopeStats, palette, hovered, onHover }) {
  const [ref, width] = useWidth()
  const { bases, members, variants } = boxes

  let maxV = 0
  for (const stats of Object.values(scopeStats)) {
    maxV = Math.max(maxV, stats[4], ...stats[7])
  }
  const { top: yMax, ticks } = niceAxis(maxV)
  const plotBottom = HEIGHT - M.bottom
  const plotH = plotBottom - M.top
  const y = (v) => plotBottom - (v / yMax) * plotH
  const bandWidth = (width - M.left - M.right) / bases.length

  return (
    <div ref={ref} style={{ width: '100%' }} onMouseLeave={() => onHover(null)}>
      <svg width={width} height={HEIGHT} style={{ display: 'block' }}>
        {ticks.map((t) => (
          <AxisTickY key={t} value={t} y={y(t)} left={M.left} right={width - M.right} />
        ))}
        {bases.map((base, i) => (
          <BoxGroup
            key={base}
            base={base}
            members={members[base]}
            variants={variants}
            scopeStats={scopeStats}
            x0={M.left + i * bandWidth}
            bandWidth={bandWidth}
            plotBottom={plotBottom}
            y={y}
            palette={palette}
            hovered={hovered?.method ?? null}
            onHover={(method, variant) => onHover({ method, variant })}
          />
        ))}
      </svg>
    </div>
  )
}
