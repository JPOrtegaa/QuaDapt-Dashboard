import VerdictRow from './VerdictRow'
import { DETECTOR_LABELS, DETECTOR_COLORS, driftAt } from '../../../lib/detectorsDerive'

// Under the batch scrubber in detector-gated runs: per detector, whether it
// flagged this batch for the selected class — i.e. whether the dashed
// synthetic curves or the training distributions fed its gated methods.
export default function DetectorVerdict({ detectors, model, batchIndex }) {
  return (
    <div className="verdict">
      <div className="lbl">Detector verdict</div>
      {detectors.names.map((name) => (
        <VerdictRow
          key={name}
          label={DETECTOR_LABELS[name] ?? name}
          color={DETECTOR_COLORS[name] ?? 'var(--t2)'}
          drift={driftAt(detectors, name, model, batchIndex)}
          suffix={`_${name}`}
        />
      ))}
    </div>
  )
}
