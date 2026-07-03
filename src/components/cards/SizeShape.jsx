import Card from '../Card'
import { GridIcon } from '../Icons'
import { withCommas } from '../../lib/format'

function shapeNote(rowsPerCol) {
  if (rowsPerCol == null) return null
  if (rowsPerCol >= 1000) return 'Tall & narrow — abundant rows per feature.'
  if (rowsPerCol >= 20) return 'Balanced rows-to-features ratio.'
  return 'Wide — few rows per feature; watch for overfitting.'
}

export default function SizeShape({ view }) {
  const { instances, features, rowsPerCol } = view.sizeShape
  return (
    <Card icon={<GridIcon />} title="Size & Shape">
      <div>
        <div className="lbl" style={{ marginBottom: 5 }}>
          Instances
        </div>
        <div className="big">{withCommas(instances)}</div>
      </div>
      <div className="divt" style={{ display: 'flex', gap: 14 }}>
        <div style={{ flex: 1 }}>
          <div className="lbl" style={{ marginBottom: 4 }}>
            Features
          </div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{features}</div>
        </div>
        <div style={{ flex: 1 }}>
          <div className="lbl" style={{ marginBottom: 4 }}>
            Rows : Cols
          </div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>
            {withCommas(rowsPerCol)}
            <span style={{ color: 'var(--t4)' }}>:1</span>
          </div>
        </div>
      </div>
      {shapeNote(rowsPerCol) && <div className="note">{shapeNote(rowsPerCol)}</div>}
    </Card>
  )
}
