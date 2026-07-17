import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ReferenceLine, Cell, ResponsiveContainer,
} from 'recharts'
import Card from '../../Card'
import { RadialIcon } from '../../Icons'
import { MINT, AMBER } from '../../../lib/resultsDerive'
import { fmtDelta, fmtPct } from '../../../lib/resultsFormat'

// Least-squares fit of y on x over the valid points; null if degenerate.
function linfit(pts) {
  const n = pts.length
  if (n < 3) return null
  const mx = pts.reduce((s, p) => s + p.x, 0) / n
  const my = pts.reduce((s, p) => s + p.y, 0) / n
  let sxx = 0, sxy = 0
  for (const p of pts) {
    sxx += (p.x - mx) ** 2
    sxy += (p.x - mx) * (p.y - my)
  }
  if (sxx === 0) return null
  const slope = sxy / sxx
  return { slope, intercept: my - slope * mx }
}

function ScTooltip({ active, payload, field }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rt-tooltip">
      <div className="tt-h">{d.name}</div>
      <div className="tt-r"><span>{field.label}</span><b>{d.raw == null ? '—' : d.raw.toLocaleString('en-US')}</b></div>
      <div className="tt-r"><span>benefit (−Δ AE)</span><b>{fmtDelta(d.y)}</b></div>
      <div className="tt-r"><span>win-rate</span><b>{fmtPct(d.meanWinRate)}</b></div>
    </div>
  )
}

// Per-dataset scatter: QuaDapt benefit (−mean Δ AE) against a selectable
// dataset descriptor, with a least-squares trend line. Positive y = _syn
// improves; the trend slope echoes the predictor correlation.
export default function MetadataScatterCard({ general, field, onPickField, selectedId, onPickDataset }) {
  const fields = general.metadataFields
  const pred = general.predictors.find((p) => p.key === field.key)

  const data = general.datasets
    .map((d) => {
      const raw = d.meta[field.key]
      const x = raw == null ? null : field.log ? (raw > 0 ? Math.log10(raw) : null) : raw
      const y = d.meanDeltaAE == null ? null : -d.meanDeltaAE
      return { id: d.id, name: d.name, raw, x, y, meanWinRate: d.meanWinRate, win: y != null && y > 0 }
    })
    .filter((d) => d.x != null && d.y != null)

  const fit = linfit(data)
  const xs = data.map((d) => d.x)
  const x0 = Math.min(...xs)
  const x1 = Math.max(...xs)
  const pad = (x1 - x0) * 0.06 || 0.5
  const seg = fit
    ? [
        { x: x0 - pad, y: fit.slope * (x0 - pad) + fit.intercept },
        { x: x1 + pad, y: fit.slope * (x1 + pad) + fit.intercept },
      ]
    : null

  const fmtX = (v) => (field.log ? Math.round(10 ** v).toLocaleString('en-US') : (+v.toFixed(2)).toString())

  return (
    <Card
      wide
      icon={<RadialIcon />}
      title="What predicts a QuaDapt win?"
      subtitle="each dot = one dataset · y = benefit (−mean Δ AE), above 0 = _syn improves · pick an x-axis to probe"
      style={{ padding: '22px 24px' }}
      right={
        pred && pred.corr != null ? (
          <span className="badge">
            r = <b style={{ color: Math.abs(pred.corr) >= 0.25 ? 'var(--mint)' : 'var(--t2)' }}>{pred.corr.toFixed(2)}</b>
          </span>
        ) : null
      }
    >
      <div className="axis-pills">
        {fields.map((f) => (
          <button
            key={f.key}
            className={`axis-pill${f.key === field.key ? ' on' : ''}${f.tier === 'rich' ? ' rich' : ''}`}
            onClick={() => onPickField(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 8 }}>
          <CartesianGrid stroke="rgba(255,255,255,.06)" />
          <XAxis
            type="number"
            dataKey="x"
            domain={[x0 - pad, x1 + pad]}
            tick={{ fill: '#5f665e', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={fmtX}
            label={{ value: `${field.label}${field.log ? ' (log)' : ''}`, position: 'insideBottom', offset: -16, fill: '#93998f', fontSize: 11 }}
          />
          <YAxis
            type="number"
            dataKey="y"
            tick={{ fill: '#5f665e', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => v.toFixed(2)}
            label={{ value: 'benefit  (−Δ AE)', angle: -90, position: 'insideLeft', fill: '#93998f', fontSize: 11 }}
          />
          <ZAxis range={[54, 54]} />
          <ReferenceLine y={0} stroke="rgba(255,255,255,.22)" />
          {seg && <ReferenceLine segment={seg} stroke={MINT} strokeWidth={1.6} strokeDasharray="5 4" ifOverflow="extendDomain" />}
          <Tooltip content={<ScTooltip field={field} />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,.2)' }} />
          <Scatter
            data={data}
            isAnimationActive
            animationDuration={550}
            onClick={(d) => onPickDataset?.(d.id)}
            cursor="pointer"
          >
            {data.map((d) => (
              <Cell
                key={d.id}
                fill={d.win ? MINT : AMBER}
                fillOpacity={selectedId && selectedId === d.id ? 1 : 0.6}
                stroke={selectedId && selectedId === d.id ? '#fff' : 'none'}
                strokeWidth={1.5}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </Card>
  )
}
