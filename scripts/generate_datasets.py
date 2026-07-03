"""
Generate datasets.json for the QuaDapt Dashboard "Datasets" tab.

For every dataset CSV under datasets/<source>/ this computes the six
descriptor cards from Dataset_Tab.reference.html
    Size & Shape · Feature Composition · Data Quality ·
    Redundancy · Class Structure · Feature Statistics
for TWO views of the data:

  * "raw"          - the CSV exactly as it sits on disk.
  * "preprocessed" - the CSV after applying that dataset's real
                     preprocess_* function (imported from the per-source
                     preprocess.py modules). null when no preprocessing
                     is defined for that dataset.

Output is grouped by source:  { "kaggle": [...], "uci": [...], ... }.

Usage:  python scripts/generate_datasets.py
Output: datasets/datasets.json
"""

from __future__ import annotations

import json
import math
import os
import sys

import numpy as np
import pandas as pd

# --- paths / real preprocess modules ---------------------------------------

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, "datasets")
OUT_PATH = os.path.join(DATA_DIR, "datasets.json")

sys.path.insert(0, ROOT)  # let `datasets.<source>.preprocess` import
import datasets.kaggle.preprocess as _kaggle          # noqa: E402
import datasets.uci.preprocess as _uci                # noqa: E402
import datasets.openml.preprocess as _openml          # noqa: E402
import datasets.ours.preprocess as _ours              # noqa: E402
import datasets.schumacher.preprocess as _schu        # noqa: E402

CORR_THRESHOLD = 0.9
CORR_ROW_CAP = 20000          # cap rows used for the pairwise-corr matrix
TARGET_CANDIDATES = ("class", "class_type", "target", "Class", "Target", "game")

# --- catalog ----------------------------------------------------------------
# (id, display name, relative path, preprocess fn or None)
# A None preprocess fn -> "preprocessed" view is null for that dataset.

CATALOG = {
    "kaggle": [
        ("cirrhosis",              "Cirrhosis",               "kaggle/cirrhosis.csv",                _kaggle.preprocess_cirrhosis),
        ("customer_segmentation",  "Customer Segmentation",   "kaggle/customer_segmentation.csv",    _kaggle.preprocess_customer_segmentation),
        ("fashion_mnist",          "Fashion-MNIST",           "kaggle/fashion-mnist.csv",            _kaggle.preprocess_fashion_mnist),
        ("healthcare",             "Healthcare",              "kaggle/healthcare.csv",               _kaggle.preprocess_healthcare),
        ("iris",                   "Iris",                    "kaggle/IRIS.csv",                     None),
        ("music_genre",            "Music Genre",             "kaggle/music_genre.csv",              _kaggle.preprocess_music_genre),
        ("predictive_maintenance", "Predictive Maintenance",  "kaggle/predictive_maintenance.csv",   _kaggle.preprocess_predictive_maintenance),
        ("star_classification",    "Star Classification",     "kaggle/star_classification.csv",      _kaggle.preprocess_star_classification),
        ("student_performance",    "Student Performance",     "kaggle/Student_performance_data.csv", _kaggle.preprocess_student_performance),
        ("zoo",                    "Zoo",                     "kaggle/zoo.csv",                      _kaggle.preprocess_zoo),
        ("zoo2",                   "Zoo (v2)",                "kaggle/zoo2.csv",                     _kaggle.preprocess_zoo2),
        ("zoo3",                   "Zoo (v3)",                "kaggle/zoo3.csv",                     _kaggle.preprocess_zoo3),
    ],
    "uci": [
        ("article_influence",      "Article Influence",       "uci/uci_42123_article_influence.csv", _uci.preprocess_article_influence),
        ("wine",                   "Wine",                    "uci/wine.csv",                        None),
    ],
    "quapy": [
        ("academic_success",       "Academic Success",        "quapy_data/academic-success.csv",     None),
        ("digits",                 "Digits",                  "quapy_data/digits.csv",               None),
        ("dry_bean",               "Dry Bean",                "quapy_data/dry-bean.csv",             None),
        ("letter",                 "Letter",                  "quapy_data/letter.csv",               None),
        ("wine_quality",           "Wine Quality",            "quapy_data/wine-quality.csv",         None),
    ],
    "openml": [
        ("internet_usage",         "Internet Usage",          "openml/!dataset_372_internet_usage.csv",              None),
        ("amazon_commerce",        "Amazon Commerce Reviews", "openml/dataset_1457_amazon-commerce-reviews.csv",     _openml.preprocess_amazon_commerce_reviews),
        ("plants_margin",          "One Hundred Plants (Margin)",  "openml/dataset_1491_one-hundred-plants-margin.csv",  None),
        ("plants_shape",           "One Hundred Plants (Shape)",   "openml/dataset_1492_one-hundred-plants-shape.csv",   None),
        ("plants_texture",         "One Hundred Plants (Texture)", "openml/dataset_1493_one-hundred-plants-texture.csv", None),
        ("spectrometer",           "Spectrometer",            "openml/dataset_313_spectrometer.csv",                 _openml.preprocess_spectrometer),
        ("amazon_seed_0",          "Amazon Commerce (subset, seed 0)", "openml/dataset_44478_amazon-commerce-reviews_seed_0_nrows_2000_nclasses_10_ncols_100_stratify_True.csv", _openml.preprocess_amazon_commerce_reviews_subset),
        ("amazon_seed_1",          "Amazon Commerce (subset, seed 1)", "openml/dataset_44479_amazon-commerce-reviews_seed_1_nrows_2000_nclasses_10_ncols_100_stratify_True.csv", _openml.preprocess_amazon_commerce_reviews_subset),
        ("amazon_seed_2",          "Amazon Commerce (subset, seed 2)", "openml/dataset_44480_amazon-commerce-reviews_seed_2_nrows_2000_nclasses_10_ncols_100_stratify_True.csv", _openml.preprocess_amazon_commerce_reviews_subset),
        ("amazon_seed_3",          "Amazon Commerce (subset, seed 3)", "openml/dataset_44481_amazon-commerce-reviews_seed_3_nrows_2000_nclasses_10_ncols_100_stratify_True.csv", _openml.preprocess_amazon_commerce_reviews_subset),
        ("amazon_seed_4",          "Amazon Commerce (subset, seed 4)", "openml/dataset_44482_amazon-commerce-reviews_seed_4_nrows_2000_nclasses_10_ncols_100_stratify_True.csv", _openml.preprocess_amazon_commerce_reviews_subset),
        ("bach_choral",            "Bach Choral Harmony",     "openml/dataset_4552_BachChoralHarmony.csv",           _openml.preprocess_bach_choral_harmony),
        ("fabert",                 "Fabert",                  "openml/fabert.csv",                                   _openml.preprocess_fabert),
        ("fars",                   "FARS",                    "openml/fars.csv",                                     _openml.preprocess_fars),
        ("microaggregation2",      "Microaggregation2",       "openml/microaggregation2.csv",                        None),
    ],
    "ours": [
        ("avila",                  "Avila",                   "ours/Avila.csv",                      None),
        ("chessgame",              "Chess (King-Rook vs King)", "ours/Chessgame.csv",                None),
        ("covertype",              "Covertype",               "ours/Covertype.csv",                  _ours.preprocess_covertype),
        ("dermatology",            "Dermatology",             "ours/Dermatology.csv",                _ours.preprocess_dermatology),
        ("har",                    "HAR",                     "ours/HAR.csv",                        _ours.preprocess_har),
        ("land_use",               "Land Use",                "ours/Land-use.csv",                   None),
        ("mfeat",                  "Mfeat",                   "ours/Mfeat.csv",                      None),
        ("mfeat_icdm21",           "Mfeat (ICDM'21)",         "ours/Mfeat_icdm21.csv",               None),
        ("mosquitoes",             "Mosquitoes",              "ours/Mosquitoes.csv",                 _ours.preprocess_mosquitoes),
        ("nursery",                "Nursery",                 "ours/Nursery.csv",                    None),
        ("phishing_url",           "Phishing URL",            "ours/PhishingURL.csv",                None),
        ("satimage",               "Satimage",                "ours/Satimage.csv",                   None),
        ("walking",                "Walking",                 "ours/Walking.csv",                    None),
    ],
    # schumacher: regression / already-encoded benchmarks with no defined
    # preprocessing. Class structure only when a literal class/target column
    # exists; otherwise feature-level descriptors only (target auto = None).
    "schumacher": [
        ("bike_sharing",           "Bike Sharing",            "schumacher/bike_sharing_data.csv",    _schu.preprocess_bike),
        ("blog_feedback",          "Blog Feedback",           "schumacher/blog_feedback_data.csv",   _schu.preprocess_blog_feedback),
        ("concrete",               "Concrete",                "schumacher/concrete_data.csv",        _schu.preprocess_concrete),
        ("contraceptive",          "Contraceptive",           "schumacher/contraceptive_data.csv",   _schu.preprocess_contraceptive),
        ("diamonds",               "Diamonds",                "schumacher/diamonds_data.csv",        _schu.preprocess_diamonds),
        ("drugs",                  "Drugs",                   "schumacher/drugs_data.csv",           _schu.preprocess_drugs),
        ("energy",                 "Energy",                  "schumacher/energy_data.csv",          _schu.preprocess_energy),
        ("fifa19",                 "FIFA 19",                 "schumacher/fifa19_data.csv",          _schu.preprocess_fifa19),
        ("news_popularity",        "News Popularity",         "schumacher/news_popularity_data.csv", _schu.preprocess_news_popularity),
        ("skillcraft",             "SkillCraft",              "schumacher/skillcraft_data.csv",      _schu.preprocess_skillcraft),
        ("superconductor",         "Superconductor",          "schumacher/superconductor_data.csv",  _schu.preprocess_superconductor),
        ("turk_student_eval",      "Turkish Student Eval",    "schumacher/turk_student_eval_data.csv", _schu.preprocess_turk_student_eval),
        ("video_game_sales",       "Video Game Sales",        "schumacher/video_game_sales_data.csv", _schu.preprocess_video_game_sales),
        ("yeast",                  "Yeast",                   "schumacher/yeast_data.csv",           _schu.preprocess_yeast),
        ("theorem",                "First-order Theorem Proving", "schumacher/first-order-theorem/all-data-raw.csv", _schu.preprocess_theorem),
    ],
}

# Sources whose targets are only trusted when literally named class/target
# (avoids treating regression / one-hot-dummy columns as a class label).
STRICT_TARGET_SOURCES = {"schumacher"}

# Explicit label columns for schumacher datasets, taken from the paper repo's
# data/data_index.csv `target` field (github.com/tobiasschumacher/quantification_paper).
# Each is the discretized class label produced by that dataset's prep.py.
TARGET_OVERRIDE = {
    "bike_sharing":      "cnt",
    "blog_feedback":     "att280",
    "concrete":          "strength",
    "contraceptive":     "Contraceptive",
    "diamonds":          "cut",
    "drugs":             "att28",
    "energy":            "Appliances",
    "fifa19":            "Wage",
    "news_popularity":   "shares",
    "skillcraft":        "LeagueIndex",
    "superconductor":    "critical_temp",
    "turk_student_eval": "instr",
    "video_game_sales":  "Critic_Score",
    "yeast":             "class",
}

# Authoritative metadata from the Schumacher benchmark table.
# {id: (abbr, origin, declaredFeatures D, declaredInstances N, declaredClasses L, nonCategorical)}
PAPER_META = {
    "bike_sharing":      ("bike",  "UCI",    59,  17379, 4, True),
    "blog_feedback":     ("blog",  "UCI",    280, 52397, 4, True),
    "concrete":          ("conc",  "UCI",    8,   1030,  3, True),
    "contraceptive":     ("contra","UCI",    13,  1473,  3, True),
    "diamonds":          ("diam",  "Kaggle", 22,  53940, 3, True),
    "drugs":             ("drugs", "UCI",    136, 1885,  3, True),
    "energy":            ("ener",  "UCI",    25,  19735, 3, True),
    "fifa19":            ("fifa",  "Kaggle", 117, 14751, 4, True),
    "news_popularity":   ("news",  "UCI",    60,  39644, 4, True),
    "skillcraft":        ("craft", "UCI",    18,  3338,  3, True),
    "superconductor":    ("cond",  "UCI",    89,  21263, 4, True),
    "turk_student_eval": ("turk",  "UCI",    31,  5820,  3, False),
    "video_game_sales":  ("vgame", "Kaggle", 132, 6825,  4, True),
    "yeast":             ("yeast", "UCI",    9,   1299,  4, True),
    "theorem":           ("thrm",  "UCI",    51,  5631,  5, True),
}


# --- helpers ---------------------------------------------------------------

def read_csv(path: str) -> pd.DataFrame:
    for enc in ("utf-8-sig", "latin-1"):
        try:
            return pd.read_csv(path, encoding=enc, low_memory=False)
        except UnicodeDecodeError:
            continue
    return pd.read_csv(path, encoding="latin-1", low_memory=False)


def pick_target(cols, strict=False):
    for cand in TARGET_CANDIDATES:
        if cand in cols:
            return cand
    if strict:
        return None
    return cols[-1] if len(cols) else None


def clean_float(x, ndigits=2):
    if x is None:
        return None
    try:
        xf = float(x)
    except (TypeError, ValueError):
        return None
    if not math.isfinite(xf):
        return None
    return round(xf, ndigits)


def clean_num(x, ndigits=2):
    v = clean_float(x, ndigits)
    if v is None:
        return None
    return int(v) if v == int(v) else v


def classify_feature(series: pd.Series) -> str:
    n_unique = series.nunique(dropna=True)
    if n_unique <= 1:
        return "constant"
    if n_unique == 2:
        return "binary"
    if pd.api.types.is_numeric_dtype(series):
        return "numeric"
    return "categorical"


def is_regression_target(series: pd.Series) -> bool:
    """Continuous numeric target with many distinct values -> regression."""
    if not pd.api.types.is_numeric_dtype(series):
        return False
    n = len(series)
    nu = series.nunique(dropna=True)
    return nu > 50 and nu > 0.2 * n


# --- descriptor cards ------------------------------------------------------

def size_shape(df, n_features):
    rows = len(df)
    return {
        "instances": rows,
        "features": n_features,
        "rowsPerCol": int(round(rows / n_features)) if n_features else None,
    }


def feature_composition(features):
    kinds = {"numeric": 0, "categorical": 0, "binary": 0, "constant": 0}
    for col in features.columns:
        kinds[classify_feature(features[col])] += 1
    return kinds


def data_quality(df):
    rows, cols = df.shape
    missing = int(df.isnull().sum().sum())
    total = rows * cols
    dups = int(df.duplicated().sum())
    return {
        "missingCells": missing,
        "missingPct": clean_float(100 * missing / total if total else 0, 2),
        "duplicates": dups,
        "duplicatePct": clean_float(100 * dups / rows if rows else 0, 2),
        "malformed": 0,
    }


def redundancy(numeric):
    out = {"avgAbsCorr": None, "highlyCorrelatedPairs": 0, "threshold": CORR_THRESHOLD}
    if numeric.shape[1] < 2:
        return out
    sample = numeric.sample(CORR_ROW_CAP, random_state=42) if len(numeric) > CORR_ROW_CAP else numeric
    corr = sample.corr(numeric_only=True).abs().values
    iu = np.triu_indices_from(corr, k=1)
    vals = corr[iu]
    vals = vals[np.isfinite(vals)]
    if vals.size == 0:
        return out
    out["avgAbsCorr"] = clean_float(vals.mean(), 2)
    out["highlyCorrelatedPairs"] = int((vals > CORR_THRESHOLD).sum())
    return out


def class_structure(target: pd.Series):
    counts = target.value_counts(dropna=False)
    total = int(counts.sum())
    n_classes = int(len(counts))
    probs = counts.values / total if total else np.array([])
    entropy = -np.sum([p * math.log(p) for p in probs if p > 0]) if total else 0.0
    entropy_norm = entropy / math.log(n_classes) if n_classes > 1 else 0.0
    gini = 1 - float(np.sum(probs ** 2)) if total else 0.0
    hi, lo = int(counts.max()), int(counts.min())
    imbalance = f"{int(round(hi / lo))}:1" if lo else None
    classes = [
        {"name": str(name), "count": int(c), "pct": clean_float(100 * c / total, 2)}
        for name, c in counts.items()
    ]
    return {
        "nClasses": n_classes,
        "entropyNorm": clean_float(entropy_norm, 2),
        "gini": clean_float(gini, 2),
        "imbalanceRatio": imbalance,
        "classes": classes,
    }


def feature_stats(numeric):
    features, spans = [], []
    for col in numeric.columns:
        s = numeric[col].dropna()
        if s.empty:
            continue
        mn, mx = float(s.min()), float(s.max())
        spans.append(mx - mn)
        features.append({
            "name": str(col),
            "min": clean_num(mn, 2),
            "max": clean_num(mx, 2),
            "mean": clean_float(s.mean(), 2),
            "std": clean_float(s.std(), 2),
            "skew": clean_float(s.skew(), 2),
        })
    positive = [sp for sp in spans if sp > 0]
    norm = bool(positive and (max(positive) / min(positive) >= 100))
    return {"normalizationRecommended": norm, "features": features}


# --- one view (raw or preprocessed) ----------------------------------------

def describe_view(df: pd.DataFrame, strict_target: bool, target_override=None) -> dict:
    if target_override is not None and target_override in df.columns:
        target_col = target_override
    else:
        target_col = pick_target(list(df.columns), strict=strict_target)
    feature_cols = [c for c in df.columns if c != target_col]
    features = df[feature_cols]
    numeric = features.select_dtypes(include=[np.number])

    view = {
        "targetColumn": target_col,
        "sizeShape": size_shape(df, len(feature_cols)),
        "featureComposition": feature_composition(features),
        "dataQuality": data_quality(df),
        "redundancy": redundancy(numeric),
        "classStructure": None,
        "featureStats": feature_stats(numeric),
    }
    if target_col is not None:
        if is_regression_target(df[target_col]):
            view["regressionTarget"] = True
        else:
            view["classStructure"] = class_structure(df[target_col])
    return view


# --- per-dataset assembly --------------------------------------------------

def describe(source, ds_id, name, rel_path, preprocess_fn):
    path = os.path.join(DATA_DIR, rel_path)
    strict = source in STRICT_TARGET_SOURCES
    override = TARGET_OVERRIDE.get(ds_id)
    raw_df = read_csv(path)

    entry = {
        "id": ds_id,
        "name": name,
        "source": source,
        "file": rel_path,
        "ingestedBytes": os.path.getsize(path),
        "raw": describe_view(raw_df, strict, override),
        "preprocessed": None,
    }

    meta = PAPER_META.get(ds_id)
    if meta is not None:
        abbr, origin, d, n, l, noncat = meta
        entry["paper"] = {
            "abbr": abbr, "origin": origin,
            "declaredFeatures": d, "declaredInstances": n,
            "declaredClasses": l, "nonCategorical": noncat,
        }

    if preprocess_fn is not None:
        try:
            pre_df = preprocess_fn(raw_df.copy())
            entry["preprocessed"] = describe_view(pre_df, strict, override)
        except Exception as e:  # keep going; record why it failed
            entry["preprocessed"] = {"error": f"{type(e).__name__}: {e}"}
            print(f"    ! preprocess failed for {ds_id}: {e}", flush=True)

    return entry


def main():
    grouped = {}
    for source, items in CATALOG.items():
        grouped[source] = []
        for ds_id, name, rel_path, fn in items:
            tag = "raw+prep" if fn else "raw"
            print(f"  {source:11s} {ds_id:24s} [{tag}] ...", flush=True)
            grouped[source].append(describe(source, ds_id, name, rel_path, fn))

    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(grouped, f, indent=2, ensure_ascii=False)

    total = sum(len(v) for v in grouped.values())
    print(f"\nWrote {total} datasets to {OUT_PATH}")
    for src, items in grouped.items():
        n_pre = sum(1 for e in items if isinstance(e["preprocessed"], dict) and "error" not in e["preprocessed"])
        print(f"  {src:11s} {len(items):2d} datasets ({n_pre} preprocessed)")


if __name__ == "__main__":
    main()
