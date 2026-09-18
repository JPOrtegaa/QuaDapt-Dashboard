// Swatch + name for one curve. Dashed curves (unlabeled incoming multiclass
// scores) get a hollow dashed swatch so the legend reads like the chart.
export default function DensityLegendItem({ series }) {
  const style = series.dash
    ? { background: 'transparent', border: `2px dashed ${series.color}` }
    : { background: series.color }
  return (
    <span className="li">
      <span className="sw" style={style} />
      {series.name}
    </span>
  )
}
