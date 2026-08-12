# QuaDapt Dashboard

A **standalone**, static dashboard to explore dataset characteristics and (later) QuaDapt
experiment results. QuaDapt is a concept-drift quantification framework built on the CDT/HDy
method (One-vs-Rest, n binary detectors). This repo is the **dashboard only**.

## Repo boundary (important)

- This is a **separate repo** from the QuaDapt experimental codebase. The experimental repo
  is **not** a dependency and must **not** be imported, vendored, or modified. Do not assume
  its files are present.
- This dashboard is **self-contained**. It consumes data **artifacts** (a `datasets.json`
  and, later, result CSVs) that are produced from the experiments and copied into this repo
  (e.g. under `public/data/`). It does not run experiments or import experiment code.
- Any Python needed to turn raw dataset files or experiment outputs into `datasets.json`
  lives **here**, in this repo (e.g. `scripts/`), reading its inputs by path. Nothing new
  gets added to the experimental repo.

## Architecture (decided — do not re-litigate without asking)

- **Data prep: Python.** A script in this repo computes the dataset descriptors with pandas
  and writes a static `datasets.json`. No computation happens in the browser.
- **UI layer: React, built with Vite**, exported as a **static bundle** (`npm run build` →
  `dist/`). No backend, no runtime Node server. Node is a build-time dependency only.
- **Data flow:**
  - Datasets tab ← a single `datasets.json` (committed under `public/data/`).
  - Results tab ← per-experiment JSON artifacts under `public/data/results/<experiment>/`,
    precomputed from the raw run CSVs by `scripts/generate_results.py`. Runs are declared
    in that script's `EXPERIMENTS` list and indexed by `public/data/results/experiments.json`;
    the tab's experiment switcher picks which run feeds it.
- **Update model:** regenerate/drop in a new artifact → rebuild. Static output hosts
  anywhere (e.g. GitHub Pages).

## Non-negotiable conventions

- **Component-wise, never repeated divs.** Every repeated block in the sketch
  (dropdown options, class-bar segments, class legend, feature-stat rows) MUST be a
  component rendered by mapping over data. If you're about to paste a near-identical `<div>`
  twice, make it a component instead.
- **Reuse two primitives everywhere:** a `<Card>` shell (icon + title + subtitle + body)
  and a `<Stat>` (label-over-big-number). Most cards are compositions of these.
- **The sketch in `docs/Dataset_Tab.reference.html` is the source of truth for visual
  design.** Port its CSS almost verbatim. Do not restyle or "improve" the aesthetic.
- **Datasets tab is a static reference catalog.** Generic descriptors only. Do NOT add
  concept-aware or OvR-specific views here (that was explicitly scoped out).
- No CSS framework unless asked. The sketch uses hand-written CSS + CSS variables; keep that.

## Descriptors shown on the Datasets tab

Size & shape (instances, features, rows:cols) · Feature composition (numeric / categorical /
binary / constant) · Data quality (missing, duplicates, malformed) · Redundancy (avg
pairwise |r|, count of highly-correlated pairs) · Class structure (n classes, per-class
count + %, normalized entropy, Gini, imbalance ratio) · Feature statistics (per feature:
min, max, mean, std, skew, range bar).

## Component tree (target)

```
App
├── TabNav                     # Datasets | Results (future)
└── DatasetTab
    ├── DatasetSelector        # pill + dropdown
    │   └── DatasetOption ×N   # mapped from dataset list
    └── CardGrid
        ├── Card               # reusable shell
        ├── Stat               # reusable label + big number
        ├── SizeShape
        ├── FeatureComposition
        ├── DataQuality
        ├── Redundancy
        ├── ClassStructure
        │   ├── ClassBar    → ClassSegment ×N     # mapped
        │   └── ClassLegend → ClassLegendItem ×N  # same class array
        └── FeatureStats
            └── FeatureRow ×N                      # mapped
```

## Getting started

See `docs/SPEC.md` for the full brief, the `datasets.json` shape, and the build plan.
Suggested first step: scaffold Vite + React, port the sketch's CSS, build `<Card>` and
`<Stat>`, then the `DatasetSelector`, then wire one dataset from a sample `datasets.json`.
