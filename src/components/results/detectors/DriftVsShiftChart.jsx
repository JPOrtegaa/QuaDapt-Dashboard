import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { driftVsShiftBins } from '../../../lib/detectorsDerive'

function ShiftTooltip({ active, payload, series }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rt-tooltip">
      <div className="tt-h">TV ≈ {d.x.toFixed(2)}</div>
      <div className="tt-r"><span>batches</span><b>{d.count}</b></div>
      {series.map((s) => (
        <div className="tt-r" key={s.key}>
          <span style={{ color: s.color }}>{s.name}</span>
          <b>{d[s.key] == null ? '—' : `${(100 * d[s.key]).toFixed(1)}%`}</b>
        </div>
      ))}
    </div>
  )
}

// Does the detector fire when the class prior actually moves? Drift rate per
// equal-width bin of the batch's prevalence shift (TV distance from the
// dataset's global prior); faint bars = batches per bin.
export default function DriftVsShiftChart({ tv, series }) {
  const bins = driftVsShiftBins(tv, Object.fromEntries(series.map((s) => [s.key, s.flags])))
  const maxCount = Math.max(...bins.map((b) => b.count), 1)
  return (
    <div>
      <div className="lbl" style={{ marginBottom: 8 }}>Drift rate vs. prevalence shift</div>
      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart data={bins} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,.06)" vertical={false} />
          <XAxis dataKey="x" tickFormatter={(v) => v.toFixed(2)} tick={{ fill: '#5f665e', fontSize: 10 }} tickLine={false} axisLine={false} />
          <YAxis yAxisId="rate" domain={[0, 1]} tickFormatter={(v) => `${Math.round(v * 100)}%`} tick={{ fill: '#5f665e', fontSize: 10 }} tickLine={false} axisLine={false} width={40} />
          <YAxis yAxisId="count" orientation="right" domain={[0, maxCount * 3]} hide />
          <Tooltip content={<ShiftTooltip series={series} />} cursor={{ fill: 'rgba(255,255,255,.03)' }} />
          <Bar yAxisId="count" dataKey="count" fill="rgba(255,255,255,.06)" radius={[3, 3, 0, 0]} isAnimationActive={false} />
          {series.map((s) => (
            <Line
              key={s.key}
              yAxisId="rate"
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              strokeWidth={2.2}
              dot={{ r: 3, fill: s.color, strokeWidth: 0 }}
              connectNulls
              isAnimationActive
              animationDuration={600}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
