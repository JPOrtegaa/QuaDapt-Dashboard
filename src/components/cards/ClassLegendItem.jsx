import { withCommas } from '../../lib/format'

// One legend entry: swatch + name over count + percentage.
export default function ClassLegendItem({ name, count, pct, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: 2, background: color, flex: 'none' }} />
        <span
          style={{ fontSize: 11, fontWeight: 600, color: 'var(--t2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          title={name}
        >
          {name}
        </span>
      </div>
      <div style={{ fontSize: 14, fontWeight: 700 }}>{withCommas(count)}</div>
      <div className="mono" style={{ fontSize: 10, color: 'var(--t4)' }}>
        {pct}%
      </div>
    </div>
  )
}
