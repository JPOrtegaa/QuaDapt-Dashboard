// One box-and-whisker: Tukey whiskers, Q1–Q3 box, median line, mean tick
// and the (subsampled) outliers as dots. `y` maps an AE value to pixels.
export default function BoxGlyph({ cx, width, stats, color, y, dimmed, onHover }) {
  const [lo, q1, med, q3, hi, mean, , outliers] = stats
  const half = width / 2
  const cap = width * 0.3
  return (
    <g
      opacity={dimmed ? 0.35 : 1}
      onMouseEnter={onHover}
      style={{ cursor: 'default' }}
    >
      {/* fat invisible hit area so thin boxes are easy to hover */}
      <rect x={cx - half} y={y(hi)} width={width} height={Math.max(4, y(lo) - y(hi))} fill="transparent" />
      <line x1={cx} x2={cx} y1={y(hi)} y2={y(q3)} stroke={color} strokeWidth={1.3} />
      <line x1={cx} x2={cx} y1={y(q1)} y2={y(lo)} stroke={color} strokeWidth={1.3} />
      <line x1={cx - cap} x2={cx + cap} y1={y(hi)} y2={y(hi)} stroke={color} strokeWidth={1.3} />
      <line x1={cx - cap} x2={cx + cap} y1={y(lo)} y2={y(lo)} stroke={color} strokeWidth={1.3} />
      <rect
        x={cx - half}
        y={y(q3)}
        width={width}
        height={Math.max(1, y(q1) - y(q3))}
        rx={1.5}
        fill={color}
        fillOpacity={0.28}
        stroke={color}
        strokeWidth={1.4}
      />
      <line x1={cx - half} x2={cx + half} y1={y(med)} y2={y(med)} stroke={color} strokeWidth={2} />
      <line x1={cx - half} x2={cx + half} y1={y(mean)} y2={y(mean)} stroke="#eef1ec" strokeWidth={1} strokeDasharray="2 2" opacity={0.7} />
      {outliers.map((v, i) => (
        <circle key={i} cx={cx} cy={y(v)} r={1.9} fill={color} fillOpacity={0.85} />
      ))}
    </g>
  )
}
