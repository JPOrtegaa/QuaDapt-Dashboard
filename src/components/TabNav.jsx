// Datasets | Results
export default function TabNav({ active, onChange }) {
  return (
    <div className="tabnav">
      <button className={`tab${active === 'datasets' ? ' active' : ''}`} onClick={() => onChange('datasets')}>
        Datasets
      </button>
      <button className={`tab${active === 'results' ? ' active' : ''}`} onClick={() => onChange('results')}>
        Results
      </button>
    </div>
  )
}
