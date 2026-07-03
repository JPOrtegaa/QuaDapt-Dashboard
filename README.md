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

See `CLAUDE.md` and `SPEC.md` for the architecture and the `datasets.json` contract.
