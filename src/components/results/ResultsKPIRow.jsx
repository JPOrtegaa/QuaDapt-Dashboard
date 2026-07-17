import Card from '../Card'
import { DiamondIcon, VennIcon, BarsIcon, GridIcon } from '../Icons'
import { fmtAE, fmtPct, fmtDelta } from '../../lib/resultsFormat'

// The four headline KPI cards, computed once in Python from the full method
// ranking / family-pair stats and carried on the manifest entry.
export default function ResultsKPIRow({ manifest }) {
  const gain = manifest.biggestGain

  return (
    <div className="grid">
      <Card icon={<DiamondIcon />} title="Best method" subtitle="mean AE">
        <div className="big">{fmtAE(manifest.bestMeanAE)}</div>
        <div className="note">{manifest.bestMethod}</div>
      </Card>

      <Card icon={<VennIcon />} title="_syn win-rate" subtitle="vs. base">
        <div className="big">{fmtPct(manifest.synWinRate)}</div>
        <div className="note">mean over {manifest.nFamilies} families</div>
      </Card>

      <Card icon={<BarsIcon />} title="Biggest gain" subtitle="Δ mean AE">
        <div className="big" style={{ color: gain && gain.deltaMeanAE < 0 ? 'var(--mint)' : undefined }}>
          {gain ? fmtDelta(gain.deltaMeanAE) : '—'}
        </div>
        <div className="note">{gain ? `${gain.base} → ${gain.syn}` : 'no family pairs'}</div>
      </Card>

      <Card icon={<GridIcon />} title="Families improved" subtitle={`of ${manifest.nFamilies}`}>
        <div className="big">{manifest.familiesImproved}</div>
        <div className="note">with _syn variant</div>
      </Card>
    </div>
  )
}
