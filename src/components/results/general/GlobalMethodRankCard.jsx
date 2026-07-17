import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, LabelList, ResponsiveContainer,
} from 'recharts'
import Card from '../../Card'
import { BarsIcon } from '../../Icons'
import { MINT, GREY } from '../../../lib/resultsDerive'

const ROW_H = 19

function MethodTick({ x, y, payload, synSet }) {
  const isSyn = synSet.has(payload.value)
  return (
    <text x={x} y={y} dy={4} textAnchor="end" fontFamily="'JetBrains Mono',monospace"
      fontSize={10} fontWeight={isSyn ? 700 : 500} fill={isSyn ? '#eef1ec' : '#93998f'}>
      {payload.value}
    </text>
  )
}

function RankTooltip({ active, payload, total }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rt-tooltip">
      <div className="tt-h">{d.name}</div>
      <div className="tt-r"><span>mean rank</span><b>{d.meanRank.toFixed(2)}</b></div>
      <div className="tt-r"><span>over</span><b>{d.coverage}/{total} datasets</b></div>
    </div>
  )
}

// Average rank of each method across every dataset it appears in (1 = best).
// Restricted to methods present in ALL datasets so the ranks are comparable.
export default function GlobalMethodRankCard({ general }) {
  const data = general.methodRanking
    .filter((m) => m.coverage === general.nDatasets)
    .slice()
    .sort((a, b) => a.meanRank - b.meanRank)
  const excluded = general.methodRanking.length - data.length
  const synSet = new Set(data.filter((m) => m.isSyn).map((m) => m.name))
  const maxRank = Math.max(...data.map((m) => m.meanRank))
  const height = data.length * ROW_H + 24

  return (
    <Card
      wide
      icon={<BarsIcon />}
      title="Global method ranking — mean rank across all datasets"
      subtitle={`lower = better · mint = our adapted (_syn), grey = classic${excluded ? ` · ${excluded} partial-coverage methods hidden` : ''}`}
      style={{ padding: '22px 24px' }}
    >
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 40, left: 0, bottom: 0 }} barCategoryGap={3}>
            <CartesianGrid horizontal={false} stroke="rgba(255,255,255,.06)" />
            <XAxis
              type="number"
              domain={[0, maxRank * 1.08]}
              tick={{ fill: '#5f665e', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
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
            <Tooltip content={<RankTooltip total={general.nDatasets} />} cursor={{ fill: 'rgba(255,255,255,.04)' }} />
            <Bar dataKey="meanRank" radius={[0, 3, 3, 0]} maxBarSize={11} isAnimationActive animationDuration={700}>
              {data.map((m) => (
                <Cell key={m.name} fill={m.isSyn ? MINT : GREY} />
              ))}
              <LabelList
                dataKey="meanRank"
                position="right"
                formatter={(v) => v.toFixed(1)}
                style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fill: '#c8ccc6' }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
