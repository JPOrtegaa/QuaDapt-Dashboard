import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ErrorBar, LabelList, ResponsiveContainer,
} from 'recharts'
import { MINT, GREY } from '../../lib/resultsDerive'
import { fmtAE } from '../../lib/resultsFormat'

const ROW_H = 21

function MethodTick({ x, y, payload, synSet }) {
  const isSyn = synSet.has(payload.value)
  return (
    <text
      x={x}
      y={y}
      dy={4}
      textAnchor="end"
      fontFamily="'JetBrains Mono',monospace"
      fontSize={10.5}
      fontWeight={isSyn ? 700 : 500}
      fill={isSyn ? '#eef1ec' : '#93998f'}
    >
      {payload.value}
    </text>
  )
}

function RankTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rt-tooltip">
      <div className="tt-h">{d.name}</div>
      <div className="tt-r"><span>mean AE</span><b>{fmtAE(d.meanAE)}</b></div>
      <div className="tt-r"><span>IQR (Q1–Q3)</span><b>{fmtAE(d.q1)} – {fmtAE(d.q3)}</b></div>
    </div>
  )
}

// Horizontal bar ranking, sorted best -> worst (methods already arrive
// pre-sorted from generate_results.py). Mint bars = _syn variants, grey =
// classic baselines; whiskers show the per-method AE interquartile range.
export default function MethodRankingChart({ methods, selected, onSelect }) {
  const synSet = new Set(methods.filter((m) => m.isSyn).map((m) => m.name))
  const data = methods.map((m) => ({
    name: m.name,
    meanAE: m.meanAE,
    q1: m.q1,
    q3: m.q3,
    isSyn: m.isSyn,
    err: [+(m.meanAE - m.q1).toFixed(3), +(m.q3 - m.meanAE).toFixed(3)],
  }))
  const maxAE = Math.max(...data.map((d) => d.q3 ?? d.meanAE))
  const height = data.length * ROW_H + 30

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 44, left: 0, bottom: 0 }} barCategoryGap={3}>
          <CartesianGrid horizontal={false} stroke="rgba(255,255,255,.06)" />
          <XAxis
            type="number"
            domain={[0, maxAE * 1.08]}
            tick={{ fill: '#5f665e', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => v.toFixed(2)}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={82}
            tickLine={false}
            axisLine={false}
            interval={0}
            tick={<MethodTick synSet={synSet} />}
          />
          <Tooltip content={<RankTooltip />} cursor={{ fill: 'rgba(255,255,255,.04)' }} />
          <Bar
            dataKey="meanAE"
            radius={[0, 4, 4, 0]}
            maxBarSize={11}
            isAnimationActive
            animationDuration={700}
            animationEasing="ease-out"
            onClick={(d) => onSelect?.(d.name)}
            cursor="pointer"
          >
            {data.map((d) => (
              <Cell
                key={d.name}
                fill={d.isSyn ? MINT : GREY}
                fillOpacity={!selected || selected === d.name ? 1 : 0.4}
              />
            ))}
            <ErrorBar dataKey="err" width={3} strokeWidth={1.3} stroke="rgba(255,255,255,.32)" direction="x" />
            <LabelList
              dataKey="meanAE"
              position="right"
              formatter={(v) => v.toFixed(3)}
              style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5, fill: '#c8ccc6' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
