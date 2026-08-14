import Card from '../../Card'
import { BarsIcon } from '../../Icons'
import CompareToggle from '../CompareToggle'
import MethodRunCompareChart from '../MethodRunCompareChart'
import {
  aggregateMethodAE, buildRunCompareRows, sharedDatasetIds,
} from '../../../lib/resultsDerive'

// Cross-dataset mean AE per method. Unlike the per-dataset card, the unit here
// is a DATASET's mean AE — the bar averages those and the whisker is their
// Q1–Q3, i.e. how consistent a method is across the catalog.
//
// Compare mode re-aggregates every run over the datasets they all share (the
// runs cover 57/62/54 datasets), so the bars are like-for-like rather than
// each run scoring itself on its own catalog.
export default function GlobalMethodAECard({
  general,
  mode,
  onModeChange,
  experiments,
  referenceId,
  byRun,
  compareStatus,
}) {
  const compare = mode === 'compare' && compareStatus === 'ready'
  const runs = compare ? experiments.filter((e) => byRun[e.id]?.methodDatasetAE) : []
  const generals = runs.map((e) => byRun[e.id])

  const datasetIds = compare
    ? sharedDatasetIds(generals)
    : (general.methodDatasetAE?.datasets ?? [])
  const sources = compare ? runs : [{ id: referenceId, name: 'this run' }]
  const statsByRun = Object.fromEntries(
    sources.map((e, i) => [e.id, aggregateMethodAE(compare ? generals[i] : general, datasetIds)]),
  )
  // Full coverage only: a method that skipped datasets would average over a
  // different (easier or harder) subset and read as artificially better.
  const { rows, hidden } = buildRunCompareRows(
    statsByRun,
    sources.map((e) => e.id),
    compare ? referenceId : sources[0].id,
    datasetIds.length,
  )

  const parts = [
    `mean of per-dataset mean AE over ${datasetIds.length} datasets`,
    'whisker = IQR across datasets (Q1–Q3)',
  ]
  if (compare) parts.unshift(`${rows.length} methods shared by ${runs.length} runs`)
  if (hidden) parts.push(`${hidden} partial-coverage methods hidden`)

  return (
    <Card
      wide
      icon={<BarsIcon />}
      title="Method accuracy — mean AE across datasets"
      subtitle={parts.join(' · ')}
      right={
        <CompareToggle value={mode} onChange={onModeChange} runCount={experiments.length} />
      }
      style={{ padding: '22px 24px' }}
    >
      {mode === 'compare' && compareStatus === 'loading' && (
        <div className="chart-sub">Loading the other runs…</div>
      )}
      {rows.length === 0 ? (
        <div className="chart-sub">No method covers every shared dataset in these runs.</div>
      ) : (
        <MethodRunCompareChart rows={rows} runs={sources} />
      )}
    </Card>
  )
}
