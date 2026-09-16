import { heatColor } from '../../lib/resultsDerive'
import { fmtAE, fmtPick } from '../../lib/resultsFormat'

// One method's row in the mean-AE-by-class heatmap: name, one cell per
// class (colored by error magnitude), then the overall mean. Topline rows
// (sage) expose their per-class detector pick on hover.
export default function HeatmapRow({ method, classes, min, max, selected, onSelect, hasCalibration }) {
  const { pick } = method
  const strong = method.isSyn || method.isTopline
  const nameColor = method.isTopline ? 'var(--sage)' : method.isSyn ? 'var(--t1)' : 'var(--t2)'
  const rowTitle = pick
    ? `per-class pick: ${fmtPick(pick)}`
    : hasCalibration ? 'Click to inspect calibration' : 'No calibration data computed for this method'
  return (
    <tr
      className={selected ? 'sel' : ''}
      onClick={() => onSelect(method.name)}
      style={{ cursor: hasCalibration ? 'pointer' : 'default' }}
      title={rowTitle}
    >
      <td style={{ fontWeight: strong ? 700 : 600, color: nameColor }}>
        {method.name}
      </td>
      {classes.map((cls) => {
        const v = method.perClassAE[cls]
        return (
          <td key={cls} style={{ background: heatColor(v, min, max) }} title={pick ? `from ${pick[cls]}` : undefined}>
            {fmtAE(v, 2)}
          </td>
        )
      })}
      <td className="mean">{fmtAE(method.meanAE)}</td>
    </tr>
  )
}
