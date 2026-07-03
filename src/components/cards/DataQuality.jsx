import Card from '../Card'
import { DiamondIcon } from '../Icons'

function QualityRow({ label, sub, value, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t2)' }}>{label}</div>
        <div className="mono" style={{ fontSize: 10, color: 'var(--t4)' }}>
          {sub}
        </div>
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color }}>{value}</div>
    </div>
  )
}

export default function DataQuality({ view }) {
  const q = view.dataQuality
  const flags = (q.missingPct > 0 ? 1 : 0) + (q.duplicates > 0 ? 1 : 0) + (q.malformed > 0 ? 1 : 0)
  const rows = [
    {
      label: 'Missing',
      sub: `${q.missingCells.toLocaleString('en-US')} cells`,
      value: `${q.missingPct}%`,
      color: q.missingPct > 0 ? 'var(--amber)' : 'var(--green)',
    },
    {
      label: 'Duplicates',
      sub: `${q.duplicatePct}% of rows`,
      value: q.duplicates.toLocaleString('en-US'),
      color: q.duplicates > 0 ? 'var(--amber)' : 'var(--green)',
    },
    {
      label: 'Malformed',
      sub: 'parse errors',
      value: q.malformed,
      color: q.malformed > 0 ? 'var(--amber)' : 'var(--green)',
    },
  ]
  return (
    <Card
      icon={<DiamondIcon />}
      title="Data Quality"
      right={
        <span
          className="tag"
          style={
            flags > 0
              ? { color: 'var(--amber)', background: 'rgba(224,167,80,.14)' }
              : { color: 'var(--green)', background: 'rgba(99,197,134,.14)' }
          }
        >
          {flags > 0 ? `${flags} flag${flags > 1 ? 's' : ''}` : 'clean'}
        </span>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
        {rows.map((r) => (
          <QualityRow key={r.label} {...r} />
        ))}
      </div>
    </Card>
  )
}
