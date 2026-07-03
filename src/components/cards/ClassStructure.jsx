import Card from '../Card'
import { RadialIcon } from '../Icons'
import ClassSegment from './ClassSegment'
import ClassLegendItem from './ClassLegendItem'
import { classColors } from '../../lib/derive'

const LEGEND_CAP = 15 // avoid rendering hundreds/thousands of legend items

function balanceWord(entropyNorm) {
  if (entropyNorm == null) return null
  if (entropyNorm >= 0.85) return 'well balanced'
  if (entropyNorm >= 0.6) return 'moderately imbalanced'
  return 'severely imbalanced'
}

// Placeholder when there is no categorical class target (regression / unlabeled).
function NoClasses({ view }) {
  const msg = view.regressionTarget
    ? `Continuous target${view.targetColumn ? ` “${view.targetColumn}”` : ''} — regression, no class distribution.`
    : 'No class target identified for this dataset.'
  return (
    <Card wide icon={<RadialIcon />} title="Class Structure" subtitle="not applicable" style={{ padding: '22px 24px' }}>
      <div className="note" style={{ fontSize: 12 }}>
        {msg}
      </div>
    </Card>
  )
}

export default function ClassStructure({ view }) {
  const cs = view.classStructure
  if (!cs) return <NoClasses view={view} />

  const colors = classColors(cs.classes.length)
  const colored = cs.classes.map((c, i) => ({ ...c, color: colors[i] }))

  // Legend: show the largest LEGEND_CAP, fold the rest into an "others" row.
  let legend = colored
  if (colored.length > LEGEND_CAP) {
    const head = colored.slice(0, LEGEND_CAP)
    const tail = colored.slice(LEGEND_CAP)
    const rest = {
      name: `+${tail.length} more`,
      count: tail.reduce((s, c) => s + c.count, 0),
      pct: +tail.reduce((s, c) => s + c.pct, 0).toFixed(2),
      color: 'var(--t4)',
    }
    legend = [...head, rest]
  }

  return (
    <Card
      wide
      icon={<RadialIcon />}
      title="Class Structure"
      subtitle={`${cs.nClasses} classes · ${balanceWord(cs.entropyNorm)}`}
      style={{ padding: '22px 24px', gap: 18 }}
      right={
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span className="badge">
            Entropy<sub style={{ color: 'var(--t4)' }}>norm</sub> <b>{cs.entropyNorm ?? '—'}</b>
          </span>
          <span className="badge">
            Gini <b>{cs.gini ?? '—'}</b>
          </span>
          <span className="badge">
            Imbalance <b style={{ color: 'var(--amber)' }}>{cs.imbalanceRatio ?? '—'}</b>
          </span>
        </div>
      }
    >
      <div className="cbar">
        {colored.map((c) => (
          <ClassSegment key={c.name} name={c.name} pct={c.pct} color={c.color} />
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 12 }}>
        {legend.map((c) => (
          <ClassLegendItem key={c.name} name={c.name} count={c.count} pct={c.pct} color={c.color} />
        ))}
      </div>
    </Card>
  )
}
