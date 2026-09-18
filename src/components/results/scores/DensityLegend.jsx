import DensityLegendItem from './DensityLegendItem'

const LEGEND_CAP = 14

export default function DensityLegend({ series }) {
  const shown = series.slice(0, LEGEND_CAP)
  const hidden = series.length - shown.length
  return (
    <div className="dist-legend">
      {shown.map((s) => (
        <DensityLegendItem key={s.key} series={s} />
      ))}
      {hidden > 0 && <span className="li">+{hidden} more</span>}
    </div>
  )
}
