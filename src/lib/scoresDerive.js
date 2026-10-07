import { MINT, AMBER, classColor } from './resultsDerive'

// Colors for the score-distribution curves: what QuaDapt treats as "positive"
// (and the synthetic positives it selects) is mint, "negative" is amber, the
// unlabeled incoming batch is grey. Multiclass views reuse the class ramp.
export const POSITIVE = MINT
export const NEGATIVE = AMBER
export const INCOMING = '#93998f'

export const MULTICLASS = 'multiclass'

// Model options for the detector pills: the multiclass model first, then one
// entry per one-vs-rest detector, in the artifact's (natural) class order.
export function detectorOptions(training) {
  return [MULTICLASS, ...training.labels]
}

function unpack(curve, scale) {
  return curve.map((v) => v / scale)
}

function series(key, name, curve, scale, style) {
  return { key, name, curve: unpack(curve, scale), ...style }
}

const SOLID = { width: 2.5, fillOpacity: 0.14, dash: null }
const THIN = { width: 2, fillOpacity: 0.08, dash: null }
const DASHED = { width: 1.8, fillOpacity: 0, dash: '5 4' }

// One view-state = the curves to draw, the three stats under the pills, the
// note explaining them and the caption under the chart. `batch` is null in
// the training view (and while a batch is still loading).
export function scoreState({ training, view, model, batch }) {
  const scale = training.scale
  const isTest = view === 'test'
  const isMulti = model === MULTICLASS
  const yMax = training.yMax[isTest ? 'test' : 'training'][model] ?? null

  if (!isTest && isMulti) {
    const t = training.multiclass
    return {
      yMax,
      series: t.curves.map((c, i) =>
        series(`c${i}`, `class ${training.labels[i]}`, c, scale, { color: classColor(i), ...THIN }),
      ),
      stats: [
        { label: 'Samples', value: t.n.toLocaleString('en-US') },
        { label: 'Classes', value: training.labels.length },
        { label: 'Model', value: 'multiclass', color: 'var(--t2)' },
      ],
      note: 'Validation scores of the multiclass model, one curve per class column — the reference shape every detector is trained against.',
      caption: `multiclass model · ${training.labels.length} classes · ${t.n.toLocaleString('en-US')} validation samples`,
    }
  }

  if (!isTest) {
    const t = training.ovr[model]
    return {
      yMax,
      series: [
        series('pos', `positive (${model})`, t.pos, scale, { color: POSITIVE, ...SOLID }),
        series('neg', 'negative (rest)', t.neg, scale, { color: NEGATIVE, ...SOLID }),
      ],
      stats: [
        { label: 'Positives', value: t.nPos.toLocaleString('en-US'), color: POSITIVE },
        { label: 'Negatives', value: t.nNeg.toLocaleString('en-US'), color: NEGATIVE },
        { label: 'Pos. share', value: `${((100 * t.nPos) / (t.nPos + t.nNeg)).toFixed(1)}%` },
      ],
      note: `Validation scores of the ${model}-vs-rest detector on the reference distribution — the two shapes DySyn mixes when it synthesizes a batch.`,
      caption: `${model}-vs-rest detector · positive = ${t.nPos.toLocaleString('en-US')} · negative = ${t.nNeg.toLocaleString('en-US')}`,
    }
  }

  // Test view: nothing to draw until the batch artifact lands.
  if (!batch) {
    return { yMax, series: [], stats: [], note: '', caption: 'loading batch…' }
  }

  if (isMulti) {
    const b = batch.multiclass
    return {
      yMax,
      series: b.curves.map((c, i) =>
        series(`c${i}`, `class ${training.labels[i]} · incoming`, c, batch.scale, { color: classColor(i), ...DASHED }),
      ),
      stats: [
        { label: 'Incoming', value: b.n.toLocaleString('en-US') },
        { label: 'Selected +', value: '—', color: 'var(--t4)' },
        { label: 'Selected −', value: '—', color: 'var(--t4)' },
      ],
      note: 'Unlabeled batch scored by the multiclass model, one dashed curve per class column. No synthetic selection exists at this level — pick a detector.',
      caption: `batch ${batch.id} · multiclass model · ${b.n.toLocaleString('en-US')} incoming samples`,
    }
  }

  const o = batch.ovr[model]

  // Newer runs store the true label of every incoming score: draw the batch's
  // real positives / negatives filled, QuaDapt's synthetic picks dashed.
  if (o.incPos) {
    return {
      yMax,
      series: [
        series('incPos', `incoming positive (${model})`, o.incPos, batch.scale, { color: POSITIVE, ...SOLID }),
        series('incNeg', 'incoming negative (rest)', o.incNeg, batch.scale, { color: NEGATIVE, ...SOLID }),
        series('selP', 'selected positive (synthetic)', o.selP, batch.scale, { color: POSITIVE, ...DASHED }),
        series('selN', 'selected negative (synthetic)', o.selN, batch.scale, { color: NEGATIVE, ...DASHED }),
      ],
      stats: [
        { label: 'Incoming +/−', value: `${o.nPos}/${o.nNeg}` },
        { label: 'Selected +', value: o.nSelP.toLocaleString('en-US'), color: POSITIVE },
        { label: 'Selected −', value: o.nSelN.toLocaleString('en-US'), color: NEGATIVE },
      ],
      note: `Filled = the batch as scored by the ${model}-vs-rest detector, split by its true labels. Dashed = the synthetic positive / negative scores QuaDapt selected to explain it. Each curve is normalized on its own — compare shapes, not heights.`,
      caption: `batch ${batch.id} · ${model}-vs-rest · incoming = ${o.nPos} positive + ${o.nNeg} negative · selected synthetic = ${o.nSelP.toLocaleString('en-US')} + ${o.nSelN.toLocaleString('en-US')}`,
    }
  }

  return {
    yMax,
    series: [
      series('inc', 'incoming batch', o.inc, batch.scale, { color: INCOMING, width: 2, fillOpacity: 0.12, dash: null }),
      series('selP', 'selected positive (synthetic)', o.selP, batch.scale, { color: POSITIVE, ...SOLID }),
      series('selN', 'selected negative (synthetic)', o.selN, batch.scale, { color: NEGATIVE, ...SOLID }),
    ],
    stats: [
      { label: 'Incoming', value: o.n.toLocaleString('en-US') },
      { label: 'Selected +', value: o.nSelP.toLocaleString('en-US'), color: POSITIVE },
      { label: 'Selected −', value: o.nSelN.toLocaleString('en-US'), color: NEGATIVE },
    ],
    note: `Grey = the unlabeled batch as scored by the ${model}-vs-rest detector. Mint / amber = the synthetic positive and negative scores QuaDapt selected to explain it.`,
    caption: `batch ${batch.id} · ${model}-vs-rest · incoming = ${o.n.toLocaleString('en-US')} · selected synthetic = ${o.nSelP.toLocaleString('en-US')} + ${o.nSelN.toLocaleString('en-US')}`,
  }
}

// Recharts wants one row per x with a column per series.
export function chartRows(x, seriesList) {
  return x.map((xv, i) => {
    const row = { x: xv }
    for (const s of seriesList) row[s.key] = s.curve[i]
    return row
  })
}
