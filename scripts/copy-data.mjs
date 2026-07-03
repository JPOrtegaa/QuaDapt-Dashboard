// Copy the generated datasets.json artifact into public/data so Vite serves it.
import { mkdirSync, copyFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const src = resolve(root, 'datasets/datasets.json')
const dstDir = resolve(root, 'public/data')
const dst = resolve(dstDir, 'datasets.json')

mkdirSync(dstDir, { recursive: true })
copyFileSync(src, dst)
console.log(`copied ${src} -> ${dst}`)
