import { useEffect, useState } from 'react'

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

// Module-level (not per-hook) so the single-run view and the cross-run compare
// share one fetch per experiment+dataset instead of re-downloading the same
// ~250 KB artifact when the compare toggle flips.
const datasetCache = new Map()
const generalCache = new Map()

function cachedJson(cache, key) {
  const hit = cache.get(key)
  if (hit) return hit
  const promise = fetchJson(`${key}.json`).catch((err) => {
    cache.delete(key) // don't cache failures — a retry should refetch
    throw err
  })
  cache.set(key, promise)
  return promise
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
    cachedJson(generalCache, `${experimentId}/general`)
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
  const [state, setState] = useState({ status: 'idle', dataset: null, error: null })

  useEffect(() => {
    if (!id || !experimentId) return
    let alive = true
    setState({ status: 'loading', dataset: null, error: null })
    cachedJson(datasetCache, `${experimentId}/${id}`)
      .then((data) => {
        if (alive) setState({ status: 'ready', dataset: data, error: null })
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

// Fetch several artifacts in parallel and settle into `{ byRun, missingRuns }`.
// A run that 404s (it simply has no results for this dataset) is reported as
// missing rather than failing the whole card — runs don't share a dataset list.
function useAcrossRuns(cache, experimentIds, suffix, enabled) {
  const [state, setState] = useState({ status: 'idle', byRun: {}, missingRuns: [] })
  // Effects can't depend on an array identity that changes every render.
  const key = experimentIds.join('|')

  useEffect(() => {
    if (!enabled || !key || suffix == null) return
    const ids = key.split('|')
    let alive = true
    setState({ status: 'loading', byRun: {}, missingRuns: [] })
    Promise.all(
      ids.map((id) =>
        cachedJson(cache, `${id}/${suffix}`).then(
          (data) => ({ id, data }),
          () => ({ id, data: null }),
        ),
      ),
    ).then((results) => {
      if (!alive) return
      const byRun = {}
      const missingRuns = []
      for (const { id, data } of results) {
        if (data) byRun[id] = data
        else missingRuns.push(id)
      }
      setState({
        status: Object.keys(byRun).length ? 'ready' : 'error',
        byRun,
        missingRuns,
      })
    })
    return () => {
      alive = false
    }
  }, [cache, key, suffix, enabled])

  return state
}

// One dataset's full results from every run, for the cross-run compare chart.
export function useDatasetAcrossRuns(experimentIds, id, enabled) {
  return useAcrossRuns(datasetCache, experimentIds, id ?? null, enabled)
}

// Every run's cross-dataset aggregate, for the General compare card.
export function useGeneralAcrossRuns(experimentIds, enabled) {
  return useAcrossRuns(generalCache, experimentIds, 'general', enabled)
}
