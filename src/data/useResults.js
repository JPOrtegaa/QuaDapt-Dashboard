import { useEffect, useRef, useState } from 'react'

// Results artifacts are namespaced per experiment run:
//   data/results/experiments.json           — the run index (switcher order)
//   data/results/<experiment>/manifest.json — that run's dataset list
//   data/results/<experiment>/general.json  — that run's cross-dataset overview
//   data/results/<experiment>/<id>.json     — one dataset's full results
const base = (path) => `${import.meta.env.BASE_URL}data/results/${path}`

function fetchJson(path) {
  return fetch(base(path)).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    return r.json()
  })
}

// Load the experiment index. `experiments[0]` is the default run.
export function useExperiments() {
  const [state, setState] = useState({ status: 'loading', experiments: [], error: null })

  useEffect(() => {
    let alive = true
    fetchJson('experiments.json')
      .then((experiments) => {
        if (alive) setState({ status: 'ready', experiments, error: null })
      })
      .catch((err) => {
        if (alive) setState({ status: 'error', experiments: [], error: err.message })
      })
    return () => {
      alive = false
    }
  }, [])

  return state
}

// Load one experiment's lightweight results manifest (one entry per dataset,
// already flat — DatasetSelector groups by `.source` itself).
export function useResultsManifest(experimentId) {
  const [state, setState] = useState({ status: 'loading', datasets: [], error: null })

  useEffect(() => {
    if (!experimentId) return
    let alive = true
    setState({ status: 'loading', datasets: [], error: null })
    fetchJson(`${experimentId}/manifest.json`)
      .then((manifest) => {
        if (alive) setState({ status: 'ready', datasets: manifest, error: null })
      })
      .catch((err) => {
        if (alive) setState({ status: 'error', datasets: [], error: err.message })
      })
    return () => {
      alive = false
    }
  }, [experimentId])

  return state
}

// Load one experiment's cross-dataset ("General") aggregate artifact.
export function useGeneral(experimentId, enabled) {
  const [state, setState] = useState({ status: 'idle', general: null, error: null })

  useEffect(() => {
    if (!enabled || !experimentId) return
    let alive = true
    setState({ status: 'loading', general: null, error: null })
    fetchJson(`${experimentId}/general.json`)
      .then((data) => {
        if (alive) setState({ status: 'ready', general: data, error: null })
      })
      .catch((err) => {
        if (alive) setState({ status: 'error', general: null, error: err.message })
      })
    return () => {
      alive = false
    }
  }, [experimentId, enabled])

  return state
}

// Lazy-load one dataset's full results JSON on demand, cached per
// experiment+dataset across selections.
export function useResultDataset(experimentId, id) {
  const cache = useRef(new Map())
  const [state, setState] = useState({ status: 'idle', dataset: null, error: null })

  useEffect(() => {
    if (!id || !experimentId) return
    const key = `${experimentId}/${id}`
    const cached = cache.current.get(key)
    if (cached) {
      setState({ status: 'ready', dataset: cached, error: null })
      return
    }
    let alive = true
    setState({ status: 'loading', dataset: null, error: null })
    fetchJson(`${key}.json`)
      .then((data) => {
        if (!alive) return
        cache.current.set(key, data)
        setState({ status: 'ready', dataset: data, error: null })
      })
      .catch((err) => {
        if (alive) setState({ status: 'error', dataset: null, error: err.message })
      })
    return () => {
      alive = false
    }
  }, [experimentId, id])

  return state
}
