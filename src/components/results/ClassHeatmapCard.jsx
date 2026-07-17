import Card from '../Card'
import { GridIcon } from '../Icons'
import HeatmapRow from './HeatmapRow'
import CalibrationChart from './CalibrationChart'

export default function ClassHeatmapCard({ dataset, selectedMethod, onSelectMethod }) {
  const { methods, classes, calibration } = dataset

  let min = Infinity, max = -Infinity
  for (const m of methods) {
    for (const cls of classes) {
      const v = m.perClassAE[cls]
      if (v == null) continue
      if (v < min) min = v
      if (v > max) max = v
    }
  }

  return (
    <Card
      wide
      icon={<GridIcon />}
      title="Mean AE by class"
      subtitle="where does the error come from? · click a row to inspect its calibration →"
      style={{ padding: '22px 24px' }}
    >
      <div className="heat-grid">
        <div className="heat-scroll">
          <table className="heat-table">
            <thead>
              <tr>
                <th>method</th>
                {classes.map((cls) => (
                  <th key={cls}>{cls}</th>
                ))}
                <th>mean</th>
              </tr>
            </thead>
            <tbody>
              {methods.map((m) => (
                <HeatmapRow
                  key={m.name}
                  method={m}
                  classes={classes}
                  min={min}
                  max={max}
                  selected={m.name === selectedMethod}
                  onSelect={onSelectMethod}
                  hasCalibration={Boolean(calibration[m.name])}
                />
              ))}
            </tbody>
          </table>
        </div>
        <CalibrationChart method={selectedMethod} calibration={calibration[selectedMethod]} classes={classes} />
      </div>
    </Card>
  )
}
