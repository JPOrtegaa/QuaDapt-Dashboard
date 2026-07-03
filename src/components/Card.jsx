// Reusable card shell: icon + title (+ optional subtitle) + optional right slot,
// then the body. Most descriptor cards are compositions of <Card> and <Stat>.
export default function Card({ icon, title, subtitle, right, wide, style, children }) {
  return (
    <div className={`card${wide ? ' wide' : ''}`} style={style}>
      <div className="ch" style={right ? { justifyContent: 'space-between' } : undefined}>
        <div className="ch">
          <div className="ico">{icon}</div>
          <div>
            <span className="ct">{title}</span>
            {subtitle && <div className="csub">{subtitle}</div>}
          </div>
        </div>
        {right}
      </div>
      {children}
    </div>
  )
}
