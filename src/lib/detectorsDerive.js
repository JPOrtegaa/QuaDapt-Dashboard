// Visual values derived from a dataset's `detectors` block (see
// scripts/drift_detectors.py): histogram rows, per-batch drift lookups and
// drift-rate-vs-prevalence-shift bins. No statistics are recomputed here.
import { VARIANT_PALETTES } from './resultsDerive'

export const DETECTOR_LABELS = { cdt: 'CDT', ibdd: 'IBDD' }
export const DETECTOR_COLORS = {
  cdt: VARIANT_PALETTES.family.cdt,
  ibdd: VARIANT_PALETTES.family.ibdd,
}
export const REFERENCE_COLOR = '#93998f'

// One row per shared bin: center (in the binned space — log10 for CDT),
// reference count and test count, each as a share of its own sample so a
// 20-point IBDD reference and 1000 test batches stay comparable.
export function histogramRows(model) {
  const { lo, hi, nBins, refHist, testHist } = model
  const width = (hi - lo) / nBins
  const refTotal = refHist.reduce((a, b) => a + b, 0) || 1
  const testTotal = testHist.reduce((a, b) => a + b, 0) || 1
  return refHist.map((r, i) => ({
    x: lo + (i + 0.5) * width,
    x0: lo + i * width,
    x1: lo + (i + 1) * width,
    ref: r / refTotal,
    test: testHist[i] / testTotal,
    refN: r,
    testN: testHist[i],
  }))
}

// A threshold in the histogram's x space (null when it can't be drawn: a
// non-positive bound on a log axis).
export function thresholdX(model, value) {
  if (value == null) return null
  if (!model.log) return value
  return value > 0 ? Math.log10(value) : null
}

// Human tick for the binned x space.
export function fmtDistance(x, log) {
  if (x == null) return '—'
  if (log) return `1e${Math.round(x)}`
  return Math.abs(x) >= 100 ? x.toFixed(0) : x.toPrecision(3)
}
export function fmtRaw(v) {
  if (v == null) return '—'
  return Math.abs(v) < 1e-3 && v !== 0 ? v.toExponential(2) : v.toPrecision(3)
}

// Which detector model gates a given one-vs-rest class: CDT is per class,
// IBDD a single dataset-wide model.
export function gateModel(detectors, name, cls) {
  const models = detectors?.models?.[name]
  if (!models) return null
  return models[cls] ?? models.all ?? null
}

// Drift flag of a detector on one batch for one class (null if unknown).
export function driftAt(detectors, name, cls, batchIndex) {
  const model = gateModel(detectors, name, cls)
  if (!model || batchIndex == null || batchIndex >= model.flags.length) return null
  return model.flags[batchIndex] === '1'
}

// Series for the drift-vs-shift chart: the selected class's CDT flags and IBDD's.
export function shiftSeries(detectors, cls) {
  const out = []
  const cdt = detectors.models.cdt?.[cls]
  if (cdt) out.push({ key: 'cdt', name: `${DETECTOR_LABELS.cdt} · ${cls}`, color: DETECTOR_COLORS.cdt, flags: cdt.flags })
  const ibdd = detectors.models.ibdd?.all
  if (ibdd) out.push({ key: 'ibdd', name: DETECTOR_LABELS.ibdd, color: DETECTOR_COLORS.ibdd, flags: ibdd.flags })
  return out
}

// Drift rate per equal-width TV bin, one key per series ({key: flags}).
export function driftVsShiftBins(tv, flagSeries, nBins = 6) {
  const max = Math.max(...tv, 1e-6)
  const width = max / nBins
  const bins = Array.from({ length: nBins }, (_, i) => ({ x: (i + 0.5) * width, count: 0, sums: {} }))
  for (let i = 0; i < tv.length; i++) {
    const b = bins[Math.min(nBins - 1, Math.floor(tv[i] / width))]
    b.count++
    for (const [key, flags] of Object.entries(flagSeries)) {
      if (flags[i] === '1') b.sums[key] = (b.sums[key] ?? 0) + 1
    }
  }
  return bins.map((b) => {
    const row = { x: b.x, count: b.count }
    for (const key of Object.keys(flagSeries)) row[key] = b.count ? (b.sums[key] ?? 0) / b.count : null
    return row
  })
}
