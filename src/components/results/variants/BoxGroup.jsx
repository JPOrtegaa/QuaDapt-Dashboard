import BoxGlyph from './BoxGlyph'

// One base method's band: a box per variant it has (classic / cdt / ibdd /
// syn), in the shared variant order so the same family always sits in the
// same slot, plus the base name under the axis.
export default function BoxGroup({ base, members, variants, scopeStats, x0, bandWidth, plotBottom, y, palette, hovered, onHover }) {
  const slot = (bandWidth * 0.82) / variants.length
  const boxWidth = Math.max(3, Math.min(18, slot * 0.72))
  const start = x0 + bandWidth * 0.09
  return (
    <g>
      {variants.map((v, i) => {
        const method = members[v]
        const stats = method && scopeStats[method]
        if (!stats) return null
        return (
          <BoxGlyph
            key={v}
            cx={start + slot * (i + 0.5)}
            width={boxWidth}
            stats={stats}
            color={palette[v]}
            y={y}
            dimmed={hovered != null && hovered !== method}
            onHover={() => onHover(method, v)}
          />
        )
      })}
      <text
        x={x0 + bandWidth / 2}
        y={plotBottom + 16}
        textAnchor="middle"
        fontFamily="'JetBrains Mono',monospace"
        fontSize={10.5}
        fill="#c8ccc6"
      >
        {base}
      </text>
    </g>
  )
}
