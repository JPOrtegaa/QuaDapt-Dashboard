import Card from '../../Card'
import { GridIcon } from '../../Icons'
import { fmtDelta } from '../../../lib/resultsFormat'

// Diverging green(improve)/amber(regress) color for a Δ AE cell, scaled by the
// largest magnitude in the matrix so the strongest swings read at full strength.
function deltaColor(v, bound) {
  if (v == null) return 'transparent'
  const t = Math.min(1, Math.abs(v) / bound)
  const rgb = v < 0 ? [116, 224, 163] : [224, 167, 80]
  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${0.1 + t * 0.5})`
}

// Dataset × family matrix of Δ AE (syn − base). Reveals whether QuaDapt's
// gains are broad (whole rows green) or family-specific (isolated columns).
export default function FamilyHeatmapCard({ general, onPickDataset }) {
  const families = general.families
  const rows = general.datasets
    .filter((d) => d.meanDeltaAE != null)
    .slice()
    .sort((a, b) => a.meanDeltaAE - b.meanDeltaAE)

  let bound = 0
  for (const d of rows) {
    for (const b of families) {
      const v = d.perFamilyDelta[b]
      if (v != null) bound = Math.max(bound, Math.abs(v))
    }
  }
  bound = bound || 0.01

  return (
    <Card
      wide
      icon={<GridIcon />}
      title="Δ AE by dataset × family"
      subtitle="rows sorted best → worst · green = _syn improves, amber = regresses · click a dataset to open →"
      style={{ padding: '22px 24px' }}
    >
      <div className="heat-scroll" style={{ maxHeight: 560 }}>
        <table className="heat-table">
          <thead>
            <tr>
              <th>dataset</th>
              {families.map((b) => (
                <th key={b}>{b}</th>
              ))}
              <th>mean</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => (
              <tr key={d.id} onClick={() => onPickDataset?.(d.id)} style={{ cursor: 'pointer' }}>
                <td title={`${d.source} · ${d.meta.nClasses} classes`}>{d.name}</td>
                {families.map((b) => {
                  const v = d.perFamilyDelta[b]
                  return (
                    <td key={b} style={{ background: deltaColor(v, bound) }}>
                      {v == null ? '—' : fmtDelta(v, 2)}
                    </td>
                  )
                })}
                <td className="mean" style={{ color: d.meanDeltaAE < 0 ? 'var(--mint)' : 'var(--amber)' }}>
                  {fmtDelta(d.meanDeltaAE, 2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
