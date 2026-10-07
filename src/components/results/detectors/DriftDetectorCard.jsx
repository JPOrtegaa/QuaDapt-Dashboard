import { useState } from 'react'
import Card from '../../Card'
import Stat from '../../Stat'
import { GateIcon } from '../../Icons'
import DetectorPills from '../scores/DetectorPills'
import DensityLegend from '../scores/DensityLegend'
import DistanceHistogramChart from './DistanceHistogramChart'
import DriftRateByClassChart from './DriftRateByClassChart'
import DriftVsShiftChart from './DriftVsShiftChart'
import {
  DETECTOR_LABELS, DETECTOR_COLORS, REFERENCE_COLOR, fmtRaw, shiftSeries,
} from '../../../lib/detectorsDerive'

const NOTES = {
  cdt: 'CDT: one detector per one-vs-rest class — the DyS (Topsoe) distance between the class\'s training scores and the test batch. Grey = the distances it was calibrated on; outside the thresholds the class\'s _cdt methods switch to the synthetic (_syn) scores.',
  ibdd: 'IBDD: one detector for the whole dataset — the MSD between images of the training and test-batch features. Grey = the permutation distances it was calibrated on; on drift every class\'s _ibdd methods switch to the synthetic (_syn) scores.',
}

// The drift detectors that gate QuaDapt in this run: what each one was
// calibrated on vs. what it saw on the test batches, how often it fired per
// class, and whether it fires when the class prior actually shifts.
export default function DriftDetectorCard({ detectors, classes, tv }) {
  const [name, setName] = useState(detectors.names[0])
  const [cls, setCls] = useState(null)

  const activeName = detectors.names.includes(name) ? name : detectors.names[0]
  const cdtModels = detectors.models.cdt ?? {}
  const cdtClasses = classes.filter((c) => cdtModels[c])
  // Class labels are per dataset: a class picked elsewhere falls back to the first.
  const activeCls = cdtClasses.includes(cls) ? cls : cdtClasses[0] ?? null
  const model = activeName === 'cdt' ? cdtModels[activeCls] : detectors.models[activeName]?.all
  const color = DETECTOR_COLORS[activeName]
  const ibddRate = detectors.models.ibdd?.all?.driftRate ?? null

  const legend = [
    { key: 'ref', name: `reference (${model?.nRef ?? 0})`, color: REFERENCE_COLOR },
    { key: 'test', name: `test batches (${model?.nBatches ?? 0})`, color },
    { key: 'thr', name: 'thresholds', color: '#eef1ec', dash: '5 4' },
  ]

  return (
    <Card
      wide
      icon={<GateIcon />}
      title="Drift detectors — when QuaDapt switches to synthetic scores"
      subtitle="drift → the gated method uses its _syn estimate · no drift → the base method on the training scores"
      style={{ padding: '22px 24px' }}
    >
      <div className="dist-grid">
        <div className="dist-side">
          <div className="lbl">Detector</div>
          <DetectorPills
            options={detectors.names.map((n) => DETECTOR_LABELS[n] ?? n)}
            selected={DETECTOR_LABELS[activeName] ?? activeName}
            onSelect={(label) => setName(detectors.names.find((n) => (DETECTOR_LABELS[n] ?? n) === label))}
          />
          {activeName === 'cdt' && (
            <>
              <div className="lbl">Class</div>
              <DetectorPills options={cdtClasses} selected={activeCls} onSelect={setCls} />
            </>
          )}

          {model && (
            <div className="divt dist-stats">
              <Stat label="Drift rate" value={`${(100 * model.driftRate).toFixed(1)}%`} valueColor={color} />
              <Stat label="Upper thr" value={fmtRaw(model.thrUpper)} />
              <Stat label="Lower thr" value={fmtRaw(model.thrLower)} />
            </div>
          )}

          <div className="note" style={{ lineHeight: 1.5 }}>{NOTES[activeName]}</div>
        </div>

        <div className="dist-main">
          <DensityLegend series={legend} />
          {model ? <DistanceHistogramChart model={model} color={color} /> : <div className="chart-sub">No trace for this detector.</div>}
          <div className="dist-caption">
            <span>
              {activeName === 'cdt' ? `${activeCls}-vs-rest CDT` : 'dataset-wide IBDD'} · share of each sample per bin
              {model?.log ? ' · log10 x-axis (non-positive distances clipped to 1e-18)' : ''}
            </span>
          </div>
        </div>
      </div>

      <div className="det-sub-grid">
        {cdtClasses.length > 0 && (
          <DriftRateByClassChart
            cdtModels={cdtModels}
            ibddRate={ibddRate}
            selected={activeName === 'cdt' ? activeCls : null}
            onSelect={(c) => { setName('cdt'); setCls(c) }}
          />
        )}
        <DriftVsShiftChart tv={tv} series={shiftSeries(detectors, activeCls)} />
      </div>
    </Card>
  )
}
