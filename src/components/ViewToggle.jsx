// Raw / Preprocessed segmented control. Preprocessed is disabled when the
// dataset has no (valid) preprocessed view.
export default function ViewToggle({ value, onChange, hasPreprocessed }) {
  return (
    <div className="seg">
      <button className={value === 'raw' ? 'on' : ''} onClick={() => onChange('raw')}>
        Raw
      </button>
      <button
        className={value === 'preprocessed' ? 'on' : ''}
        disabled={!hasPreprocessed}
        title={hasPreprocessed ? '' : 'No preprocessing defined for this dataset'}
        onClick={() => onChange('preprocessed')}
      >
        Preprocessed
      </button>
    </div>
  )
}
