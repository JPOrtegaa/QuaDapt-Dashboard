// Datasets | Results (Results is a future tab, disabled for now).
export default function TabNav({ active, onChange }) {
  return (
    <div className="tabnav">
      <button className={`tab${active === 'datasets' ? ' active' : ''}`} onClick={() => onChange('datasets')}>
        Datasets
      </button>
      <button className="tab" disabled title="QuaDapt experiment results — coming later">
        Results<span className="soon">SOON</span>
      </button>
    </div>
  )
}
