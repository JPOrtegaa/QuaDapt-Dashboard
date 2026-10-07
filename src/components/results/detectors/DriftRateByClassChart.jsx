import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ReferenceLine, ResponsiveContainer,
} from 'recharts'
import { DETECTOR_COLORS } from '../../../lib/detectorsDerive'

function RateTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rt-tooltip">
      <div className="tt-h">class {d.cls}</div>
      <div className="tt-r"><span>CDT drift rate</span><b>{(100 * d.rate).toFixed(1)}%</b></div>
    </div>
  )
}

// How often each class's CDT detector fired (= how often its _cdt methods
// switched to synthetic scores), with IBDD's single dataset-wide rate as the
// reference line. Clicking a bar picks that class above.
export default function DriftRateByClassChart({ cdtModels, ibddRate, selected, onSelect }) {
  const data = Object.entries(cdtModels).map(([cls, m]) => ({ cls, rate: m.driftRate }))
  return (
    <div>
      <div className="lbl" style={{ marginBottom: 8 }}>Drift rate by class</div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,.06)" vertical={false} />
          {/* angled: class names (Cottonwood_Willow, …) collide when flat */}
          <XAxis
            dataKey="cls"
            interval={0}
            angle={-35}
            textAnchor="end"
            height={58}
            tick={{ fill: '#93998f', fontSize: 9.5 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis domain={[0, 1]} tickFormatter={(v) => `${Math.round(v * 100)}%`} tick={{ fill: '#5f665e', fontSize: 10 }} tickLine={false} axisLine={false} width={40} />
          <Tooltip content={<RateTooltip />} cursor={{ fill: 'rgba(255,255,255,.04)' }} />
          <Bar dataKey="rate" radius={[3, 3, 0, 0]} maxBarSize={22} onClick={(d) => onSelect(d.cls)} cursor="pointer" isAnimationActive animationDuration={500}>
            {data.map((d) => (
              <Cell key={d.cls} fill={DETECTOR_COLORS.cdt} fillOpacity={selected == null || selected === d.cls ? 1 : 0.4} />
            ))}
          </Bar>
          {ibddRate != null && (
            <ReferenceLine y={ibddRate} stroke={DETECTOR_COLORS.ibdd} strokeDasharray="5 4" strokeWidth={1.5}
              label={{ value: `IBDD ${(100 * ibddRate).toFixed(1)}%`, position: 'insideTopRight', fill: DETECTOR_COLORS.ibdd, fontSize: 10 }} />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
