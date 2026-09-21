// "With topline" / "No topline" segmented control in the Results-tab header:
// whether the <base>_topline oracles take part in the analysis. Hidden when
// the active run never synthesized any, mirroring ExperimentSelector.
const MODES = [
  { id: true, label: 'With topline', title: 'Include the _topline oracles (per class, the better of base / _syn)' },
  { id: false, label: 'No topline', title: 'Real methods only — ranks recomputed without the oracles' },
]

export default function ToplineToggle({ value, onChange, hasTopline }) {
  if (!hasTopline) return null
  return (
    <div className="seg" role="group" aria-label="Topline methods">
      {MODES.map((m) => (
        <button
          key={String(m.id)}
          className={value === m.id ? 'on' : ''}
          title={m.title}
          onClick={() => onChange(m.id)}
        >
          {m.label}
        </button>
      ))}
    </div>
  )
}
