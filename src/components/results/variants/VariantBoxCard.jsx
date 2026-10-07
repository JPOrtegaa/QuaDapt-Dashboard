import { useState } from 'react'
import Card from '../../Card'
import { BoxPlotIcon } from '../../Icons'
import DetectorPills from '../scores/DetectorPills'
import DensityLegend from '../scores/DensityLegend'
import VariantBoxChart from './VariantBoxChart'
import { usePalette } from '../PaletteContext'
import { VARIANT_LABELS } from '../../../lib/resultsDerive'
import { fmtAE } from '../../../lib/resultsFormat'

const ALL = 'All classes'

// The readout under the chart: the hovered box's numbers, or a hint.
function readout(hovered, scopeStats) {
  const stats = hovered && scopeStats[hovered.method]
  if (!stats) return 'hover a box for its numbers · box = Q1–Q3 · solid line = median · dotted = mean · whiskers = 1.5 IQR'
  const [lo, q1, med, q3, hi, mean, nOut] = stats
  return `${hovered.method} · median ${fmtAE(med)} · mean ${fmtAE(mean)} · Q1–Q3 ${fmtAE(q1)}–${fmtAE(q3)} · whiskers ${fmtAE(lo)}–${fmtAE(hi)} · ${nOut} outliers`
}

// Absolute error by method and family: each base method's classic, drift-
// gated (QuaDapt_cdt / QuaDapt_ibdd) and synthetic (QuaDapt) variants side by
// side, over every test batch — for all classes (per-batch mean AE) or one
// one-vs-rest class. Precomputed box stats live in `dataset.variantBoxes`.
export default function VariantBoxCard({ boxes, classes, nBatches }) {
  const palette = usePalette()
  const [scope, setScope] = useState(ALL)
  const [hovered, setHovered] = useState(null)

  // Class labels are per dataset: a class picked elsewhere falls back to All.
  const activeScope = scope === ALL || classes.includes(scope) ? scope : ALL
  const scopeStats = boxes.scopes[activeScope === ALL ? 'all' : activeScope]
  const legend = boxes.variants.map((v) => ({ key: v, name: VARIANT_LABELS[v], color: palette[v] }))

  return (
    <Card
      wide
      icon={<BoxPlotIcon />}
      title="Absolute error by method and family"
      subtitle={`per-batch AE over ${nBatches.toLocaleString('en-US')} test batches · ${
        activeScope === ALL ? 'mean over classes' : `class ${activeScope}`
      } · gated variants use _syn on drift, the base method otherwise`}
      style={{ padding: '22px 24px' }}
    >
      <div className="box-head">
        <DetectorPills options={[ALL, ...classes]} selected={activeScope} onSelect={setScope} />
        <DensityLegend series={legend} />
      </div>
      <VariantBoxChart
        boxes={boxes}
        scopeStats={scopeStats}
        palette={palette}
        hovered={hovered}
        onHover={setHovered}
      />
      <div className="dist-caption">
        <span>{readout(hovered, scopeStats)}</span>
      </div>
    </Card>
  )
}
