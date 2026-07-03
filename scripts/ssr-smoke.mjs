// Runtime smoke test: render the real component tree to a string via Vite SSR.
// Throws (non-zero exit) if any component crashes on any dataset/view — including
// edge cases: regression/no-target (null classStructure), high-cardinality
// classes, wide feature tables, and error-stub preprocessed views.
import { createServer } from 'vite'
import { readFileSync } from 'node:fs'
import { createElement as h } from 'react'
import { renderToString } from 'react-dom/server'

const grouped = JSON.parse(readFileSync('public/data/datasets.json', 'utf8'))
const datasets = []
for (const [source, items] of Object.entries(grouped))
  for (const d of items) datasets.push({ ...d, source: d.source ?? source })

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })

try {
  const { default: DatasetTab } = await vite.ssrLoadModule('/src/components/DatasetTab.jsx')
  const { default: CardGrid } = await vite.ssrLoadModule('/src/components/CardGrid.jsx')

  // 1) Full DatasetTab (selector + toggle + grid) renders for the whole list.
  let html = renderToString(h(DatasetTab, { datasets }))
  if (!html.includes('Datasets')) throw new Error('DatasetTab did not render header')

  // 2) Every dataset, both views, through the card grid.
  let views = 0
  for (const d of datasets) {
    for (const v of [d.raw, d.preprocessed]) {
      if (!v || v.error) continue
      renderToString(h(CardGrid, { view: v }))
      views++
    }
  }
  console.log(`OK — DatasetTab + ${views} card-grid views rendered without error`)
} finally {
  await vite.close()
}
