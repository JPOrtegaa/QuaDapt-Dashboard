import { usePalette } from './PaletteContext'
import { methodLabelColor, isAdaptedVariant } from '../../lib/resultsDerive'

// Y-axis tick for every method-ranking chart. In compare mode the bar color
// encodes the run, so this label is the ONLY thing marking our adapted
// methods (_syn, the detector-gated _cdt / _ibdd) and the _topline oracles
// apart from the classic baselines — keep it identical everywhere. The
// category comes from the method name, colored by the active run's palette.
export default function MethodTick({ x, y, payload, fontSize = 10.5 }) {
  const palette = usePalette()
  const m = { name: payload.value }
  return (
    <text
      x={x}
      y={y}
      dy={4}
      textAnchor="end"
      fontFamily="'JetBrains Mono',monospace"
      fontSize={fontSize}
      fontWeight={isAdaptedVariant(m) ? 700 : 500}
      fill={methodLabelColor(m, palette)}
    >
      {payload.value}
    </text>
  )
}
