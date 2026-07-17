import { heatColor } from '../../lib/resultsDerive'
import { fmtAE } from '../../lib/resultsFormat'

// One method's row in the mean-AE-by-class heatmap: name, one cell per
// class (colored by error magnitude), then the overall mean.
export default function HeatmapRow({ method, classes, min, max, selected, onSelect, hasCalibration }) {
  return (
    <tr
      className={selected ? 'sel' : ''}
      onClick={() => onSelect(method.name)}
      style={{ cursor: hasCalibration ? 'pointer' : 'default' }}
      title={hasCalibration ? 'Click to inspect calibration' : 'No calibration data computed for this method'}
    >
      <td style={{ fontWeight: method.isSyn ? 700 : 600, color: method.isSyn ? 'var(--t1)' : 'var(--t2)' }}>
        {method.name}
      </td>
      {classes.map((cls) => {
        const v = method.perClassAE[cls]
        return (
          <td key={cls} style={{ background: heatColor(v, min, max) }}>
            {fmtAE(v, 2)}
          </td>
        )
      })}
      <td className="mean">{fmtAE(method.meanAE)}</td>
    </tr>
  )
}
