// Visual values DERIVED in the UI from data (never stored in datasets.json):
// class-segment colors (by rank) and feature range-bar widths/colors (by scale).

// Green -> teal ramp anchors, matching the sketch's class palette.
const RAMP = [
  [195, 226, 154], // #c3e29a sage (largest class)
  [111, 191, 156], // #6fbf9c
  [63, 122, 111],  // #3f7a6f
  [44, 80, 73],    // #2c5049 dark teal (smallest class)
]

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t)
}

function rampColor(t) {
  // t in [0,1] across the RAMP anchors
  const seg = Math.min(RAMP.length - 2, Math.floor(t * (RAMP.length - 1)))
  const local = t * (RAMP.length - 1) - seg
  const [r, g, b] = RAMP[seg].map((c, i) => lerp(c, RAMP[seg + 1][i], local))
  return `rgb(${r},${g},${b})`
}

// Colors for class segments/legend, ordered as the classes array is
// (descending count). Largest class = lightest sage, tail = dark teal.
export function classColors(n) {
  if (n <= 1) return ['#c3e29a']
  return Array.from({ length: n }, (_, i) => rampColor(i / (n - 1)))
}

// A visible min width so tiny tail classes still register on the bar.
export function segmentFlex(pct) {
  return pct >= 1 ? `0 0 ${pct}%` : '0 0 5px'
}

// Feature range-bar: width from the feature's span relative to the widest
// feature (log-scaled so multi-order-of-magnitude ranges read well); color
// steps with width to echo the sketch.
export function rangeBar(span, maxSpan) {
  if (!(maxSpan > 0) || !(span > 0)) return { width: '6%', color: '#6fbf9c' }
  const w = Math.max(6, Math.round((Math.log10(span + 1) / Math.log10(maxSpan + 1)) * 100))
  const color = w > 85 ? '#c3e29a' : w > 55 ? '#8fca97' : '#6fbf9c'
  return { width: `${w}%`, color }
}
