// Step / scrub through the shipped test batches. `count` is how many batch
// artifacts exist (the generator caps them), `total` how many the run had.
export default function BatchScrubber({ index, count, total, batchId, onChange }) {
  const last = count - 1
  return (
    <div className="divt dist-batch">
      <div className="dist-batch-h">
        <span className="lbl">Batch</span>
        <span className="mono dist-batch-of">
          {count < total ? `first ${count} of ${total.toLocaleString('en-US')}` : `of ${total}`}
        </span>
      </div>
      <div className="dist-batch-row">
        <button className="dist-step" aria-label="Previous batch" disabled={index <= 0} onClick={() => onChange(index - 1)}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 1.5 3 5l3.5 3.5" /></svg>
        </button>
        <span className="mono dist-batch-id">{batchId ?? String(index).padStart(4, '0')}</span>
        <button className="dist-step" aria-label="Next batch" disabled={index >= last} onClick={() => onChange(index + 1)}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 1.5 7 5 3.5 8.5" /></svg>
        </button>
      </div>
      <input
        className="dist-range"
        type="range"
        min={0}
        max={last}
        step={1}
        value={index}
        aria-label="Batch index"
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  )
}
