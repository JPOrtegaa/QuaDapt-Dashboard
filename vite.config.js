import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Static dashboard: relative base so the built `dist/` hosts anywhere
// (e.g. GitHub Pages) with no server.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    // datasets/ and results/ hold the raw, gitignored source data (hundreds
    // of thousands of small per-batch CSVs under results/ovr_results2/) —
    // never used at runtime, only read by the scripts/generate_*.py step.
    // Without this, chokidar tries to watch all of it and the dev server
    // never becomes responsive.
    watch: { ignored: ['**/datasets/**', '**/results/**'] },
  },
})
