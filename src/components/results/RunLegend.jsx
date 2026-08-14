import { runColor } from '../../lib/resultsDerive'

// Which color is which experiment run, in the same order the bars are grouped.
export default function RunLegend({ runs }) {
  if (runs.length < 2) return null
  return (
    <div className="calib-legend">
      {runs.map((r, i) => (
        <div className="li" key={r.id}>
          <span className="sw" style={{ background: runColor(i) }} />
          {r.name}
        </div>
      ))}
    </div>
  )
}
