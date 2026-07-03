import Card from '../Card'
import { HistIcon } from '../Icons'
import FeatureRow from './FeatureRow'

const ROW_CAP = 80 // keep the DOM light for wide datasets (Fashion-MNIST, Amazon)

export default function FeatureStats({ view }) {
  const fs = view.featureStats
  const feats = fs.features
  if (!feats || feats.length === 0) {
    return (
      <Card wide icon={<HistIcon />} title="Feature Statistics" subtitle="no numeric features" style={{ padding: '22px 24px' }}>
        <div className="note" style={{ fontSize: 12 }}>
          This dataset has no numeric features to summarize.
        </div>
      </Card>
    )
  }

  const maxSpan = feats.reduce((m, f) => {
    const s = f.max != null && f.min != null ? f.max - f.min : 0
    return s > m ? s : m
  }, 0)
  const shown = feats.slice(0, ROW_CAP)
  const hidden = feats.length - shown.length

  const subtitle =
    `${feats.length} numeric feature${feats.length > 1 ? 's' : ''}` +
    (hidden > 0 ? ` · showing first ${ROW_CAP}` : '')

  return (
    <Card
      wide
      icon={<HistIcon />}
      title="Feature Statistics"
      subtitle={subtitle}
      style={{ padding: '22px 24px' }}
      right={
        fs.normalizationRecommended ? (
          <span
            className="tag"
            style={{ color: 'var(--amber)', background: 'rgba(224,167,80,.13)', border: '1px solid rgba(224,167,80,.25)' }}
          >
            Normalization recommended
          </span>
        ) : null
      }
    >
      <div className="ftab-scroll">
        <div className="ftab">
          <div className="lbl">Feat</div>
          <div className="lbl">Range (log)</div>
          <div className="lbl" style={{ textAlign: 'right' }}>Min</div>
          <div className="lbl" style={{ textAlign: 'right' }}>Max</div>
          <div className="lbl" style={{ textAlign: 'right' }}>Mean</div>
          <div className="lbl" style={{ textAlign: 'right' }}>Std</div>
          <div className="lbl" style={{ textAlign: 'right' }}>Skew</div>
          {shown.map((f) => (
            <FeatureRow key={f.name} feat={f} maxSpan={maxSpan} />
          ))}
        </div>
      </div>
      {hidden > 0 && (
        <div className="note">+{hidden.toLocaleString('en-US')} more features not shown.</div>
      )}
    </Card>
  )
}
