import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Cell, ResponsiveContainer,
} from 'recharts'
import { MINT, GREY } from '../../lib/resultsDerive'
import { fmtAE, fmtPct } from '../../lib/resultsFormat'

function PairTooltip({ active, payload, family }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rt-tooltip">
      <div className="tt-h">batch {d.batch}</div>
      <div className="tt-r"><span>{family.base}</span><b>{fmtAE(d.base)}</b></div>
      <div className="tt-r"><span>{family.syn}</span><b>{fmtAE(d.syn)}</b></div>
    </div>
  )
}

// AE(base) vs. AE(syn) per test sample, paired by batch. Points below the
// diagonal are samples where the _syn variant won.
export default function PairedScatterChart({ family }) {
  const data = family.aeBase.map((base, i) => ({
    batch: i,
    base,
    syn: family.aeSyn[i],
    win: family.aeSyn[i] < base,
  }))
  const max = Math.max(...family.aeBase, ...family.aeSyn, 0.02) * 1.06

  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--t4)', marginBottom: 6 }}>
        Paired samples · <span style={{ color: 'var(--t2)', fontWeight: 700 }}>{family.base}</span>
        {' '}vs {family.syn} · each point = one test sample · below the line, <span className="mono" style={{ color: 'var(--mint)' }}>_syn</span> wins
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 24, left: 4 }}>
          <CartesianGrid stroke="rgba(255,255,255,.06)" />
          <XAxis
            type="number"
            dataKey="base"
            domain={[0, max]}
            tick={{ fill: '#5f665e', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            label={{ value: `AE — ${family.base} (base)`, position: 'insideBottom', offset: -16, fill: '#5f665e', fontSize: 11 }}
          />
          <YAxis
            type="number"
            dataKey="syn"
            domain={[0, max]}
            tick={{ fill: '#5f665e', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            label={{ value: `AE — ${family.syn}`, angle: -90, position: 'insideLeft', fill: '#5f665e', fontSize: 11 }}
          />
          <ReferenceLine segment={[{ x: 0, y: 0 }, { x: max, y: max }]} stroke="rgba(255,255,255,.28)" strokeDasharray="4 4" />
          <Tooltip content={<PairTooltip family={family} />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,.2)' }} />
          <Scatter data={data} isAnimationActive animationDuration={550} animationEasing="ease-out">
            {data.map((d, i) => (
              <Cell key={i} fill={d.win ? MINT : GREY} fillOpacity={0.55} r={3} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      <div className="fam-legend">
        <span className="li"><span className="sw" style={{ background: MINT }} />_syn better ({fmtPct(family.winRate)})</span>
        <span className="li"><span className="sw" style={{ background: GREY }} />base better</span>
      </div>
    </div>
  )
}
