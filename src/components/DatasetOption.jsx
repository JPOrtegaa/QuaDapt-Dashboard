import { GridIcon } from './Icons'
import { optionDesc } from '../lib/format'

// One selectable dataset row in the dropdown. Descriptor is derived from the
// raw view so it is stable regardless of the raw/preprocessed toggle.
export default function DatasetOption({ dataset, selected, onPick }) {
  return (
    <div className={`opt${selected ? ' sel' : ''}`} onClick={() => onPick(dataset.id)}>
      <div className="oi">
        <GridIcon fill={selected ? '#74e0a3' : '#5f665e'} size={15} />
      </div>
      <div className="ot">
        <div className="on">{dataset.name}</div>
        <div className="od">{dataset.desc ?? optionDesc(dataset.raw)}</div>
      </div>
      <span className="ck">✓</span>
    </div>
  )
}
