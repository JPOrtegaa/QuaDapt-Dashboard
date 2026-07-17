// Copy the generated Results-tab artifacts into public/data/results so Vite serves them.
import { mkdirSync, copyFileSync, readdirSync, rmSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const srcDir = resolve(root, 'results/generated')
const dstDir = resolve(root, 'public/data/results')

rmSync(dstDir, { recursive: true, force: true })
mkdirSync(dstDir, { recursive: true })

const files = readdirSync(srcDir).filter((f) => f.endsWith('.json'))
for (const f of files) {
  copyFileSync(resolve(srcDir, f), resolve(dstDir, f))
}
console.log(`copied ${files.length} files ${srcDir} -> ${dstDir}`)
