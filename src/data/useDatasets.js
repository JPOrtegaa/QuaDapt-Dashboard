import { useEffect, useState } from 'react'

// Load public/data/datasets.json (grouped by source) and flatten into a single
// ordered list, preserving source order for the grouped dropdown.
export function useDatasets() {
  const [state, setState] = useState({ status: 'loading', datasets: [], error: null })

  useEffect(() => {
    let alive = true
    fetch(`${import.meta.env.BASE_URL}data/datasets.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((grouped) => {
        if (!alive) return
        const datasets = []
        for (const [source, items] of Object.entries(grouped)) {
          for (const d of items) datasets.push({ ...d, source: d.source ?? source })
        }
        setState({ status: 'ready', datasets, error: null })
      })
      .catch((err) => {
        if (alive) setState({ status: 'error', datasets: [], error: err.message })
      })
    return () => {
      alive = false
    }
  }, [])

  return state
}

// Human-friendly source label for group headers / meta line.
export const SOURCE_LABEL = {
  _general: 'Overview',
  kaggle: 'Kaggle',
  uci: 'UCI',
  quapy: 'QuaPy',
  openml: 'OpenML',
  ours: 'Ours',
  schumacher: 'Schumacher',
  synthetic: 'Synthetic',
  other: 'Other',
}
