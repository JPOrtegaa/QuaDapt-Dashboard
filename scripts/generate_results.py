"""
Generate the Results-tab data artifacts for the QuaDapt Dashboard.

Scans results/ovr_results2/<group>/<dataset>/<dataset>_results.csv (raw
QuaDapt experiment outputs, copied into this repo but not committed — see
.gitignore) and, for every dataset, computes:

  * per-sample absolute error (AE), from the *_p_normalized columns against
    the *_real (true prevalence) columns — mean absolute error across classes
  * per-method ranking (mean AE, IQR)
  * per-method, per-class mean AE (for the "mean AE by class" heatmap)
  * base -> *_syn family pairs (delta mean AE, win-rate, paired per-batch AE)
  * per-batch prevalence shift (total-variation distance from the dataset's
    global class prior)
  * calibration points (true vs. estimated prevalence) for a bounded set of
    methods (the base/*_syn family members plus the single best method)

Output: one JSON per dataset under results/generated/<id>.json, plus a
manifest.json listing all datasets. scripts/copy-results.mjs copies these
into public/data/results/ so Vite serves them statically.

Usage:  python scripts/generate_results.py
"""

from __future__ import annotations

import json
import math
import os
import re

import numpy as np
import pandas as pd

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RESULTS_DIR = os.path.join(ROOT, "results", "ovr_results2")
OUT_DIR = os.path.join(ROOT, "results", "generated")

GROUP_SOURCE = {
    "kaggle": "kaggle",
    "uci": "uci",
    "quapy": "quapy",
    "openml": "openml",
    "ours": "ours",
    "schumacher_cdt": "schumacher",
}

# Nicer display names for the ids this script derives (folder / file-prefix
# based). Anything not listed here falls back to a naive title-cased humanize.
NAME_OVERRIDES = {
    "dataset_313_spectrometer": "Spectrometer",
    "dataset_4552_bachchoralharmony": "Bach Choral Harmony",
    "fars": "FARS",
    "iris": "Iris",
    "student_performance_data": "Student Performance",
    "cirrhosis": "Cirrhosis",
    "customer_segmentation": "Customer Segmentation",
    "fashion_mnist": "Fashion-MNIST",
    "healthcare": "Healthcare",
    "music_genre": "Music Genre",
    "predictive_maintenance": "Predictive Maintenance",
    "star_classification": "Star Classification",
    "zoo": "Zoo",
    "har": "HAR",
    "avila": "Avila",
    "chessgame": "Chess (King-Rook vs King)",
    "covertype": "Covertype",
    "dermatology": "Dermatology",
    "land_use": "Land Use",
    "mfeat": "Mfeat",
    "mfeat_icdm21": "Mfeat (ICDM'21)",
    "mosquitoes": "Mosquitoes",
    "nursery": "Nursery",
    "phishingurl": "Phishing URL",
    "satimage": "Satimage",
    "walking": "Walking",
    "wine": "Wine",
    "academic_success": "Academic Success",
    "digits": "Digits",
    "dry_bean": "Dry Bean",
    "letter": "Letter",
    "wine_quality": "Wine Quality",
    "fabert": "Fabert",
    "microaggregation2": "Microaggregation2",
    "bike_sharing_data": "Bike Sharing",
    "blog_feedback_data": "Blog Feedback",
    "concrete_data": "Concrete",
    "contraceptive_data": "Contraceptive",
    "diamonds_data": "Diamonds",
    "drugs_data": "Drugs",
    "energy_data": "Energy",
    "fifa19_data": "FIFA 19",
    "news_popularity_data": "News Popularity",
    "skillcraft_data": "SkillCraft",
    "superconductor_data": "Superconductor",
    "theorem_data": "First-order Theorem Proving",
    "turk_student_eval_data": "Turkish Student Eval",
    "video_game_sales_data": "Video Game Sales",
    "yeast_data": "Yeast",
}

for _seed in range(5):
    NAME_OVERRIDES[f"dataset_444{78 + _seed}_amazon"] = f"Amazon Commerce (seed {_seed})"

REAL_COL_RE = re.compile(r"^c(.+)_real$")

CALIBRATION_TARGET_POINTS = 600  # per method, spread across all classes


def slugify(name: str) -> str:
    s = re.sub(r"[^a-zA-Z0-9]+", "_", name).strip("_").lower()
    return s


def humanize(id_: str) -> str:
    if id_ in NAME_OVERRIDES:
        return NAME_OVERRIDES[id_]
    return id_.replace("_", " ").title()


def find_result_csvs():
    for dirpath, _dirnames, filenames in os.walk(RESULTS_DIR):
        for fn in filenames:
            if fn.endswith("_results.csv"):
                rel = os.path.relpath(dirpath, RESULTS_DIR)
                group = rel.split(os.sep)[0]
                yield group, os.path.join(dirpath, fn)


def clean(x, ndigits=4):
    try:
        xf = float(x)
    except (TypeError, ValueError):
        return None
    if not math.isfinite(xf):
        return None
    return round(xf, ndigits)


def compute_dataset(group: str, csv_path: str) -> dict | None:
    fname = os.path.basename(csv_path)
    prefix = fname[: -len("_results.csv")]
    id_ = slugify(prefix)
    source = GROUP_SOURCE.get(group, group)
    name = humanize(id_)

    df = pd.read_csv(csv_path)
    classes = [m.group(1) for c in df.columns if (m := REAL_COL_RE.match(c))]
    if not classes:
        print(f"    ! skip {csv_path}: no class columns found")
        return None

    p_cols = [f"c{c}_p_normalized" for c in classes]
    real_cols = [f"c{c}_real" for c in classes]
    methods = sorted(df["qnt"].unique().tolist())

    # per-row AE = mean absolute error across classes, from normalized preds
    err = (df[p_cols].to_numpy() - df[real_cols].to_numpy())
    df["ae"] = np.abs(err).mean(axis=1)

    grouped = df.groupby("qnt")["ae"]
    means = grouped.mean()
    q1s = grouped.quantile(0.25)
    q3s = grouped.quantile(0.75)

    # per-method, per-class mean AE (for the heatmap)
    per_class_err = {}
    for cls, pcol, rcol in zip(classes, p_cols, real_cols):
        per_class_err[cls] = (df[pcol] - df[rcol]).abs().groupby(df["qnt"]).mean()

    method_set = set(methods)
    families_map = {}
    for m in methods:
        if m.endswith("_syn") and m[: -len("_syn")] in method_set:
            families_map[m[: -len("_syn")]] = m

    # real prevalence per batch (constant across methods) -> global prior
    base_rows = df[df["qnt"] == methods[0]].sort_values("batch_index")
    n_batches = len(base_rows)
    real_matrix = base_rows[real_cols].to_numpy()
    global_prior = real_matrix.mean(axis=0)
    tv = 0.5 * np.abs(real_matrix - global_prior[None, :]).sum(axis=1)

    families = []
    for base, syn in families_map.items():
        base_rows_m = df[df["qnt"] == base].sort_values("batch_index")["ae"].to_numpy()
        syn_rows_m = df[df["qnt"] == syn].sort_values("batch_index")["ae"].to_numpy()
        n = min(len(base_rows_m), len(syn_rows_m))
        base_rows_m, syn_rows_m = base_rows_m[:n], syn_rows_m[:n]
        win_rate = float(np.mean(syn_rows_m < base_rows_m)) if n else None
        families.append({
            "base": base,
            "syn": syn,
            "meanAEBase": clean(means[base]),
            "meanAESyn": clean(means[syn]),
            "deltaMeanAE": clean(means[syn] - means[base]),
            "winRate": clean(win_rate, 4),
            "aeBase": [clean(v, 3) for v in base_rows_m],
            "aeSyn": [clean(v, 3) for v in syn_rows_m],
        })
    families.sort(key=lambda f: f["deltaMeanAE"])

    methods_out = []
    best_method, best_mean = None, None
    for m in sorted(methods, key=lambda m: means[m]):
        is_syn = m.endswith("_syn") and m[: -len("_syn")] in method_set
        mean_v = clean(means[m])
        if best_mean is None or mean_v < best_mean:
            best_mean, best_method = mean_v, m
        methods_out.append({
            "name": m,
            "family": m[: -len("_syn")] if is_syn else None,
            "isSyn": is_syn,
            "meanAE": mean_v,
            "q1": clean(q1s[m]),
            "q3": clean(q3s[m]),
            "perClassAE": {cls: clean(per_class_err[cls].get(m)) for cls in classes},
        })

    # calibration: family members + the single best method, batches sampled
    # evenly so total points/method stay roughly bounded regardless of
    # how many classes the dataset has.
    calib_methods = set(families_map.keys()) | set(families_map.values()) | {best_method}
    n_classes = len(classes)
    calib_batches = max(10, min(n_batches, CALIBRATION_TARGET_POINTS // max(1, n_classes)))
    sample_idx = np.linspace(0, n_batches - 1, calib_batches).round().astype(int)
    sample_idx = np.unique(sample_idx)

    calibration = {}
    for m in sorted(calib_methods):
        rows_m = df[df["qnt"] == m].sort_values("batch_index").iloc[sample_idx]
        t, e, c = [], [], []
        for ci, cls in enumerate(classes):
            t.extend(clean(v, 3) for v in rows_m[f"c{cls}_real"])
            e.extend(clean(v, 3) for v in rows_m[f"c{cls}_p_normalized"])
            c.extend([ci] * len(rows_m))
        calibration[m] = {"t": t, "e": e, "c": c}

    dataset = {
        "id": id_,
        "name": name,
        "source": source,
        "classes": classes,
        "nMethods": len(methods),
        "nBatches": int(n_batches),
        "methods": methods_out,
        "families": families,
        "tv": [clean(v, 3) for v in tv],
        "calibration": calibration,
    }

    syn_win_rates = [f["winRate"] for f in families if f["winRate"] is not None]
    families_improved = sum(1 for f in families if f["deltaMeanAE"] < 0)
    biggest = min(families, key=lambda f: f["deltaMeanAE"]) if families else None

    syn_win_rate = clean(np.mean(syn_win_rates), 4) if syn_win_rates else None

    manifest_entry = {
        "id": id_,
        "name": name,
        "source": source,
        "nClasses": n_classes,
        "nMethods": len(methods),
        "nBatches": int(n_batches),
        "bestMethod": best_method,
        "bestMeanAE": best_mean,
        "synWinRate": syn_win_rate,
        "familiesImproved": families_improved,
        "nFamilies": len(families),
        "biggestGain": (
            {"base": biggest["base"], "syn": biggest["syn"], "deltaMeanAE": biggest["deltaMeanAE"]}
            if biggest else None
        ),
    }

    # --- cross-dataset ("General") record ---------------------------------
    # Free-tier metadata derived straight from the results: the global class
    # prior (true prevalences average) gives imbalance/entropy/gini, and the
    # per-batch TV distances give the drift regime the test actually spanned.
    p = global_prior[global_prior > 0]
    prior_entropy = float(-(p * np.log(p)).sum()) if p.size else 0.0
    prior_entropy_norm = prior_entropy / math.log(n_classes) if n_classes > 1 else 0.0
    prior_gini = 1.0 - float((global_prior ** 2).sum())
    lo = float(global_prior.min())
    prior_imbalance = float(global_prior.max() / lo) if lo > 0 else None

    family_deltas = [f["deltaMeanAE"] for f in families if f["deltaMeanAE"] is not None]
    general_record = {
        "id": id_,
        "name": name,
        "source": source,
        "nClasses": n_classes,
        "meanDeltaAE": clean(np.mean(family_deltas), 4) if family_deltas else None,
        "meanWinRate": syn_win_rate,
        "familiesImproved": families_improved,
        "nFamilies": len(families),
        "perFamilyDelta": {f["base"]: f["deltaMeanAE"] for f in families},
        # methods_out is sorted best -> worst, so position is the rank (1-based)
        "methodRanks": {m["name"]: i + 1 for i, m in enumerate(methods_out)},
        "prior": {
            "entropyNorm": clean(prior_entropy_norm, 3),
            "gini": clean(prior_gini, 3),
            "imbalance": clean(prior_imbalance, 2),
        },
        "meanTV": clean(float(np.mean(tv)), 3),
    }

    return dataset, manifest_entry, general_record


# --- rich-tier metadata join (datasets.json) -------------------------------

DATASETS_JSON = os.path.join(ROOT, "public", "data", "datasets.json")

# results id -> datasets.json id, where slugify diverges from the catalog id.
ID_CROSSWALK = {
    "dataset_313_spectrometer": "spectrometer",
    "dataset_4552_bachchoralharmony": "bach_choral",
    "student_performance_data": "student_performance",
    "phishingurl": "phishing_url",
    "dataset_44478_amazon": "amazon_seed_0",
    "dataset_44479_amazon": "amazon_seed_1",
    "dataset_44480_amazon": "amazon_seed_2",
    "dataset_44481_amazon": "amazon_seed_3",
    "dataset_44482_amazon": "amazon_seed_4",
}

# The rich descriptor axes surfaced in the General view's scatter/predictor
# tools. `free` fields come from the results themselves (always present);
# `rich` fields come from datasets.json via the crosswalk (may be null).
METADATA_FIELDS = [
    {"key": "nClasses", "label": "# classes", "tier": "free", "log": False},
    {"key": "priorImbalance", "label": "imbalance ratio", "tier": "free", "log": True},
    {"key": "priorEntropyNorm", "label": "norm. entropy", "tier": "free", "log": False},
    {"key": "meanTV", "label": "mean drift (TV)", "tier": "free", "log": False},
    {"key": "instances", "label": "# instances", "tier": "rich", "log": True},
    {"key": "features", "label": "# features", "tier": "rich", "log": True},
    {"key": "rowsPerCol", "label": "rows : cols", "tier": "rich", "log": True},
    {"key": "pctCategorical", "label": "% categorical feats", "tier": "rich", "log": False},
    {"key": "avgAbsCorr", "label": "avg |r|", "tier": "rich", "log": False},
    {"key": "missingPct", "label": "% missing cells", "tier": "rich", "log": False},
    {"key": "meanAbsSkew", "label": "mean |skew|", "tier": "rich", "log": False},
]


def crosswalk(rid: str) -> str:
    if rid in ID_CROSSWALK:
        return ID_CROSSWALK[rid]
    if rid.endswith("_data"):  # schumacher: bike_sharing_data -> bike_sharing
        return rid[: -len("_data")]
    return rid


def load_datasets_meta() -> dict:
    """Flatten datasets.json into {id: entry}; empty dict if not generated yet."""
    if not os.path.exists(DATASETS_JSON):
        print(f"    ! datasets.json not found at {DATASETS_JSON} — rich metadata skipped")
        return {}
    with open(DATASETS_JSON, encoding="utf-8") as f:
        grouped = json.load(f)
    out = {}
    for items in grouped.values():
        for entry in items:
            out[entry["id"]] = entry
    return out


def rich_meta(entry: dict) -> dict:
    """Extract the rich descriptor axes from a datasets.json entry, preferring
    the preprocessed view (what the experiment classifier actually saw)."""
    view = entry.get("preprocessed")
    if not (isinstance(view, dict) and "error" not in view and view.get("sizeShape")):
        view = entry.get("raw")
    if not view:
        return {}

    ss = view.get("sizeShape") or {}
    fc = view.get("featureComposition") or {}
    dq = view.get("dataQuality") or {}
    rd = view.get("redundancy") or {}
    fs = view.get("featureStats") or {}

    total_feats = sum(fc.get(k, 0) for k in ("numeric", "categorical", "binary", "constant"))
    pct_cat = 100 * fc.get("categorical", 0) / total_feats if total_feats else None

    skews = [abs(f["skew"]) for f in fs.get("features", []) if f.get("skew") is not None]
    mean_abs_skew = float(np.mean(skews)) if skews else None

    return {
        "instances": ss.get("instances"),
        "features": ss.get("features"),
        "rowsPerCol": ss.get("rowsPerCol"),
        "pctCategorical": clean(pct_cat, 1),
        "avgAbsCorr": rd.get("avgAbsCorr"),
        "missingPct": dq.get("missingPct"),
        "meanAbsSkew": clean(mean_abs_skew, 2),
    }


def pearson(xs, ys):
    """Pearson r over pairs where both values are present; None if degenerate."""
    pairs = [(x, y) for x, y in zip(xs, ys) if x is not None and y is not None]
    if len(pairs) < 3:
        return None, len(pairs)
    x = np.array([p[0] for p in pairs], dtype=float)
    y = np.array([p[1] for p in pairs], dtype=float)
    if x.std() == 0 or y.std() == 0:
        return None, len(pairs)
    return float(np.corrcoef(x, y)[0, 1]), len(pairs)


def build_general(records, datasets_meta):
    """Assemble the cross-dataset ("General") artifact from every dataset's
    general_record plus the joined datasets.json metadata."""
    datasets = []
    for rec in records:
        meta = {
            "nClasses": rec["nClasses"],
            "priorImbalance": rec["prior"]["imbalance"],
            "priorEntropyNorm": rec["prior"]["entropyNorm"],
            "meanTV": rec["meanTV"],
        }
        entry = datasets_meta.get(crosswalk(rec["id"]))
        if entry:
            meta.update(rich_meta(entry))
        for fld in METADATA_FIELDS:
            meta.setdefault(fld["key"], None)

        datasets.append({
            "id": rec["id"],
            "name": rec["name"],
            "source": rec["source"],
            "meanDeltaAE": rec["meanDeltaAE"],
            "meanWinRate": rec["meanWinRate"],
            "familiesImproved": rec["familiesImproved"],
            "nFamilies": rec["nFamilies"],
            "perFamilyDelta": rec["perFamilyDelta"],
            "meta": meta,
        })

    # Family column order for the heatmap: most-improved (most negative mean
    # delta across datasets) first.
    fam_deltas = {}
    for d in datasets:
        for base, delta in d["perFamilyDelta"].items():
            if delta is not None:
                fam_deltas.setdefault(base, []).append(delta)
    families = sorted(fam_deltas, key=lambda b: np.mean(fam_deltas[b]))
    family_mean_delta = {b: clean(np.mean(fam_deltas[b]), 4) for b in families}

    # Predictor ranking: correlation of each metadata axis with the QuaDapt
    # benefit (= -meanDeltaAE, positive means _syn improves). Sorted by |r|.
    benefit = [(-d["meanDeltaAE"]) if d["meanDeltaAE"] is not None else None for d in datasets]
    predictors = []
    for fld in METADATA_FIELDS:
        xs = [d["meta"].get(fld["key"]) for d in datasets]
        if fld["log"]:
            xs = [math.log10(x) if (x is not None and x > 0) else None for x in xs]
        r, n = pearson(xs, benefit)
        predictors.append({"key": fld["key"], "label": fld["label"], "tier": fld["tier"],
                           "corr": clean(r, 3) if r is not None else None, "n": n})
    predictors.sort(key=lambda p: (p["corr"] is None, -abs(p["corr"] or 0)))

    # Global method ranking: mean rank of each method across all datasets it
    # appears in (lower = better). _syn variants flagged for coloring.
    rank_lists = {}
    for rec in records:
        for name, rank in rec["methodRanks"].items():
            rank_lists.setdefault(name, []).append(rank)
    method_ranking = [
        {
            "name": name,
            "isSyn": name.endswith("_syn"),
            "meanRank": clean(float(np.mean(ranks)), 2),
            "coverage": len(ranks),
        }
        for name, ranks in rank_lists.items()
    ]
    method_ranking.sort(key=lambda m: m["meanRank"])

    n = len(datasets)
    improved = [d for d in datasets if d["meanDeltaAE"] is not None and d["meanDeltaAE"] < 0]
    win_rates = [d["meanWinRate"] for d in datasets if d["meanWinRate"] is not None]
    top_predictor = next((p for p in predictors if p["corr"] is not None), None)

    return {
        "nDatasets": n,
        "metadataFields": METADATA_FIELDS,
        "families": families,
        "familyMeanDelta": family_mean_delta,
        "datasets": datasets,
        "predictors": predictors,
        "methodRanking": method_ranking,
        "summary": {
            "datasetsImproved": len(improved),
            "meanWinRate": clean(np.mean(win_rates), 4) if win_rates else None,
            "topPredictor": top_predictor,
            "bestFamily": families[0] if families else None,
            "bestFamilyMeanDelta": family_mean_delta.get(families[0]) if families else None,
        },
    }


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    datasets_meta = load_datasets_meta()
    manifest = []
    general_records = []
    count = 0
    for group, csv_path in sorted(find_result_csvs()):
        rel = os.path.relpath(csv_path, RESULTS_DIR)
        print(f"  {rel} ...", flush=True)
        result = compute_dataset(group, csv_path)
        if result is None:
            continue
        dataset, manifest_entry, general_record = result
        out_path = os.path.join(OUT_DIR, f"{dataset['id']}.json")
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(dataset, f, separators=(",", ":"))
        manifest.append(manifest_entry)
        general_records.append(general_record)
        count += 1

    manifest.sort(key=lambda d: (d["source"], d["name"]))
    with open(os.path.join(OUT_DIR, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    general = build_general(general_records, datasets_meta)
    with open(os.path.join(OUT_DIR, "general.json"), "w", encoding="utf-8") as f:
        json.dump(general, f, separators=(",", ":"))

    joined = sum(1 for r in general_records if crosswalk(r["id"]) in datasets_meta)
    print(f"\nWrote {count} datasets to {OUT_DIR}")
    print(f"  general.json: {count} datasets, {joined} joined to datasets.json metadata")


if __name__ == "__main__":
    main()
