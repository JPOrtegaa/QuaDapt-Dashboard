import Card from '../Card'
import { BarsIcon } from '../Icons'
import CompareToggle from './CompareToggle'
import MethodRankingChart from './MethodRankingChart'
import MethodRunCompareChart from './MethodRunCompareChart'
import { buildRunCompareRows, methodStatsFromDataset } from '../../lib/resultsDerive'

// Subtitle for compare mode: what the whisker means here (spread across this
// dataset's batches), which runs actually made it in, and what got dropped.
function compareSubtitle(rows, runs, hidden, missingNames) {
  const parts = [
    `${rows.length} methods shared by ${runs.length} runs`,
    'bar = mean AE per run · whisker = IQR across batches (Q1–Q3)',
  ]
  if (hidden) parts.push(`${hidden} run-specific methods hidden`)
  if (missingNames.length) parts.push(`not run on ${missingNames.join(', ')}`)
  return parts.join(' · ')
}

// Method ranking for the selected dataset — either the active run alone, or
// every run side by side so a config change (dissimilarity, bin range) can be
// read off directly instead of by flipping the experiment switcher.
export default function MethodRankingCard({
  methods,
  selectedMethod,
  onSelectMethod,
  mode,
  onModeChange,
  experiments,
  referenceId,
  byRun,
  missingRuns,
  compareStatus,
}) {
  const compare = mode === 'compare'
  const runs = experiments.filter((e) => byRun[e.id])
  // A run that simply has no results for this dataset is named, not silently dropped.
  const missingNames = experiments.filter((e) => missingRuns.includes(e.id)).map((e) => e.name)
  const statsByRun = Object.fromEntries(
    runs.map((e) => [e.id, methodStatsFromDataset(byRun[e.id])]),
  )
  const { rows, hidden } = compare
    ? buildRunCompareRows(statsByRun, runs.map((e) => e.id), referenceId)
    : { rows: [], hidden: 0 }
  // An empty intersection would render an axis and nothing else — say so.
  const usable = compare && compareStatus === 'ready' && rows.length > 0

  return (
    <Card
      wide
      icon={<BarsIcon />}
      title="Method ranking — mean absolute error"
      subtitle={
        usable
          ? compareSubtitle(rows, runs, hidden, missingNames)
          : 'sorted best → worst · bar = mean AE · whisker = interquartile range (Q1–Q3)'
      }
      right={
        <CompareToggle value={mode} onChange={onModeChange} runCount={experiments.length} />
      }
      style={{ padding: '22px 24px' }}
    >
      {compare && compareStatus === 'loading' && (
        <div className="chart-sub">Loading the other runs…</div>
      )}
      {compare && compareStatus === 'ready' && rows.length === 0 && (
        <div className="chart-sub">
          These runs share no methods for this dataset — showing the active run instead.
        </div>
      )}

      {usable ? (
        <MethodRunCompareChart rows={rows} runs={runs} onSelect={onSelectMethod} />
      ) : (
        <MethodRankingChart methods={methods} selected={selectedMethod} onSelect={onSelectMethod} />
      )}
    </Card>
  )
}
