# QuaDapt-Dashboard

Static dashboard for QuaDapt dataset descriptions and (later) result analysis.
Vite + React, exported as a static bundle — no backend.

## Run

```bash
npm install        # once
npm run dev        # dev server (http://localhost:5173)
npm run build      # static bundle -> dist/
npm run preview    # serve the built dist/
```

## Data

The Datasets tab reads `public/data/datasets.json`, generated from the raw CSVs
under `datasets/` by a Python + pandas script. Each dataset carries a **raw** and
a **preprocessed** view (the latter produced by the real `preprocess_*` functions),
grouped by source (`kaggle, uci, quapy, openml, ours, schumacher`).

Regenerate and copy the artifact into `public/data/`:

```bash
pip install pandas numpy scikit-learn scipy
npm run data       # python scripts/generate_datasets.py + copy into public/data
```

The Results tab reads one artifact set **per experiment run**, under
`public/data/results/`:

```
public/data/results/
├── experiments.json          # the run index — order = switcher order, first = default
├── ovr_corrected/            # "OvR corrected"  <- results/ovr_results_corrected/
│   ├── manifest.json         #   one entry per dataset (KPIs for the selector)
│   ├── general.json          #   cross-dataset overview
│   └── <dataset>.json        #   per-dataset methods / families / calibration
└── ovr_v2/                   # "OvR v2"         <- results/ovr_results2/
    └── …
```

A run is declared in the `EXPERIMENTS` list at the top of
`scripts/generate_results.py` (id, display name, raw folder under `results/`, and
whether that folder is `grouped` by source or `flat`; flat runs get their source
from `DATASET_SOURCE`). Drop the raw run folder into `results/`, add its entry,
then:

```bash
npm run data:results               # regenerate every run present + copy into public/data
python scripts/generate_results.py ovr_corrected   # or just one run
```

The Results tab's experiment switcher (top right) then lets you flip which run
feeds the whole tab.

See `CLAUDE.md` and `SPEC.md` for the architecture and the `datasets.json` contract.
