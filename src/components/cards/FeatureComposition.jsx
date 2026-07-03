import Card from '../Card'
import { BarsIcon } from '../Icons'

const KINDS = [
  { key: 'numeric', label: 'Numeric', color: 'var(--sage)' },
  { key: 'categorical', label: 'Categorical', color: '#8fca97' },
  { key: 'binary', label: 'Binary', color: '#6fbf9c' },
  { key: 'constant', label: 'Constant', color: '#4f9a86' },
]

function note(fc) {
  const total = fc.numeric + fc.categorical + fc.binary + fc.constant
  if (total === 0) return null
  if (fc.numeric === total) return 'All features continuous numeric.'
  if (fc.categorical + fc.binary === total) return 'All features categorical/binary.'
  if (fc.constant > 0) return `${fc.constant} constant feature${fc.constant > 1 ? 's' : ''} — droppable.`
  return 'Mixed feature types.'
}

export default function FeatureComposition({ view }) {
  const fc = view.featureComposition
  const total = fc.numeric + fc.categorical + fc.binary + fc.constant || 1
  return (
    <Card icon={<BarsIcon />} title="Feature Composition">
      <div style={{ height: 10, borderRadius: 6, overflow: 'hidden', display: 'flex', background: 'var(--inset)' }}>
        {KINDS.map(
          (k) =>
            fc[k.key] > 0 && (
              <div key={k.key} style={{ flex: `${fc[k.key]} 0 0`, background: k.color }} title={`${k.label}: ${fc[k.key]}`} />
            ),
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 14px' }}>
        {KINDS.map((k) => (
          <div key={k.key}>
            <div className="lbl" style={{ marginBottom: 3 }}>
              {k.label}
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: fc[k.key] === 0 ? 'var(--t4)' : undefined }}>
              {fc[k.key]}
            </div>
          </div>
        ))}
      </div>
      {note(fc) && <div className="note">{note(fc)}</div>}
    </Card>
  )
}
