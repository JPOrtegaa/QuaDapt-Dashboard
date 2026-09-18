import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { chartRows } from '../../../lib/scoresDerive'

const X_TICKS = [0, 0.25, 0.5, 0.75, 1]
const TOOLTIP_CAP = 8

function DensityTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  // Largest densities first — with 50 dashed class curves only the top few matter.
  const rows = [...payload].sort((a, b) => b.value - a.value).slice(0, TOOLTIP_CAP)
  return (
    <div className="rt-tooltip">
      <div className="tt-h">score ≈ {Number(label).toFixed(2)}</div>
      {rows.map((p) => (
        <div className="tt-r" key={p.dataKey}>
          <span style={{ color: p.color }}>{p.name}</span>
          <b>{p.value.toFixed(2)}</b>
        </div>
      ))}
      {payload.length > rows.length && <div className="tt-r"><span>+{payload.length - rows.length} more</span></div>}
    </div>
  )
}

// Kernel-density curves of classifier scores over [0, 1]. The y-scale comes
// from the artifact (per detector, shared across batches) so scrubbing
// batches doesn't rescale the plot; null falls back to auto.
export default function DensityChart({ x, series, yMax }) {
  const rows = chartRows(x, series)
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={rows} margin={{ top: 10, right: 12, bottom: 8, left: 0 }}>
        <CartesianGrid stroke="rgba(255,255,255,.06)" vertical={false} />
        <XAxis
          type="number"
          dataKey="x"
          domain={[0, 1]}
          ticks={X_TICKS}
          tickFormatter={(v) => v.toFixed(2)}
          tick={{ fill: '#5f665e', fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          label={{ value: 'classifier score', position: 'insideBottomRight', offset: -4, fill: '#5f665e', fontSize: 11 }}
        />
        <YAxis
          domain={[0, yMax ?? 'auto']}
          tick={{ fill: '#5f665e', fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => v.toFixed(1)}
          width={36}
          label={{ value: 'density', angle: -90, position: 'insideLeft', fill: '#5f665e', fontSize: 11 }}
        />
        <Tooltip content={<DensityTooltip />} cursor={{ stroke: 'rgba(255,255,255,.2)', strokeDasharray: '3 3' }} />
        {series.map((s) => (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.name}
            stroke={s.color}
            strokeWidth={s.width}
            strokeDasharray={s.dash ?? undefined}
            fill={s.color}
            fillOpacity={s.fillOpacity}
            dot={false}
            activeDot={{ r: 3, strokeWidth: 0 }}
            isAnimationActive={false}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  )
}
