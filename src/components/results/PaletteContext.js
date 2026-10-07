import { createContext, useContext } from 'react'
import { VARIANT_PALETTES } from '../../lib/resultsDerive'

// The active run's method-category palette (see VARIANT_PALETTES). Provided
// once by ResultsTab so every chart colors classic / cdt / ibdd / syn /
// topline the same way without threading a prop through each card.
const PaletteContext = createContext(VARIANT_PALETTES.default)

export const PaletteProvider = PaletteContext.Provider

export function usePalette() {
  return useContext(PaletteContext)
}
