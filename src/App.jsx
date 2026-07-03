import { useState } from 'react'
import TabNav from './components/TabNav'
import DatasetTab from './components/DatasetTab'
import { useDatasets } from './data/useDatasets'

export default function App() {
  const [tab, setTab] = useState('datasets')
  const { status, datasets, error } = useDatasets()

  return (
    <div className="wrap">
      <TabNav active={tab} onChange={setTab} />
      {status === 'loading' && <div className="state">Loading datasets…</div>}
      {status === 'error' && (
        <div className="state err">Failed to load data/datasets.json — {error}</div>
      )}
      {status === 'ready' && datasets.length === 0 && (
        <div className="state">No datasets found in datasets.json.</div>
      )}
      {status === 'ready' && datasets.length > 0 && tab === 'datasets' && (
        <DatasetTab datasets={datasets} />
      )}
    </div>
  )
}
