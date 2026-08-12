// One segment of the experiment switcher.
export default function ExperimentOption({ experiment, selected, onSelect }) {
  return (
    <button
      className={selected ? 'on' : ''}
      title={`${experiment.desc} · ${experiment.nDatasets} datasets`}
      onClick={() => onSelect(experiment.id)}
    >
      {experiment.name}
    </button>
  )
}
