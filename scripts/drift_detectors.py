"""
Drift-detector artifacts for runs that gate QuaDapt with CDT / IBDD.

Such runs dump, next to each dataset's *_results.csv:

  distances.csv        CDT: one row per one-vs-rest model with the reference
                       DyS distances it was calibrated on and its two-sided
                       thresholds (thr_lower / thr_upper)
  distances_ibdd.csv   IBDD: one row (model_id "all") with the reference MSDs
                       and thresholds — a single detector shared by every class
  detector_trace.csv   one row per (batch, detector, model): the statistic the
                       detector computed on that test batch and its drift flag

A `<base>_<detector>` quantifier uses the synthetic estimate (`<base>_syn`,
DySyn for DyS) on a batch flagged as drift and the base estimate — the
training scores — otherwise, so the flags are what the gated methods read.

This module turns them into one `detectors` block for the dataset JSON:
per detector and model the thresholds, the drift rate, the per-batch flags
as a "0101…" string (index k = batch_index k = test_scores batch_<k>), and
histograms of the reference distances and the test statistics over shared
bins. CDT distances span ~1e-18 .. 1e-1, so its bins are on log10 (values
<= 0 are clipped to LOG_FLOOR); IBDD's are linear.
"""

from __future__ import annotations

import json
import math
import os

import numpy as np
import pandas as pd

N_BINS = 30
LOG_FLOOR = 1e-18
LOG_DETECTORS = {"cdt"}

DISTANCE_FILES = {"cdt": "distances.csv", "ibdd": "distances_ibdd.csv"}


def _num(x, ndigits=None):
    try:
        xf = float(x)
    except (TypeError, ValueError):
        return None
    if not math.isfinite(xf):
        return None
    return float(f"{xf:.6g}") if ndigits is None else round(xf, ndigits)


def _histograms(ref: np.ndarray, test: np.ndarray, log: bool) -> dict:
    """Both samples binned on the same N_BINS edges spanning their union."""
    if log:
        ref = np.log10(np.clip(ref, LOG_FLOOR, None))
        test = np.log10(np.clip(test, LOG_FLOOR, None))
    both = np.concatenate([ref, test])
    lo, hi = float(both.min()), float(both.max())
    if hi <= lo:
        hi = lo + 1.0
    edges = np.linspace(lo, hi, N_BINS + 1)
    return {
        "log": log,
        "lo": _num(lo),
        "hi": _num(hi),
        "nBins": N_BINS,
        "refHist": [int(v) for v in np.histogram(ref, bins=edges)[0]],
        "testHist": [int(v) for v in np.histogram(test, bins=edges)[0]],
    }


def _as_bool(series: pd.Series) -> np.ndarray:
    return series.astype(str).str.lower().isin(["true", "1"]).to_numpy()


def build_detectors(dataset_dir: str, detectors: list[str], classes: list[str]) -> dict | None:
    """The `detectors` block for one dataset, or None when it has no trace."""
    trace_path = os.path.join(dataset_dir, "detector_trace.csv")
    if not os.path.isfile(trace_path):
        return None
    trace = pd.read_csv(trace_path, dtype={"model_id": str})

    out = {"names": [], "models": {}}
    for name in detectors:
        dist_path = os.path.join(dataset_dir, DISTANCE_FILES.get(name, f"distances_{name}.csv"))
        rows = trace[trace["detector"] == name]
        if rows.empty or not os.path.isfile(dist_path):
            continue
        dist = pd.read_csv(dist_path, dtype={"model_id": str}).set_index("model_id")

        # CDT is per class (keep the dataset's class order), IBDD is one "all" model.
        model_ids = [c for c in classes if c in dist.index] if name == "cdt" else list(dist.index)
        models = {}
        for model_id in model_ids:
            m_rows = rows[rows["model_id"] == model_id].sort_values("batch_index")
            if m_rows.empty:
                continue
            ref = np.asarray(json.loads(dist.loc[model_id, "distances"]), dtype=float)
            stat = m_rows["statistic"].to_numpy(dtype=float)
            flags = _as_bool(m_rows["drift"])
            models[model_id] = {
                "thrLower": _num(dist.loc[model_id, "thr_lower"]),
                "thrUpper": _num(dist.loc[model_id, "thr_upper"]),
                "nRef": int(ref.size),
                "nBatches": int(flags.size),
                "driftRate": _num(flags.mean(), 4),
                "flags": "".join("1" if f else "0" for f in flags),
                **_histograms(ref, stat, name in LOG_DETECTORS),
            }
        if models:
            out["names"].append(name)
            out["models"][name] = models

    return out if out["names"] else None
