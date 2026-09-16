import { SAGE } from '../../lib/resultsDerive'

// Y-axis tick for every method-ranking chart. In compare mode the bar color
// encodes the run, so this label is the ONLY thing marking our adapted (_syn)
// methods and the _topline oracles apart from the classic baselines — keep it
// identical everywhere.
export default function MethodTick({ x, y, payload, synSet, toplineSet = new Set(), fontSize = 10.5 }) {
  const isSyn = synSet.has(payload.value)
  const isTopline = toplineSet.has(payload.value)
  return (
    <text
      x={x}
      y={y}
      dy={4}
      textAnchor="end"
      fontFamily="'JetBrains Mono',monospace"
      fontSize={fontSize}
      fontWeight={isSyn || isTopline ? 700 : 500}
      fill={isTopline ? SAGE : isSyn ? '#eef1ec' : '#93998f'}
    >
      {payload.value}
    </text>
  )
}
