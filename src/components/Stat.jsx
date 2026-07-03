// Reusable label-over-number. `size` controls the number scale:
// 'big' (hero number) or 'sm' (inline stat).
export default function Stat({ label, value, size = 'sm', valueColor, style }) {
  const numStyle =
    size === 'big'
      ? { className: 'big' }
      : { style: { fontSize: 16, fontWeight: 700, color: valueColor } }
  return (
    <div className="stat" style={style}>
      <div className="lbl" style={{ marginBottom: size === 'big' ? 5 : 4 }}>
        {label}
      </div>
      {size === 'big' ? (
        <div className="big" style={valueColor ? { color: valueColor } : undefined}>
          {value}
        </div>
      ) : (
        <div style={{ fontSize: 16, fontWeight: 700, color: valueColor }}>{value}</div>
      )}
    </div>
  )
}
