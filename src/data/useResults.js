import { useEffect, useRef, useState } from 'react'

// Load the lightweight results manifest (one entry per dataset, already flat —
// DatasetSelector groups by `.source` itself).
export function useResultsManifest() {
  const [state, setState] = useState({ status: 'loading', datasets: [], error: null })

  useEffect(() => {
    let alive = true
    fetch(`${import.meta.env.BASE_URL}data/results/manifest.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((manifest) => {
        if (alive) setState({ status: 'ready', datasets: manifest, error: null })
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

// Load the cross-dataset ("General") aggregate artifact once.
export function useGeneral(enabled) {
  const [state, setState] = useState({ status: 'idle', general: null, error: null })

  useEffect(() => {
    if (!enabled) return
    let alive = true
    setState((s) => (s.status === 'ready' ? s : { status: 'loading', general: null, error: null }))
    fetch(`${import.meta.env.BASE_URL}data/results/general.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((data) => {
        if (alive) setState({ status: 'ready', general: data, error: null })
      })
      .catch((err) => {
        if (alive) setState({ status: 'error', general: null, error: err.message })
      })
    return () => {
      alive = false
    }
  }, [enabled])

  return state
}

// Lazy-load one dataset's full results JSON on demand, cached across selections.
export function useResultDataset(id) {
  const cache = useRef(new Map())
  const [state, setState] = useState({ status: 'idle', dataset: null, error: null })

  useEffect(() => {
    if (!id) return
    const cached = cache.current.get(id)
    if (cached) {
      setState({ status: 'ready', dataset: cached, error: null })
      return
    }
    let alive = true
    setState({ status: 'loading', dataset: null, error: null })
    fetch(`${import.meta.env.BASE_URL}data/results/${id}.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((data) => {
        if (!alive) return
        cache.current.set(id, data)
        setState({ status: 'ready', dataset: data, error: null })
      })
      .catch((err) => {
        if (alive) setState({ status: 'error', dataset: null, error: err.message })
      })
    return () => {
      alive = false
    }
  }, [id])

  return state
}
