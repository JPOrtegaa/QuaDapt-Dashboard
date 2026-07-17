import Card from '../../Card'
import { DiamondIcon, VennIcon, RadialIcon, BarsIcon } from '../../Icons'
import { fmtPct, fmtDelta } from '../../../lib/resultsFormat'

// Aggregate headline stats for the whole benchmark, from general.summary.
export default function GeneralKPIRow({ general }) {
  const s = general.summary
  const top = s.topPredictor
  const dir = top && top.corr != null ? (top.corr > 0 ? '↑' : '↓') : ''

  return (
    <div className="grid">
      <Card icon={<DiamondIcon />} title="Datasets improved" subtitle={`of ${general.nDatasets}`}>
        <div className="big" style={{ color: 'var(--mint)' }}>{s.datasetsImproved}</div>
        <div className="note">mean Δ AE &lt; 0 with _syn</div>
      </Card>

      <Card icon={<VennIcon />} title="Overall win-rate" subtitle="_syn vs. base">
        <div className="big">{fmtPct(s.meanWinRate)}</div>
        <div className="note">averaged over all datasets</div>
      </Card>

      <Card icon={<RadialIcon />} title="Strongest predictor" subtitle="of QuaDapt benefit">
        <div className="big" style={{ fontSize: 22 }}>
          {top ? `${top.label} ${dir}` : '—'}
        </div>
        <div className="note">{top && top.corr != null ? `r = ${top.corr.toFixed(2)}` : 'insufficient data'}</div>
      </Card>

      <Card icon={<BarsIcon />} title="Best family" subtitle="largest mean gain">
        <div className="big" style={{ color: 'var(--mint)' }}>{s.bestFamily ?? '—'}</div>
        <div className="note">{s.bestFamilyMeanDelta != null ? `${fmtDelta(s.bestFamilyMeanDelta)} mean Δ AE` : ''}</div>
      </Card>
    </div>
  )
}
