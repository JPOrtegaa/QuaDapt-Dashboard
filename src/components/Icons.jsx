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

// Two box-and-whisker glyphs — the method x family box plot.
export const BoxPlotIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#74e0a3" strokeWidth="1.4" strokeLinecap="round">
    <path d="M3.5 1v2.5M3.5 9.5V13M10.5 3v3M10.5 10.5V13" />
    <rect x="1.5" y="3.5" width="4" height="6" rx="1" />
    <rect x="8.5" y="6" width="4" height="4.5" rx="1" />
  </svg>
)

// A threshold line crossed by a signal — the drift-detector card.
export const GateIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#74e0a3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 5h12" strokeDasharray="2 2" opacity="0.6" />
    <path d="M1 12 4 9l2.5 2L9 3l2 4 2-1" />
  </svg>
)

// Two overlapping density curves — the score-distributions card.
export const CurvesIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#74e0a3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12 C3.5 12 4 3 6 3 C8 3 8.5 12 11 12" />
    <path d="M3 12 C5.5 12 6 6 8 6 C10 6 10.5 12 13 12" opacity="0.55" />
  </svg>
)
