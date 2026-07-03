import Card from '../Card'
import { VennIcon } from '../Icons'

export default function Redundancy({ view }) {
  const r = view.redundancy
  const avg = r.avgAbsCorr == null ? '—' : r.avgAbsCorr.toFixed(2)
  return (
    <Card icon={<VennIcon />} title="Redundancy">
      <div>
        <div className="lbl" style={{ marginBottom: 5 }}>
          Avg pairwise |r|
        </div>
        <div className="big">{avg}</div>
      </div>
      <div className="divt">
        <div className="lbl" style={{ marginBottom: 4 }}>
          Highly-correlated pairs
        </div>
        <div style={{ fontSize: 16, fontWeight: 700 }}>
          {r.highlyCorrelatedPairs}{' '}
          <span className="mono" style={{ fontSize: 11, fontWeight: 500, color: 'var(--t4)' }}>
            |r| &gt; {r.threshold}
          </span>
        </div>
      </div>
    </Card>
  )
}
