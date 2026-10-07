import { useState } from 'react'
import Card from '../../Card'
import Stat from '../../Stat'
import { CurvesIcon } from '../../Icons'
import ScoreSourceToggle from './ScoreSourceToggle'
import DetectorPills from './DetectorPills'
import BatchScrubber from './BatchScrubber'
import DetectorVerdict from './DetectorVerdict'
import DensityLegend from './DensityLegend'
import DensityChart from './DensityChart'
import { useScoreTraining, useScoreBatch } from '../../../data/useResults'
import { detectorOptions, scoreState, MULTICLASS } from '../../../lib/scoresDerive'

const SUBTITLE = 'what each detector sees · kernel density of classifier scores over [0, 1] · pick a detector, then a batch'

// The training / test score distributions behind one dataset's detectors:
// the validation scores each one-vs-rest detector was fitted on, and, per
// test batch, the unlabeled incoming scores next to the synthetic positive /
// negative scores QuaDapt selected to explain them. Rendered only for runs
// that dumped raw scores (`manifest.scores`). In detector-gated runs
// (`detectors`, from the dataset JSON) the test view also says, per batch,
// whether each detector sent its gated methods to these synthetic scores.
export default function ScoreDistributionsCard({ experimentId, datasetId, scores, detectors = null }) {
  const [view, setView] = useState('training')
  const [model, setModel] = useState(null)
  const [batchIndex, setBatchIndex] = useState(0)

  const { status: tStatus, data: training, error: tError } = useScoreTraining(experimentId, datasetId)
  const isTest = view === 'test'
  const { status: bStatus, data: batch, error: bError } = useScoreBatch(experimentId, datasetId, batchIndex, isTest)

  // Class labels are per dataset, so a model picked for another dataset falls
  // back to the first detector instead of pointing at a missing key.
  const activeModel =
    training && (model === MULTICLASS || training.labels.includes(model)) ? model : training?.labels[0] ?? null

  const right = <ScoreSourceToggle value={view} onChange={setView} />

  if (tStatus !== 'ready' || !training) {
    return (
      <Card wide icon={<CurvesIcon />} title="Score distributions" subtitle={SUBTITLE} right={right} style={{ padding: '22px 24px' }}>
        <div className="chart-sub">
          {tStatus === 'error' ? `Failed to load scores/${datasetId}/training.json — ${tError}` : 'Loading score distributions…'}
        </div>
      </Card>
    )
  }

  const state = scoreState({ training, view, model: activeModel, batch: isTest ? batch : null })
  const caption = isTest && bStatus === 'error' ? `Failed to load batch ${batchIndex} — ${bError}` : state.caption

  return (
    <Card wide icon={<CurvesIcon />} title="Score distributions" subtitle={SUBTITLE} right={right} style={{ padding: '22px 24px' }}>
      <div className="dist-grid">
        <div className="dist-side">
          <div className="lbl">Detector</div>
          <DetectorPills options={detectorOptions(training)} selected={activeModel} onSelect={setModel} />

          {isTest && (
            <BatchScrubber
              index={batchIndex}
              count={scores.nBatches}
              total={scores.nBatchesTotal}
              batchId={batch?.id ?? training.batchIds[batchIndex]}
              onChange={setBatchIndex}
            />
          )}

          {isTest && detectors && activeModel !== MULTICLASS && (
            <DetectorVerdict
              detectors={detectors}
              model={activeModel}
              batchIndex={Number(training.batchIds[batchIndex])}
            />
          )}

          <div className="divt dist-stats">
            {state.stats.map((s) => (
              <Stat key={s.label} label={s.label} value={s.value} valueColor={s.color} />
            ))}
          </div>

          <div className="note" style={{ lineHeight: 1.5 }}>{state.note}</div>
        </div>

        <div className="dist-main">
          <DensityLegend series={state.series} />
          <DensityChart x={training.x} series={state.series} yMax={state.yMax} />
          <div className="dist-caption">
            <span>{caption}</span>
            <span className="mono">{isTest ? `batch ${batchIndex + 1} / ${scores.nBatches}` : 'reference distribution'}</span>
          </div>
        </div>
      </div>
    </Card>
  )
}
