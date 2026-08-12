// Copy the generated Results-tab artifacts into public/data/results so Vite
// serves them. The tree is results/generated/{experiments.json, <experiment>/*.json}
// — one subfolder per experiment run (see scripts/generate_results.py).
import { mkdirSync, copyFileSync, readdirSync, rmSync, statSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const srcDir = resolve(root, 'results/generated')
const dstDir = resolve(root, 'public/data/results')

// Copy every .json under `from`, recursing into the per-experiment folders.
function copyJson(from, to) {
  mkdirSync(to, { recursive: true })
  let n = 0
  for (const entry of readdirSync(from)) {
    const src = resolve(from, entry)
    if (statSync(src).isDirectory()) n += copyJson(src, resolve(to, entry))
    else if (entry.endsWith('.json')) {
      copyFileSync(src, resolve(to, entry))
      n++
    }
  }
  return n
}

rmSync(dstDir, { recursive: true, force: true })
const count = copyJson(srcDir, dstDir)
console.log(`copied ${count} files ${srcDir} -> ${dstDir}`)
