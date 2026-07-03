import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Static dashboard: relative base so the built `dist/` hosts anywhere
// (e.g. GitHub Pages) with no server.
export default defineConfig({
  base: './',
  plugins: [react()],
})
