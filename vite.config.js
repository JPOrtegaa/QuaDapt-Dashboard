import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const root = dirname(fileURLToPath(import.meta.url))
// Repo-root raw data folders, as forward-slash absolute paths so the check
// matches whatever chokidar hands us on Windows.
const RAW_DATA_DIRS = ['datasets', 'results'].map((d) => resolve(root, d).replace(/\\/g, '/') + '/')

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
    // never becomes responsive. Matched by absolute path on purpose: a glob
    // like `**/results/**` also swallows public/data/results/, and Vite then
    // never learns about artifacts copied in after startup (it serves
    // index.html for them instead).
    watch: {
      ignored: (p) => {
        const n = p.replace(/\\/g, '/')
        return RAW_DATA_DIRS.some((d) => n.startsWith(d))
      },
    },
  },
})
