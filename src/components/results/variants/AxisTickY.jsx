// One horizontal grid line + its AE label on the box plot's y axis.
export default function AxisTickY({ value, y, left, right }) {
  return (
    <g>
      <line x1={left} x2={right} y1={y} y2={y} stroke="rgba(255,255,255,.06)" />
      <text x={left - 6} y={y} dy={3.5} textAnchor="end" fontSize={10} fill="#5f665e">
        {value.toFixed(2)}
      </text>
    </g>
  )
}
