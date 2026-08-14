// "This run" / "Compare runs" segmented control, shown in a Card's right slot.
// Hidden when there's nothing to compare against, mirroring ExperimentSelector.
const MODES = [
  { id: 'single', label: 'This run' },
  { id: 'compare', label: 'Compare runs' },
]

export default function CompareToggle({ value, onChange, runCount }) {
  if (runCount < 2) return null
  return (
    <div className="seg">
      {MODES.map((m) => (
        <button
          key={m.id}
          className={value === m.id ? 'on' : ''}
          title={m.id === 'compare' ? `Side by side across ${runCount} runs` : ''}
          onClick={() => onChange(m.id)}
        >
          {m.label}
        </button>
      ))}
    </div>
  )
}
