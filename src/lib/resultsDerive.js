// Visual/statistical values DERIVED in the UI from the precomputed results
// JSON (binning, color scales) — mirrors the spirit of lib/derive.js for the
// Datasets tab. No AE/win-rate/etc. math happens here; that's all done by
// scripts/generate_results.py.

export const MINT = '#74e0a3' // our adapted (_syn) methods
export const GREY = '#7f8a80' // classic baselines
export const AMBER = '#e0a750' // regression / base-better

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
