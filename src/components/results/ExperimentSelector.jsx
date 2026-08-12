import ExperimentOption from './ExperimentOption'

// Which experiment run feeds the Results tab. Segments come from
// data/results/experiments.json (see scripts/generate_results.py).
export default function ExperimentSelector({ experiments, selectedId, onSelect }) {
  if (experiments.length < 2) return null
  return (
    <div className="seg">
      {experiments.map((e) => (
        <ExperimentOption
          key={e.id}
          experiment={e}
          selected={e.id === selectedId}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}
