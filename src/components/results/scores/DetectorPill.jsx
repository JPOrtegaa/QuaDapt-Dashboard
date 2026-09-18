// One detector option: the multiclass model or a <class>-vs-rest detector.
export default function DetectorPill({ label, selected, onSelect }) {
  return (
    <button className={`axis-pill${selected ? ' on' : ''}`} onClick={() => onSelect(label)}>
      {label}
    </button>
  )
}
