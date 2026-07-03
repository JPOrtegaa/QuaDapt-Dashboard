import { useEffect, useState } from 'react'
import DatasetSelector from './DatasetSelector'
import ViewToggle from './ViewToggle'
import CardGrid from './CardGrid'
import { SOURCE_LABEL } from '../data/useDatasets'

function formatBytes(bytes) {
  if (bytes == null) return '—'
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB']
  let v = bytes / 1024
  let i = 0
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i++
  }
  return `${v >= 100 ? Math.round(v) : +v.toFixed(1)} ${units[i]}`
}

// A preprocessed block is renderable only if it exists and isn't an error stub.
function validView(v) {
  return v && !v.error
}

export default function DatasetTab({ datasets }) {
  const [selectedId, setSelectedId] = useState(datasets[0]?.id)
  const [viewKind, setViewKind] = useState('raw')

  const dataset = datasets.find((d) => d.id === selectedId) ?? datasets[0]
  const hasPre = validView(dataset?.preprocessed)

  // Fall back to raw if the selected dataset lacks a preprocessed view.
  useEffect(() => {
    if (viewKind === 'preprocessed' && !hasPre) setViewKind('raw')
  }, [viewKind, hasPre])

  if (!dataset) return null
  const view = viewKind === 'preprocessed' && hasPre ? dataset.preprocessed : dataset.raw

  return (
    <>
      <div className="head">
        <div className="head-l">
          <h1>Datasets</h1>
          <DatasetSelector datasets={datasets} selectedId={dataset.id} onSelect={setSelectedId} />
        </div>
        <div className="head-r">
          <ViewToggle value={viewKind} onChange={setViewKind} hasPreprocessed={hasPre} />
          <span className="meta">
            {SOURCE_LABEL[dataset.source] ?? dataset.source} · ingested {formatBytes(dataset.ingestedBytes)}
          </span>
        </div>
      </div>

      <CardGrid view={view} />
    </>
  )
}
