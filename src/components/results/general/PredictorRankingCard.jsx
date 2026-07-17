import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ReferenceLine, ResponsiveContainer,
} from 'recharts'
import Card from '../../Card'
import { DiamondIcon } from '../../Icons'
import { MINT, AMBER } from '../../../lib/resultsDerive'

function PredTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const dir = d.corr > 0 ? 'more benefit as it rises' : 'less benefit as it rises'
  return (
    <div className="rt-tooltip">
      <div className="tt-h">{d.label}</div>
      <div className="tt-r"><span>correlation r</span><b>{d.corr?.toFixed(2) ?? '—'}</b></div>
      <div className="tt-r"><span>datasets</span><b>{d.n}</b></div>
      <div style={{ marginTop: 4, fontSize: 11, color: 'var(--t4)' }}>{dir}</div>
    </div>
  )
}

// Ranks the dataset descriptors by how strongly each correlates with the
// QuaDapt benefit (−mean Δ AE) across datasets. Mint = higher value helps,
// amber = higher value hurts. Click a bar to load it into the scatter.
export default function PredictorRankingCard({ general, selectedKey, onPickField }) {
  const data = general.predictors
    .filter((p) => p.corr != null)
    .map((p) => ({ ...p }))

  return (
    <Card
      wide
      icon={<DiamondIcon />}
      title="Which dataset property best predicts the benefit?"
      subtitle="correlation of each descriptor with QuaDapt benefit (−mean Δ AE) across all datasets · click a bar to probe it →"
      style={{ padding: '22px 24px' }}
    >
      <div style={{ width: '100%', height: data.length * 30 + 30 }}>
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 40, left: 0, bottom: 0 }} barCategoryGap={6}>
            <CartesianGrid horizontal={false} stroke="rgba(255,255,255,.06)" />
            <XAxis
              type="number"
              domain={[-0.6, 0.6]}
              tick={{ fill: '#5f665e', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => v.toFixed(1)}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={132}
              tickLine={false}
              axisLine={false}
              interval={0}
              tick={{ fill: '#93998f', fontSize: 10.5 }}
            />
            <ReferenceLine x={0} stroke="rgba(255,255,255,.22)" />
            <Tooltip content={<PredTooltip />} cursor={{ fill: 'rgba(255,255,255,.04)' }} />
            <Bar
              dataKey="corr"
              radius={2}
              maxBarSize={15}
              isAnimationActive
              animationDuration={700}
              onClick={(d) => onPickField?.(d.key)}
              cursor="pointer"
            >
              {data.map((d) => (
                <Cell
                  key={d.key}
                  fill={d.corr > 0 ? MINT : AMBER}
                  fillOpacity={!selectedKey || selectedKey === d.key ? 1 : 0.38}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
