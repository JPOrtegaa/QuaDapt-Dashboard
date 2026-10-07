import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, LabelList, ResponsiveContainer,
} from 'recharts'
import Card from '../../Card'
import { BarsIcon } from '../../Icons'
import MethodTick from '../MethodTick'
import { usePalette } from '../PaletteContext'
import { methodColor, VARIANT_PALETTES } from '../../../lib/resultsDerive'

const ROW_H = 19

function RankTooltip({ active, payload, total }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rt-tooltip">
      <div className="tt-h">{d.name}</div>
      <div className="tt-r"><span>mean rank</span><b>{d.rank.toFixed(2)}</b></div>
      <div className="tt-r"><span>over</span><b>{d.coverage}/{total} datasets</b></div>
    </div>
  )
}

// Average rank of each method across every dataset it appears in (1 = best).
// Restricted to methods present in ALL datasets so the ranks are comparable.
// Without toplines the artifact's second rank pool (`meanRankNoTopline`, real
// methods ranked among themselves) is plotted, so dropping the oracles doesn't
// leave every real method's rank shifted by the toplines above it.
export default function GlobalMethodRankCard({ general, showTopline = true }) {
  const pool = showTopline
    ? general.methodRanking
    : general.methodRanking.filter((m) => !m.isTopline)
  const data = pool
    .filter((m) => m.coverage === general.nDatasets)
    .map((m) => ({ ...m, rank: showTopline ? m.meanRank : m.meanRankNoTopline ?? m.meanRank }))
    .sort((a, b) => a.rank - b.rank)
  const excluded = pool.length - data.length
  const palette = usePalette()
  const hasTopline = data.some((m) => m.isTopline)
  const maxRank = Math.max(...data.map((m) => m.rank))
  const height = data.length * ROW_H + 24
  const legend = palette === VARIANT_PALETTES.family
    ? `blue = classic, green = QuaDapt_cdt, orange = QuaDapt_ibdd, red = QuaDapt (_syn)${hasTopline ? ', sage = _topline oracle' : ''}`
    : `mint = our adapted (_syn)${hasTopline ? ', sage = _topline oracle' : ''}, grey = classic`

  return (
    <Card
      wide
      icon={<BarsIcon />}
      title="Global method ranking — mean rank across all datasets"
      subtitle={`lower = better · ${legend}${excluded ? ` · ${excluded} partial-coverage methods hidden` : ''}`}
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
              tick={<MethodTick fontSize={10} />}
            />
            <Tooltip content={<RankTooltip total={general.nDatasets} />} cursor={{ fill: 'rgba(255,255,255,.04)' }} />
            <Bar dataKey="rank" radius={[0, 3, 3, 0]} maxBarSize={11} isAnimationActive animationDuration={700}>
              {data.map((m) => (
                <Cell key={m.name} fill={methodColor(m, palette)} />
              ))}
              <LabelList
                dataKey="rank"
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
