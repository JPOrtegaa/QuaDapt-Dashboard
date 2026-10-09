import { PICK_LABELS } from '../../../lib/scoresDerive'

// Which picked reference the test view draws dashed: the synthetic (MoSS)
// scores DySyn selected, or a reshaped variant's pick (the detector's own
// training scores under the gamma chosen for the batch). Shown only when the
// run shipped more than one (`scores.picks` in the manifest).
export default function PickSourceToggle({ picks, value, onChange }) {
  if (!picks || picks.length < 2) return null
  return (
    <div className="divt dist-pick">
      <span className="lbl">Picked reference</span>
      <div className="seg" role="group" aria-label="Picked reference">
        {picks.map((p) => (
          <button key={p} className={value === p ? 'on' : ''} title={PICK_LABELS[p]?.title} onClick={() => onChange(p)}>
            {PICK_LABELS[p]?.label ?? p}
          </button>
        ))}
      </div>
    </div>
  )
}
