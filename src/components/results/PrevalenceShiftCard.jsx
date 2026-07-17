import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import Card from '../Card'
import { RadialIcon } from '../Icons'
import { prevalenceShiftBins, MINT, GREY } from '../../lib/resultsDerive'
import { fmtAE } from '../../lib/resultsFormat'

function ShiftTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rt-tooltip">
      <div className="tt-h">TV ≈ {d.x.toFixed(2)}</div>
      <div className="tt-r"><span>samples</span><b>{d.count}</b></div>
      <div className="tt-r"><span>base</span><b>{fmtAE(d.meanAEBase)}</b></div>
      <div className="tt-r"><span>_syn</span><b>{fmtAE(d.meanAESyn)}</b></div>
    </div>
  )
}

// Mean AE (base vs. _syn) as a function of how far a batch's true prevalence
// has drifted from the dataset's global class prior, binned into equal-width
// TV-distance buckets. Bars show how many test samples land in each bucket.
export default function PrevalenceShiftCard({ tv, family }) {
  if (!family) return null
  const bins = prevalenceShiftBins(tv, family.aeBase, family.aeSyn)
  const maxAE = Math.max(...bins.map((b) => Math.max(b.meanAEBase ?? 0, b.meanAESyn ?? 0)))
  const maxCount = Math.max(...bins.map((b) => b.count), 1)

  return (
    <Card
      wide
      icon={<RadialIcon />}
      title={<>Error vs. prevalence shift — <span style={{ color: 'var(--mint)' }}>{family.base}</span></>}
      subtitle="x = total-variation distance from the global prior · y = mean AE in each drift bin · bars = sample count"
      style={{ padding: '22px 24px' }}
    >
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={bins} margin={{ top: 10, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,.06)" vertical={false} />
          <XAxis
            dataKey="x"
            tickFormatter={(v) => v.toFixed(2)}
            tick={{ fill: '#5f665e', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            label={{ value: 'prevalence shift (TV distance from prior)', position: 'insideBottom', offset: -4, fill: '#5f665e', fontSize: 11 }}
          />
          <YAxis
            yAxisId="ae"
            domain={[0, maxAE * 1.15 || 1]}
            tick={{ fill: '#5f665e', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => v.toFixed(2)}
          />
          <YAxis yAxisId="count" orientation="right" domain={[0, maxCount * 3]} hide />
          <Tooltip content={<ShiftTooltip />} cursor={{ fill: 'rgba(255,255,255,.03)' }} />
          <Legend
            verticalAlign="top"
            align="right"
            height={24}
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 11, color: 'var(--t3)' }}
          />
          <Bar yAxisId="count" dataKey="count" name="samples" fill="rgba(255,255,255,.06)" radius={[3, 3, 0, 0]} isAnimationActive animationDuration={600} />
          <Line
            yAxisId="ae"
            type="monotone"
            dataKey="meanAEBase"
            name={family.base}
            stroke={GREY}
            strokeWidth={2}
            dot={{ r: 3, fill: GREY, strokeWidth: 0 }}
            isAnimationActive
            animationDuration={700}
            connectNulls
          />
          <Line
            yAxisId="ae"
            type="monotone"
            dataKey="meanAESyn"
            name={family.syn}
            stroke={MINT}
            strokeWidth={2.5}
            dot={{ r: 3, fill: MINT, strokeWidth: 0 }}
            isAnimationActive
            animationDuration={700}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    </Card>
  )
}
