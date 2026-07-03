// Compact integer, e.g. 58000 -> "58k", 581012 -> "581k", 1200000 -> "1.2M".
export function compact(n) {
  if (n == null) return '—'
  if (n < 1000) return `${n}`
  if (n < 1_000_000) {
    const k = n / 1000
    return `${k >= 100 ? Math.round(k) : +k.toFixed(1)}k`
  }
  const m = n / 1_000_000
  return `${+m.toFixed(1)}M`
}

// Thousands-separated integer, e.g. 58000 -> "58,000".
export function withCommas(n) {
  return n == null ? '—' : n.toLocaleString('en-US')
}

// One-line dataset descriptor for the dropdown: "58k × 9 · 7 classes".
export function optionDesc(view) {
  if (!view) return ''
  const { instances, features } = view.sizeShape
  const cls = view.classStructure?.nClasses
  const shape = `${compact(instances)} × ${features}`
  if (cls != null) return `${shape} · ${cls} classes`
  if (view.regressionTarget) return `${shape} · regression`
  return `${shape} · no target`
}

export function ratioSuffix(rowsPerCol) {
  return rowsPerCol == null ? '—' : `${withCommas(rowsPerCol)}`
}
