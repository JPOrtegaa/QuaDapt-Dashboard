import {
  ComposedChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts'
import { histogramRows, thresholdX, fmtDistance, REFERENCE_COLOR } from '../../../lib/detectorsDerive'

function HistTooltip({ active, payload, log }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  if (d.refN == null) return null
  return (
    <div className="rt-tooltip">
      <div className="tt-h">{fmtDistance(d.x0, log)} – {fmtDistance(d.x1, log)}</div>
      <div className="tt-r"><span>reference</span><b>{d.refN} ({(100 * d.ref).toFixed(1)}%)</b></div>
      <div className="tt-r"><span>test batches</span><b>{d.testN} ({(100 * d.test).toFixed(1)}%)</b></div>
    </div>
  )
}

// The detector's reference distances (what its thresholds were calibrated
// on) against the statistic it computed on every test batch, binned on the
// same edges and normalized per sample. Anything past a threshold is drift.
export default function DistanceHistogramChart({ model, color }) {
  const rows = histogramRows(model)
  // Step areas need a closing point at the last edge.
  const last = rows[rows.length - 1]
  const data = [...rows.map((r) => ({ ...r, xs: r.x0 })), { xs: last.x1, ref: last.ref, test: last.test }]
  const upper = thresholdX(model, model.thrUpper)
  const lower = thresholdX(model, model.thrLower)
  const inRange = (v) => v != null && v >= model.lo && v <= model.hi

  return (
    <ResponsiveContainer width="100%" height={250}>
      <ComposedChart data={data} margin={{ top: 14, right: 16, bottom: 18, left: 0 }}>
        <CartesianGrid stroke="rgba(255,255,255,.06)" vertical={false} />
        <XAxis
          type="number"
          dataKey="xs"
          domain={[model.lo, model.hi]}
          tickFormatter={(v) => fmtDistance(v, model.log)}
          tick={{ fill: '#5f665e', fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          label={{
            value: model.log ? 'detector statistic (log10)' : 'detector statistic',
            position: 'insideBottom', offset: -10, fill: '#5f665e', fontSize: 11,
          }}
        />
        <YAxis
          tickFormatter={(v) => `${Math.round(v * 100)}%`}
          tick={{ fill: '#5f665e', fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          width={40}
        />
        <Tooltip content={<HistTooltip log={model.log} />} cursor={{ stroke: 'rgba(255,255,255,.2)' }} />
        <Area type="stepAfter" dataKey="ref" stroke={REFERENCE_COLOR} fill={REFERENCE_COLOR} fillOpacity={0.18} strokeWidth={1.6} isAnimationActive={false} />
        <Area type="stepAfter" dataKey="test" stroke={color} fill={color} fillOpacity={0.3} strokeWidth={2} isAnimationActive={false} />
        {inRange(upper) && (
          <ReferenceLine x={upper} stroke="#eef1ec" strokeDasharray="5 4" strokeWidth={1.3}
            label={{ value: 'upper thr', position: 'insideTopRight', fill: '#c8ccc6', fontSize: 10 }} />
        )}
        {inRange(lower) && (
          <ReferenceLine x={lower} stroke="#eef1ec" strokeDasharray="5 4" strokeWidth={1.3}
            label={{ value: 'lower thr', position: 'insideTopLeft', fill: '#c8ccc6', fontSize: 10 }} />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  )
}
