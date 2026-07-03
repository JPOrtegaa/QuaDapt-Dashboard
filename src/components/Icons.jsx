// SVG glyphs lifted from Dataset_Tab.reference.html so cards match the sketch.

export const GridIcon = ({ fill = '#74e0a3', size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill={fill}>
    <rect x="0" y="0" width="6" height="6" rx="1.5" />
    <rect x="8" y="0" width="6" height="6" rx="1.5" />
    <rect x="0" y="8" width="6" height="6" rx="1.5" />
    <rect x="8" y="8" width="6" height="6" rx="1.5" />
  </svg>
)

export const BarsIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="#74e0a3">
    <rect x="0" y="1" width="14" height="3" rx="1.5" />
    <rect x="0" y="6" width="9" height="3" rx="1.5" />
    <rect x="0" y="11" width="5" height="3" rx="1.5" />
  </svg>
)

export const DiamondIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#74e0a3" strokeWidth="1.6">
    <path d="M7 1.5 12.5 7 7 12.5 1.5 7Z" />
  </svg>
)

export const VennIcon = () => (
  <svg width="16" height="14" viewBox="0 0 16 14" fill="none" stroke="#74e0a3" strokeWidth="1.5">
    <circle cx="6" cy="7" r="4.5" />
    <circle cx="10" cy="7" r="4.5" />
  </svg>
)

export const RadialIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#74e0a3" strokeWidth="1.5">
    <circle cx="7" cy="7" r="5.7" />
    <path d="M7 7 7 1.3M7 7 12 9.5" />
  </svg>
)

export const HistIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="#74e0a3">
    <rect x="0" y="6" width="3" height="8" rx="1" />
    <rect x="5.5" y="2" width="3" height="12" rx="1" />
    <rect x="11" y="9" width="3" height="5" rx="1" />
  </svg>
)

export const SearchIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="#5f665e" strokeWidth="1.5">
    <circle cx="5.5" cy="5.5" r="4" />
    <path d="M9 9 12 12" />
  </svg>
)
