// Training / Test batches segmented control, shown in the card's right slot.
const VIEWS = [
  { id: 'training', label: 'Training' },
  { id: 'test', label: 'Test batches' },
]

export default function ScoreSourceToggle({ value, onChange }) {
  return (
    <div className="seg" role="group" aria-label="Score source">
      {VIEWS.map((v) => (
        <button key={v.id} className={value === v.id ? 'on' : ''} onClick={() => onChange(v.id)}>
          {v.label}
        </button>
      ))}
    </div>
  )
}
