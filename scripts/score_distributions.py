"""
Score-distribution artifacts for the Results tab's "Score distributions" card.

Some runs dump, next to each dataset's *_results.csv, the raw classifier scores
the drift detectors work on:

  <dataset>/multiclass/training_distributions.csv   training_scores: n x k matrix
  <dataset>/<class>/training_distributions.csv      pos_scores / neg_scores of the
                                                    <class>-vs-rest detector
  <dataset>/test_scores/batch_<id>_multiclass.csv   incoming_test_scores: n x k
  <dataset>/test_scores/batch_<id>_<class>.csv      incoming_test_scores (1-D) plus
                                                    selected_p_scores / selected_n_scores,
                                                    the synthetic scores QuaDapt picked, and
                                                    (newer runs) incoming_test_labels, the
                                                    true 0/1 label of every incoming score

Runs with reshaped QuaDapt variants (<base>_gamma) also write
<dataset>/reshape_trace.csv: per batch and detector, the gamma the search
picked. Its picked reference is not dumped, but it is deterministic — the
detector's own training scores under reshape_scores(pos, neg, gamma, gamma)
(methods/quantifiers_utils.py in the experiment repo) — so it is rebuilt here
and shipped next to the synthetic pick as `reshaped.<variant>`.

This module turns them into kernel-density curves on a fixed grid over [0, 1]
(Silverman bandwidth, reflected at both edges — the same estimator as the
experiment repo's distribution_analysis notebook) so the browser only draws:

  scores/<id>/training.json     every model's training curves + shared y-scales
  scores/<id>/batch_<k>.json    one test batch, every model — fetched on scrub

Only the first SCORE_BATCH_LIMIT batches ship; the manifest records how many
exist. Curves are stored as integers scaled by SCORE_SCALE to keep the files
small (a 50-class dataset has 200 curves per batch).
"""

from __future__ import annotations

import csv
import glob
import json
import os
import re

import numpy as np

csv.field_size_limit(10**8)

SCORE_BATCH_LIMIT = 25
SCORE_GRID = np.linspace(0.0, 1.0, 81)
SCORE_SCALE = 100
_MIN_BANDWIDTH = 0.02
MIN_SCALE_SAMPLES = 10  # labeled test curves on fewer scores don't set the y-scale


def _natural_key(value: str):
    # Typed tuples so a digit run never gets compared with a text run
    # (healthcare has both "0-10" and "More_than_100_Days").
    return [(0, int(p)) if p.isdigit() else (1, p.lower()) for p in re.split(r"(\d+)", value) if p]


def _silverman_bandwidth(samples: np.ndarray) -> float:
    if samples.size < 2:
        return 0.05
    std = float(np.std(samples, ddof=1))
    q75, q25 = np.percentile(samples, [75, 25])
    iqr = float(q75 - q25)
    robust = iqr / 1.34 if iqr > 0 else np.nan
    candidates = [v for v in (std, robust) if np.isfinite(v) and v > 0]
    sigma = min(candidates) if candidates else 0.05
    return max(0.9 * sigma * samples.size ** (-1 / 5), _MIN_BANDWIDTH)


def bounded_kde(samples, grid: np.ndarray = SCORE_GRID) -> np.ndarray:
    """Gaussian KDE on [0, 1] with reflection at both edges, normalized to unit area."""
    s = np.clip(np.asarray(samples, dtype=float), 0.0, 1.0)
    if s.size == 0:
        return np.zeros_like(grid)
    bw = _silverman_bandwidth(s)
    reflected = np.concatenate([s, -s, 2.0 - s])
    scaled = (grid[:, None] - reflected[None, :]) / bw
    density = np.exp(-0.5 * scaled**2).sum(axis=1) / (s.size * bw * np.sqrt(2.0 * np.pi))
    area = np.trapezoid(density, grid)
    return density / area if area > 0 else density


def _pack(density: np.ndarray) -> list[int]:
    return [int(v) for v in np.rint(density * SCORE_SCALE)]


def _read_row(path: str) -> dict:
    with open(path, newline="", encoding="utf-8") as handle:
        return next(csv.DictReader(handle))


def _parse(cell: str):
    return np.asarray(json.loads(cell), dtype=float) if cell else np.asarray([], dtype=float)


def _class_dirs(dataset_dir: str) -> list[str]:
    labels = [
        name
        for name in os.listdir(dataset_dir)
        if name not in ("multiclass", "test_scores")
        and os.path.isfile(os.path.join(dataset_dir, name, "training_distributions.csv"))
    ]
    return sorted(labels, key=_natural_key)


def _batch_ids(dataset_dir: str) -> list[str]:
    paths = glob.glob(os.path.join(dataset_dir, "test_scores", "batch_*_multiclass.csv"))
    ids = sorted({os.path.basename(p)[len("batch_"):].rsplit("_", 1)[0] for p in paths}, key=_natural_key)
    return ids


RESHAPE_EPS = 1e-3


def reshape_scores(pos: np.ndarray, neg: np.ndarray, gamma: float, eps: float = RESHAPE_EPS):
    """Shared-gamma power reshape of a detector's training scores — a copy of
    reshape_scores() in the experiment repo's methods/quantifiers_utils.py:
    positives -> pos ** gamma, negatives mirrored -> 1 - (1 - neg) ** gamma."""
    pos = np.clip(pos, eps, 1 - eps)
    neg = np.clip(neg, eps, 1 - eps)
    return pos**gamma, 1 - (1 - neg) ** gamma


def _reshape_trace(dataset_dir: str) -> dict:
    """{variant: {(batch_index, model_id): gamma}} from reshape_trace.csv, or {}."""
    path = os.path.join(dataset_dir, "reshape_trace.csv")
    if not os.path.isfile(path):
        return {}
    picks = {}
    with open(path, newline="", encoding="utf-8") as handle:
        for row in csv.DictReader(handle):
            picks.setdefault(row["variant"], {})[(int(row["batch_index"]), row["model_id"])] = float(row["param"])
    return picks


def _training(dataset_dir: str, labels: list[str]) -> tuple[dict, dict, dict]:
    """Every model's training curves plus each model's peak density (the card
    keeps one y-scale per detector so a 5-positive class can't squash the rest),
    and the raw (pos, neg) training scores per detector for the reshaped picks."""
    y_max = {}
    mc_row = _read_row(os.path.join(dataset_dir, "multiclass", "training_distributions.csv"))
    matrix = _parse(mc_row["training_scores"])
    if matrix.ndim != 2 or matrix.shape[1] != len(labels):
        raise ValueError(f"multiclass training matrix {matrix.shape} does not match {len(labels)} classes")
    mc_curves = [bounded_kde(matrix[:, i]) for i in range(len(labels))]
    y_max["multiclass"] = max(float(c.max()) for c in mc_curves)

    ovr, raw = {}, {}
    for label in labels:
        row = _read_row(os.path.join(dataset_dir, label, "training_distributions.csv"))
        pos, neg = _parse(row["pos_scores"]), _parse(row["neg_scores"])
        raw[label] = (pos, neg)
        pos_c, neg_c = bounded_kde(pos), bounded_kde(neg)
        y_max[label] = max(float(pos_c.max()), float(neg_c.max()))
        ovr[label] = {"nPos": int(pos.size), "nNeg": int(neg.size), "pos": _pack(pos_c), "neg": _pack(neg_c)}

    return {"multiclass": {"n": int(matrix.shape[0]), "curves": [_pack(c) for c in mc_curves]}, "ovr": ovr}, y_max, raw


def _batch(
    dataset_dir: str, batch_id: str, labels: list[str], train_raw: dict, reshape: dict,
) -> tuple[dict, dict, dict]:
    """One test batch, every model. Also returns, per reshaped variant, each
    model's peak density with that variant's pick in place of the synthetic one
    (a large gamma squeezes the reshaped scores against 0 / 1 into a spike, so
    each pick keeps its own y-scale)."""
    test_dir = os.path.join(dataset_dir, "test_scores")
    y_max, pick_max = {}, {}
    mc_row = _read_row(os.path.join(test_dir, f"batch_{batch_id}_multiclass.csv"))
    matrix = _parse(mc_row["incoming_test_scores"])
    if matrix.ndim != 2 or matrix.shape[1] != len(labels):
        raise ValueError(f"batch {batch_id} multiclass matrix {matrix.shape} does not match {len(labels)} classes")
    mc_curves = [bounded_kde(matrix[:, i]) for i in range(len(labels))]
    y_max["multiclass"] = max(float(c.max()) for c in mc_curves)

    ovr = {}
    for label in labels:
        row = _read_row(os.path.join(test_dir, f"batch_{batch_id}_{label}.csv"))
        inc = _parse(row["incoming_test_scores"])
        sel_p = _parse(row.get("selected_p_scores", ""))
        sel_n = _parse(row.get("selected_n_scores", ""))
        curves = [bounded_kde(inc), bounded_kde(sel_p), bounded_kde(sel_n)]
        scaled = list(curves)  # the curves allowed to set the shared y-scale
        entry = {
            "n": int(inc.size),
            "nSelP": int(sel_p.size),
            "nSelN": int(sel_n.size),
            "inc": _pack(curves[0]),
            "selP": _pack(curves[1]),
            "selN": _pack(curves[2]),
        }
        # Newer runs also store each incoming score's true 0/1 label: split the
        # batch into its real positives / negatives (absent on older runs).
        labels_cell = row.get("incoming_test_labels", "")
        if labels_cell:
            truth = _parse(labels_cell).astype(int)
            if truth.shape == inc.shape:
                pos, neg = inc[truth == 1], inc[truth == 0]
                pos_c, neg_c = bounded_kde(pos), bounded_kde(neg)
                # A handful of true positives gives a needle-thin KDE (peak ~20 at
                # the bandwidth floor) that would flatten every other curve: such
                # curves don't set the scale and clip at the top instead.
                scaled += [c for c, s in ((pos_c, pos), (neg_c, neg)) if s.size >= MIN_SCALE_SAMPLES]
                entry.update({"nPos": int(pos.size), "nNeg": int(neg.size), "incPos": _pack(pos_c), "incNeg": _pack(neg_c)})
        y_max[label] = max(float(c.max()) for c in scaled)

        # Reshaped picks: the detector's training scores under the gamma the
        # search chose for this batch (same KDE, same grid as the synthetic pick).
        incoming_scaled = [c for c in scaled if c is not curves[1] and c is not curves[2]]
        for variant, by_key in reshape.items():
            gamma = by_key.get((int(batch_id), label))
            if gamma is None:
                continue
            pick_p, pick_n = reshape_scores(*train_raw[label], gamma)
            pick_pc, pick_nc = bounded_kde(pick_p), bounded_kde(pick_n)
            entry.setdefault("reshaped", {})[variant] = {
                "param": round(gamma, 4),
                "nSelP": int(pick_p.size),
                "nSelN": int(pick_n.size),
                "selP": _pack(pick_pc),
                "selN": _pack(pick_nc),
            }
            pick_max.setdefault(variant, {})[label] = max(
                float(c.max()) for c in incoming_scaled + [pick_pc, pick_nc]
            )
        ovr[label] = entry

    batch = {"id": batch_id, "multiclass": {"n": int(matrix.shape[0]), "curves": [_pack(c) for c in mc_curves]}, "ovr": ovr}
    return batch, y_max, pick_max


def write_score_distributions(dataset_dir: str, out_dir: str, dataset_id: str) -> dict | None:
    """Write scores/<dataset_id>/{training,batch_*}.json under out_dir.
    Returns the manifest fragment, or None when the dataset has no score dumps."""
    labels = _class_dirs(dataset_dir)
    has_multiclass = os.path.isfile(os.path.join(dataset_dir, "multiclass", "training_distributions.csv"))
    if not labels or not has_multiclass:
        return None

    batch_ids = _batch_ids(dataset_dir)
    shipped = batch_ids[:SCORE_BATCH_LIMIT]

    training, train_max, train_raw = _training(dataset_dir, labels)
    reshape = _reshape_trace(dataset_dir)
    batches, test_max, pick_max = [], {}, {}
    for batch_id in shipped:
        batch, b_max, b_pick_max = _batch(dataset_dir, batch_id, labels, train_raw, reshape)
        batches.append(batch)
        for model, value in b_max.items():
            test_max[model] = max(test_max.get(model, 0.0), value)
        for variant, by_model in b_pick_max.items():
            v_max = pick_max.setdefault(variant, {})
            for model, value in by_model.items():
                v_max[model] = max(v_max.get(model, 0.0), value)

    score_dir = os.path.join(out_dir, "scores", dataset_id)
    os.makedirs(score_dir, exist_ok=True)
    with open(os.path.join(score_dir, "training.json"), "w", encoding="utf-8") as f:
        json.dump(
            {
                "id": dataset_id,
                "labels": labels,
                "x": [round(float(v), 4) for v in SCORE_GRID],
                "scale": SCORE_SCALE,
                # Per model, shared across every batch so the curves stay comparable while scrubbing.
                "yMax": {
                    "training": {m: round(v * 1.08, 3) for m, v in train_max.items()},
                    "test": {m: round(v * 1.08, 3) for m, v in test_max.items()},
                    # test view with a reshaped variant's pick in place of the synthetic one
                    "picks": {
                        variant: {m: round(v * 1.08, 3) for m, v in by_model.items()}
                        for variant, by_model in pick_max.items()
                    },
                },
                "batchIds": shipped,
                "nBatchesTotal": len(batch_ids),
                **training,
            },
            f,
            separators=(",", ":"),
        )
    for index, batch in enumerate(batches):
        with open(os.path.join(score_dir, f"batch_{index:04d}.json"), "w", encoding="utf-8") as f:
            json.dump({"scale": SCORE_SCALE, **batch}, f, separators=(",", ":"))

    out = {"nClasses": len(labels), "nBatches": len(shipped), "nBatchesTotal": len(batch_ids)}
    if pick_max:  # which picked references the test view can show besides the synthetic one
        out["picks"] = ["syn", *sorted(pick_max)]
    return out
