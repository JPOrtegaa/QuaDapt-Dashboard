import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer,
} from 'recharts'
import Card from '../../Card'
import { BarsIcon } from '../../Icons'
import { MINT, AMBER } from '../../../lib/resultsDerive'
import { fmtDelta, fmtPct } from '../../../lib/resultsFormat'

const ROW_H = 17

function LbTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rt-tooltip">
      <div className="tt-h">{d.name}</div>
      <div className="tt-r"><span>mean Δ AE</span><b>{fmtDelta(d.meanDeltaAE)}</b></div>
      <div className="tt-r"><span>win-rate</span><b>{fmtPct(d.meanWinRate)}</b></div>
      <div className="tt-r"><span>families improved</span><b>{d.familiesImproved}/{d.nFamilies}</b></div>
      <div className="tt-r"><span>classes · source</span><b>{d.meta.nClasses} · {d.source}</b></div>
    </div>
  )
}

// All datasets ranked by mean Δ AE (averaged over the 9 _syn families). Green
// bars = QuaDapt improves (negative Δ), amber = regresses. Click to drill in.
export default function LeaderboardCard({ general, onPickDataset }) {
  const data = general.datasets
    .filter((d) => d.meanDeltaAE != null)
    .map((d) => ({ ...d, delta: d.meanDeltaAE }))
    .sort((a, b) => a.delta - b.delta)
  const bound = Math.max(...data.map((d) => Math.abs(d.delta)), 0.01) * 1.08
  const height = data.length * ROW_H + 34

  return (
    <Card
      wide
      icon={<BarsIcon />}
      title="Where does QuaDapt help? — datasets ranked by mean Δ AE"
      subtitle="each bar = one dataset, averaged over its 9 _syn families · green = _syn wins, amber = regresses · click to open →"
      style={{ padding: '22px 24px' }}
    >
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 52, left: 0, bottom: 16 }} barCategoryGap={2}>
            <CartesianGrid horizontal={false} stroke="rgba(255,255,255,.06)" />
            <XAxis
              type="number"
              domain={[-bound, bound]}
              tick={{ fill: '#5f665e', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => v.toFixed(2)}
              label={{ value: 'mean Δ AE  (negative = QuaDapt better)', position: 'insideBottom', offset: -6, fill: '#5f665e', fontSize: 11 }}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={128}
              tickLine={false}
              axisLine={false}
              interval={0}
              tick={{ fill: '#93998f', fontSize: 9.5 }}
            />
            <Tooltip content={<LbTooltip />} cursor={{ fill: 'rgba(255,255,255,.04)' }} />
            <Bar
              dataKey="delta"
              radius={2}
              maxBarSize={11}
              isAnimationActive
              animationDuration={750}
              animationEasing="ease-out"
              onClick={(d) => onPickDataset?.(d.id)}
              cursor="pointer"
            >
              {data.map((d) => (
                <Cell key={d.id} fill={d.delta < 0 ? MINT : AMBER} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
