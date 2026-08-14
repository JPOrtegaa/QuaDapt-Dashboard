import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ErrorBar, ResponsiveContainer,
} from 'recharts'
import MethodTick from './MethodTick'
import RunLegend from './RunLegend'
import { runColor } from '../../lib/resultsDerive'
import { fmtAE } from '../../lib/resultsFormat'

const BAR_H = 9 // per run, inside one method's band
const BAND_PAD = 9 // breathing room between methods

function CompareTooltip({ active, payload, runs }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const best = Math.min(...runs.map((r) => d[r.id]).filter((v) => v != null))
  return (
    <div className="rt-tooltip">
      <div className="tt-h">{d.name}</div>
      {runs.map((r, i) => (
        <div className="tt-r" key={r.id}>
          <span style={{ color: runColor(i) }}>{r.name}</span>
          <b style={{ color: d[r.id] === best ? '#eef1ec' : undefined }}>
            {fmtAE(d[r.id])} <span style={{ opacity: 0.55 }}>
              [{fmtAE(d[`${r.id}__q1`])}–{fmtAE(d[`${r.id}__q3`])}]
            </span>
          </b>
        </div>
      ))}
    </div>
  )
}

// One row per method, one bar per experiment run, whiskers = that run's
// Q1-Q3. Restricted to methods every compared run has, so each row is a
// like-for-like read; rows are ordered by the reference run's mean AE.
export default function MethodRunCompareChart({ rows, runs, onSelect }) {
  const synSet = new Set(rows.filter((r) => r.isSyn).map((r) => r.name))
  const maxAE = Math.max(
    ...rows.flatMap((r) => runs.map((run) => r[`${run.id}__q3`] ?? r[run.id])),
  )
  const height = rows.length * (runs.length * BAR_H + BAND_PAD) + 30

  return (
    <>
      {/* ResponsiveContainer caches the height it measured on mount, so
          toggling compare mode (which changes both the row count and the bars
          per row) would keep the old, too-short surface — recharts then
          divides a band that can't fit the bars and renders nothing at all.
          Keying on the shape remounts it so it measures fresh. */}
      <div style={{ width: '100%' }}>
        <ResponsiveContainer key={`${runs.length}x${rows.length}`} width="100%" height={height}>
          <BarChart
            data={rows}
            layout="vertical"
            margin={{ top: 4, right: 20, left: 0, bottom: 0 }}
            barCategoryGap={BAND_PAD}
            barGap={1}
          >
            <CartesianGrid horizontal={false} stroke="rgba(255,255,255,.06)" />
            <XAxis
              type="number"
              domain={[0, maxAE * 1.06]}
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
            <Tooltip content={<CompareTooltip runs={runs} />} cursor={{ fill: 'rgba(255,255,255,.04)' }} />
            {runs.map((run, i) => (
              <Bar
                key={run.id}
                dataKey={run.id}
                name={run.name}
                fill={runColor(i)}
                radius={[0, 3, 3, 0]}
                maxBarSize={BAR_H - 1}
                isAnimationActive
                animationDuration={550}
                animationEasing="ease-out"
                onClick={(d) => onSelect?.(d.name)}
                cursor={onSelect ? 'pointer' : undefined}
              >
                <ErrorBar
                  dataKey={`${run.id}__err`}
                  width={2}
                  strokeWidth={1.1}
                  stroke="rgba(255,255,255,.3)"
                  direction="x"
                />
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <RunLegend runs={runs} />
    </>
  )
}
