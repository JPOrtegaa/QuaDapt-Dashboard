import { rangeBar } from '../../lib/derive'

const fmt = (v) => (v == null ? '—' : typeof v === 'number' ? v.toLocaleString('en-US') : v)

// One row of the feature-stats table. The parent `.ftab` is a CSS grid, so a
// row is a flat fragment of 7 cells.
export default function FeatureRow({ feat, maxSpan }) {
  const span = feat.max != null && feat.min != null ? feat.max - feat.min : 0
  const bar = rangeBar(span, maxSpan)
  return (
    <>
      <div className="fk" title={feat.name}>
        {feat.name.length > 8 ? feat.name.slice(0, 7) + '…' : feat.name}
      </div>
      <div className="rb">
        <i style={{ width: bar.width, background: bar.color }} />
      </div>
      <div className="num">{fmt(feat.min)}</div>
      <div className="num">{fmt(feat.max)}</div>
      <div className="num hi">{fmt(feat.mean)}</div>
      <div className="num">{fmt(feat.std)}</div>
      <div className="num">{fmt(feat.skew)}</div>
    </>
  )
}
