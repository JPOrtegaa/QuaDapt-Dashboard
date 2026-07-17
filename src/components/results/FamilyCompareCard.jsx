import Card from '../Card'
import { VennIcon } from '../Icons'
import FamilyDumbbellRow from './FamilyDumbbellRow'
import PairedScatterChart from './PairedScatterChart'

export default function FamilyCompareCard({ families, selectedFamily, onSelectFamily }) {
  if (!families.length) return null
  const maxAE = Math.max(...families.map((f) => Math.max(f.meanAEBase, f.meanAESyn)))
  const active = selectedFamily ?? families[0]

  return (
    <Card
      wide
      icon={<VennIcon />}
      title="Does _syn beat its baseline?"
      subtitle="paired by sample · dot = mean AE · click a family to inspect →"
      style={{ padding: '22px 24px' }}
    >
      <div className="fam-grid">
        <div className="fam-list">
          {families.map((f) => (
            <FamilyDumbbellRow
              key={f.base}
              family={f}
              maxAE={maxAE}
              selected={f.base === active.base}
              onSelect={onSelectFamily}
            />
          ))}
        </div>
        <PairedScatterChart family={active} />
      </div>
    </Card>
  )
}
