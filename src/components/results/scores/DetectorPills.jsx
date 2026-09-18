import DetectorPill from './DetectorPill'

// Pill row over every model the run trained for this dataset.
export default function DetectorPills({ options, selected, onSelect }) {
  return (
    <div className="axis-pills" style={{ marginBottom: 0 }}>
      {options.map((label) => (
        <DetectorPill key={label} label={label} selected={label === selected} onSelect={onSelect} />
      ))}
    </div>
  )
}
