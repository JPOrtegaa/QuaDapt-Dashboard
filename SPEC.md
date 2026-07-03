# QuaDapt Dashboard — Build Spec

Companion to the root `CLAUDE.md`. This file holds the details that are reference material
rather than always-on rules: the data contract, and a suggested build order.

## 1. Purpose & scope

- A static dashboard, standalone repo. First deliverable: the **Datasets** tab — a static
  reference catalog of generic dataset descriptors. **Results** tab (QuaDapt experiment
  results from CSVs) comes later and reuses the same primitives.
- Explicitly out of scope for the Datasets tab: concept-aware views, OvR/per-detector views,
  anything requiring a trained classifier (score histograms, separability, θ threshold).
  Those are experiment outputs, not dataset properties.

## 2. Stack

- Vite + React (static export). Node used only at build time.
- Hand-written CSS + CSS variables, ported from `docs/Dataset_Tab.reference.html`.
- `papaparse` later, for client-side CSV parsing on the Results tab.
- Python + pandas (in `scripts/`) to generate `datasets.json`.

## 3. Data contract — `datasets.json`

Shape the JSON to match component props so rendering is a direct map. Suggested structure
(one entry per dataset; numbers below are illustrative):

```json
{
  "datasets": [
    {
      "id": "shuttle",
      "name": "Shuttle (Statlog)",
      "source": "UCI",
      "ingestedBytes": 4404019,

      "sizeShape": { "instances": 58000, "features": 9, "rowsPerCol": 6444 },

      "featureComposition": { "numeric": 9, "categorical": 0, "binary": 0, "constant": 0 },

      "dataQuality": {
        "missingCells": 0, "missingPct": 0.0,
        "duplicates": 137, "duplicatePct": 0.24,
        "malformed": 0
      },

      "redundancy": { "avgAbsCorr": 0.18, "highlyCorrelatedPairs": 3, "threshold": 0.9 },

      "classStructure": {
        "nClasses": 7,
        "entropyNorm": 0.34,
        "gini": 0.36,
        "imbalanceRatio": "7598:1",
        "classes": [
          { "name": "Rad Flow",  "count": 45586, "pct": 78.6 },
          { "name": "High",      "count": 8903,  "pct": 15.4 },
          { "name": "Bypass",    "count": 3267,  "pct": 5.6  },
          { "name": "Fpv Close", "count": 132,   "pct": 0.23 },
          { "name": "Fpv Open",  "count": 50,    "pct": 0.09 },
          { "name": "Flux In",   "count": 11,    "pct": 0.02 },
          { "name": "Bpv Open",  "count": 6,     "pct": 0.01 }
        ]
      },

      "featureStats": {
        "normalizationRecommended": true,
        "features": [
          { "name": "f1", "min": 27, "max": 126, "mean": 79.9, "std": 32.1, "skew": -0.1 }
        ]
      }
    }
  ]
}
```

Notes:
- Colors for class segments/legend and the feature range-bar widths are **derived in the UI**
  from the data (rank/scale), not stored in JSON — keeps the artifact clean.
- `ClassBar` and `ClassLegend` both render `classStructure.classes` — define it once.
- Keep the Python generator's output keys in lockstep with component props. If a prop is
  added, add the key; don't let the UI invent values.

## 4. Suggested build order

1. Scaffold Vite + React. Drop the sketch's CSS into a global stylesheet; confirm the theme
   variables render.
2. Build primitives: `<Card>` (icon + title + subtitle + body slot) and `<Stat>`
   (label + big number). Verify against the sketch visually.
3. Build `DatasetSelector` (pill + dropdown) with `DatasetOption` mapped from the dataset
   list. Wire selection state up in `App`/`DatasetTab`.
4. Build the simple cards as `<Card>`+`<Stat>` compositions: `SizeShape`,
   `FeatureComposition`, `DataQuality`, `Redundancy`.
5. Build `ClassStructure` (`ClassBar` → `ClassSegment`, `ClassLegend` → `ClassLegendItem`,
   both mapping the same `classes` array) and `FeatureStats` (`FeatureRow` mapped).
6. Load a sample `datasets.json` (hand-write one dataset first) and render end-to-end.
7. Write the Python generator in `scripts/` to emit `datasets.json` from real data; commit
   the output under `public/data/`.
8. `npm run build`; confirm the static `dist/` renders with no server.

## 5. Later — Results tab

- Same `<Card>`/`<Stat>`/table primitives; mostly new charts.
- Drop QuaDapt result CSVs into `public/data/`; parse client-side with `papaparse`, or have
  the Python step convert them to JSON alongside `datasets.json`. Decide when you get there.
