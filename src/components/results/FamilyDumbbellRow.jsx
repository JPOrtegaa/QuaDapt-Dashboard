import { fmtDelta, fmtPct } from '../../lib/resultsFormat'

// One base -> _syn family: a mini dumbbell (grey dot = base AE, mint dot =
// _syn AE) on a shared 0..maxAE track, plus the delta and paired win-rate.
export default function FamilyDumbbellRow({ family, maxAE, selected, onSelect }) {
  const baseX = (family.meanAEBase / maxAE) * 100
  const synX = (family.meanAESyn / maxAE) * 100
  const improved = family.deltaMeanAE < 0

  return (
    <div className={`fam-row${selected ? ' sel' : ''}`} onClick={() => onSelect(family)}>
      <div className="fam-name">{family.base}</div>
      <div className="fam-track">
        <div
          className="fam-seg"
          style={{
            left: `${Math.min(baseX, synX)}%`,
            width: `${Math.max(1, Math.abs(synX - baseX))}%`,
            background: improved ? 'rgba(116,224,163,.4)' : 'rgba(224,167,80,.4)',
          }}
        />
        <div className="fam-dot base" style={{ left: `${baseX}%` }} />
        <div className="fam-dot syn" style={{ left: `${synX}%` }} />
      </div>
      <div className="fam-delta" style={{ color: improved ? 'var(--mint)' : 'var(--amber)' }}>
        {fmtDelta(family.deltaMeanAE)} AE
      </div>
      <div className="fam-win">{fmtPct(family.winRate)} win</div>
    </div>
  )
}
