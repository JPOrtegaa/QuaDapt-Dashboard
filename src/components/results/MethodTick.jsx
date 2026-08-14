// Y-axis tick for every method-ranking chart. In compare mode the bar color
// encodes the run, so this label is the ONLY thing marking our adapted (_syn)
// methods apart from the classic baselines — keep it identical everywhere.
export default function MethodTick({ x, y, payload, synSet, fontSize = 10.5 }) {
  const isSyn = synSet.has(payload.value)
  return (
    <text
      x={x}
      y={y}
      dy={4}
      textAnchor="end"
      fontFamily="'JetBrains Mono',monospace"
      fontSize={fontSize}
      fontWeight={isSyn ? 700 : 500}
      fill={isSyn ? '#eef1ec' : '#93998f'}
    >
      {payload.value}
    </text>
  )
}
