import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts'
import { classColor } from '../../lib/resultsDerive'
import { fmtAE } from '../../lib/resultsFormat'

const LEGEND_CAP = 12

function CalibTooltip({ active, payload, classes }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rt-tooltip">
      <div className="tt-h">class {classes[d.c]}</div>
      <div className="tt-r"><span>true</span><b>{fmtAE(d.t, 2)}</b></div>
      <div className="tt-r"><span>estimated</span><b>{fmtAE(d.e, 2)}</b></div>
    </div>
  )
}

// True vs. estimated prevalence for one method, colored by class. Points on
// the diagonal are unbiased; above = over-estimated, below = under.
export default function CalibrationChart({ method, calibration, classes }) {
  if (!calibration) {
    return (
      <div className="calib-empty">
        No calibration data computed for <b style={{ color: 'var(--t2)', margin: '0 4px' }}>{method}</b>
        — only the best method and each _syn family pair carry sampled calibration points.
      </div>
    )
  }

  const { t, e, c } = calibration
  const byClass = new Map()
  for (let i = 0; i < t.length; i++) {
    const arr = byClass.get(c[i]) ?? []
    arr.push({ t: t[i], e: e[i], c: c[i] })
    byClass.set(c[i], arr)
  }
  const classIdxs = [...byClass.keys()].sort((a, b) => a - b)
  const legend = classIdxs.slice(0, LEGEND_CAP)
  const hiddenCount = classIdxs.length - legend.length

  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--t4)', marginBottom: 6 }}>
        Calibration · <span style={{ color: 'var(--mint)', fontWeight: 700 }}>{method}</span> · estimated vs. true prevalence · on the line = unbiased
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <ScatterChart margin={{ top: 10, right: 16, bottom: 24, left: 4 }}>
          <CartesianGrid stroke="rgba(255,255,255,.06)" />
          <XAxis
            type="number"
            dataKey="t"
            domain={[0, 1]}
            tick={{ fill: '#5f665e', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            label={{ value: 'true prevalence', position: 'insideBottom', offset: -16, fill: '#5f665e', fontSize: 11 }}
          />
          <YAxis
            type="number"
            dataKey="e"
            domain={[0, 1]}
            tick={{ fill: '#5f665e', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            label={{ value: 'estimated', angle: -90, position: 'insideLeft', fill: '#5f665e', fontSize: 11 }}
          />
          <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }]} stroke="rgba(255,255,255,.28)" strokeDasharray="4 4" />
          <Tooltip content={<CalibTooltip classes={classes} />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,.2)' }} />
          {classIdxs.map((ci) => (
            <Scatter
              key={ci}
              data={byClass.get(ci)}
              fill={classColor(ci)}
              fillOpacity={0.6}
              isAnimationActive
              animationDuration={550}
              animationEasing="ease-out"
            />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
      <div className="calib-legend">
        {legend.map((ci) => (
          <span className="li" key={ci}>
            <span className="sw" style={{ background: classColor(ci) }} />
            {classes[ci]}
          </span>
        ))}
        {hiddenCount > 0 && <span className="li">+{hiddenCount} more</span>}
      </div>
    </div>
  )
}
