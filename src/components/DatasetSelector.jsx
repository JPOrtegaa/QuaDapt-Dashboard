import { useEffect, useMemo, useRef, useState } from 'react'
import DatasetOption from './DatasetOption'
import { SearchIcon } from './Icons'
import { SOURCE_LABEL } from '../data/useDatasets'

// Pill + dropdown. Options are grouped by source and filtered by the search box.
export default function DatasetSelector({ datasets, selectedId, onSelect }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  const selected = datasets.find((d) => d.id === selectedId)

  // Group filtered datasets by source, preserving first-seen source order.
  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = q
      ? datasets.filter(
          (d) => d.name.toLowerCase().includes(q) || d.source.toLowerCase().includes(q),
        )
      : datasets
    const out = new Map()
    for (const d of filtered) {
      if (!out.has(d.source)) out.set(d.source, [])
      out.get(d.source).push(d)
    }
    return [...out.entries()]
  }, [datasets, query])

  function pick(id) {
    onSelect(id)
    setOpen(false)
    setQuery('')
  }

  return (
    <div className={`selector${open ? ' open' : ''}`} ref={ref}>
      <div
        className="pill"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((o) => !o)
        }}
      >
        <span className="sw" />
        <span className="nm">{selected ? selected.name : 'Select dataset'}</span>
        <span className="car">▾</span>
      </div>

      {open && (
        <div className="menu">
          <div className="menu-h">
            <span>Switch dataset</span>
            <span className="mono" style={{ color: 'var(--t4)' }}>
              {datasets.length}
            </span>
          </div>
          <div className="search">
            <SearchIcon />
            <input
              autoFocus
              type="text"
              placeholder="Search datasets"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          {groups.length === 0 && <div className="menu-empty">No datasets match “{query}”.</div>}
          {groups.map(([source, items]) => (
            <div key={source}>
              <div className="grp">{SOURCE_LABEL[source] ?? source}</div>
              {items.map((d) => (
                <DatasetOption
                  key={d.id}
                  dataset={d}
                  selected={d.id === selectedId}
                  onPick={pick}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
