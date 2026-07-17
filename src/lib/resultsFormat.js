// Number formatting shared by the Results tab charts/cards.

export function fmtAE(v, digits = 3) {
  return v == null ? '—' : v.toFixed(digits)
}

export function fmtPct(v) {
  return v == null ? '—' : `${Math.round(v * 100)}%`
}

export function fmtDelta(v, digits = 3) {
  if (v == null) return '—'
  const sign = v > 0 ? '+' : v < 0 ? '−' : ''
  return `${sign}${Math.abs(v).toFixed(digits)}`
}

export function fmtSamples(n) {
  return n == null ? '—' : n.toLocaleString('en-US')
}
