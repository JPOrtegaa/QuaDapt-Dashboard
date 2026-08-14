// Visual/statistical values DERIVED in the UI from the precomputed results
// JSON (binning, color scales) — mirrors the spirit of lib/derive.js for the
// Datasets tab. No AE/win-rate/etc. math happens here; that's all done by
// scripts/generate_results.py.

export const MINT = '#74e0a3' // our adapted (_syn) methods
export const GREY = '#7f8a80' // classic baselines
export const AMBER = '#e0a750' // regression / base-better

// In cross-run compare mode the bar color encodes the *run*, not syn-vs-base
// (the bold Y-axis label carries that instead). Same palette as everywhere
// else — mint, sage, amber, then the muted greens.
const RUN_RAMP = [MINT, '#c3e29a', AMBER, '#6fbf9c', '#93998f']
export function runColor(i) {
  return RUN_RAMP[i % RUN_RAMP.length]
}

// Bucket per-batch AE pairs by their total-variation distance from the
// dataset's global class prior, for the "error vs. prevalence shift" chart.
export function prevalenceShiftBins(tv, aeBase, aeSyn, nBins = 6) {
  const max = Math.max(...tv, 1e-6)
  const width = max / nBins || 1e-6
  const bins = Array.from({ length: nBins }, (_, i) => ({
    x0: i * width,
    x1: (i + 1) * width,
    x: (i + 0.5) * width,
    count: 0,
    sumBase: 0,
    sumSyn: 0,
  }))
  for (let i = 0; i < tv.length; i++) {
    const bi = Math.min(nBins - 1, Math.floor(tv[i] / width))
    const b = bins[bi]
    b.count++
    b.sumBase += aeBase[i]
    b.sumSyn += aeSyn[i]
  }
  return bins.map((b) => ({
    ...b,
    meanAEBase: b.count ? b.sumBase / b.count : null,
    meanAESyn: b.count ? b.sumSyn / b.count : null,
  }))
}

// Green (low error) -> amber (high error) heatmap cell color, scaled to the
// dataset's own min/max so every dataset's table reads relative to itself.
export function heatColor(v, min, max) {
  if (v == null) return 'transparent'
  const t = max > min ? Math.max(0, Math.min(1, (v - min) / (max - min))) : 0
  const lo = [116, 224, 163] // mint
  const hi = [224, 167, 80] // amber
  const rgb = lo.map((c, i) => Math.round(c + (hi[i] - c) * t))
  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${0.14 + t * 0.32})`
}

// Categorical palette for calibration-scatter class coloring — same ramp
// family as the Datasets tab's class-structure colors, reused here.
const CLASS_RAMP = [
  '#74e0a3', '#c3e29a', '#e0a750', '#6fbf9c', '#8fca97',
  '#63c586', '#3f7a6f', '#93998f', '#5f665e', '#2c5049',
]
export function classColor(i) {
  return CLASS_RAMP[i % CLASS_RAMP.length]
}

// ---- cross-run comparison ------------------------------------------------
// Shape every source of per-method AE into one `{ name: {meanAE, q1, q3, isSyn} }`
// map so a single grouped-bar chart can render both the per-dataset card and
// the General aggregate.

// Per-dataset: the JSON already carries mean/Q1/Q3 across that dataset's batches.
export function methodStatsFromDataset(dataset) {
  const stats = {}
  for (const m of dataset.methods) {
    stats[m.name] = { meanAE: m.meanAE, q1: m.q1, q3: m.q3, isSyn: m.isSyn }
  }
  return stats
}

// Linear-interpolated quantile over an ascending array — numpy's default, so
// the UI numbers match a Python cross-check of the same artifact.
function quantile(sorted, p) {
  if (!sorted.length) return null
  const pos = (sorted.length - 1) * p
  const lo = Math.floor(pos)
  const hi = Math.ceil(pos)
  if (lo === hi) return sorted[lo]
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo)
}

// Dataset ids covered by every one of `generals` (runs don't share a dataset
// list, so a cross-run aggregate is only fair over the intersection).
export function sharedDatasetIds(generals) {
  if (!generals.length) return []
  const sets = generals.map((g) => new Set(g.methodDatasetAE?.datasets ?? []))
  return (generals[0].methodDatasetAE?.datasets ?? []).filter((id) =>
    sets.every((s) => s.has(id)),
  )
}

// Macro-aggregate one run over `datasetIds`: the unit is a dataset's mean AE,
// so the whisker here is the spread ACROSS DATASETS — a different quantity
// from the per-dataset card's spread across batches. `n` reports how many of
// the requested datasets the method actually ran on.
export function aggregateMethodAE(general, datasetIds) {
  const matrix = general.methodDatasetAE
  if (!matrix) return {}
  const index = new Map(matrix.datasets.map((id, i) => [id, i]))
  const cols = datasetIds.map((id) => index.get(id)).filter((i) => i != null)

  const stats = {}
  for (const [name, row] of Object.entries(matrix.byMethod)) {
    const values = cols.map((i) => row[i]).filter((v) => v != null)
    if (!values.length) continue
    values.sort((a, b) => a - b)
    stats[name] = {
      meanAE: values.reduce((a, b) => a + b, 0) / values.length,
      q1: quantile(values, 0.25),
      q3: quantile(values, 0.75),
      isSyn: name.endsWith('_syn'),
      n: values.length,
    }
  }
  return stats
}

// Grouped-bar rows: one row per method present in EVERY run, one numeric key
// per run plus its `__err` [below, above] pair for the IQR whisker. Sorted by
// the reference run's mean AE so the chart still reads best -> worst and
// switching the reference re-sorts, making rank changes visible.
export function buildRunCompareRows(statsByRun, runIds, referenceId, minCoverage = 0) {
  const present = runIds.filter((id) => statsByRun[id])
  if (!present.length) return { rows: [], runIds: present, hidden: 0, total: 0 }

  const covered = (s) => s && (s.n == null || s.n >= minCoverage)
  const reference = statsByRun[referenceId] ?? statsByRun[present[0]]
  const total = Object.keys(reference).length
  const names = Object.keys(reference)
    .filter((name) => present.every((id) => covered(statsByRun[id][name])))
    .sort((a, b) => reference[a].meanAE - reference[b].meanAE)

  const rows = names.map((name) => {
    const row = { name, isSyn: reference[name].isSyn }
    for (const id of present) {
      const s = statsByRun[id][name]
      row[id] = s.meanAE
      row[`${id}__q1`] = s.q1
      row[`${id}__q3`] = s.q3
      row[`${id}__err`] = [s.meanAE - s.q1, s.q3 - s.meanAE]
    }
    return row
  })

  return { rows, runIds: present, hidden: total - names.length, total }
}
