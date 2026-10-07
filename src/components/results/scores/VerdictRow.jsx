// One detector's decision on the current batch for the selected class: did
// it flag drift, and therefore which scores its gated methods used.
export default function VerdictRow({ label, color, drift, suffix }) {
  const unknown = drift == null
  return (
    <div className="verdict-row">
      <span className="sw" style={{ background: color, opacity: drift ? 1 : 0.35 }} />
      <b style={{ color }}>{label}</b>
      <span>
        {unknown
          ? 'no trace for this batch'
          : drift
            ? <>drift → <span className="mono">{suffix}</span> uses synthetic scores</>
            : <>no drift → <span className="mono">{suffix}</span> uses training scores</>}
      </span>
    </div>
  )
}
