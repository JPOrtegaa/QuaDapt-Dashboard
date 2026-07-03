"""
Verify that datasets/schumacher/preprocess.py reproduces Tobias Schumacher's
preprocessing, i.e. that our output matches the one produced by his repository:
    https://github.com/tobiasschumacher/quantification_paper  (data/<name>/prep.py)

Background
----------
The CSVs under datasets/schumacher/ are Schumacher's ``prep_data(binned=False)``
output (target already discretized via ``pd.cut``, categoricals one-hot, ids
dropped). Our ``preprocess_<dataset>`` applies the remaining ``binned=True`` step
(quantile-/fixed-binning the continuous features) and renames the label column to
``class``. So our output should equal his ``prep_data(binned=True)`` up to that
rename (``theorem`` is special: its on-disk file is the *raw* matrix, so we
reproduce his full prep).

Note: the on-disk ``*_data.csv`` files are this project's own materialization of
Schumacher's data, not byte-for-byte a fresh ``prep_data()`` run (e.g. diamonds
keeps ``cut`` as a single 3-class label instead of his one-hot ``cut_0/1/2``, and
lacks ``carat`` because his ``index_col=0`` consumes it). So the checks target the
*binning transformation* his repo defines, plus one true end-to-end case.

Two layers of checking
----------------------
1. TestBinnedMatchesRepoLogic (offline, all 15 datasets): compares our output to a
   verbatim transcription of each dataset's ``if binned:`` block copied from the
   repo (each reference function cites its source file), applied to the same
   on-disk frame.
2. TestAgainstLiveRepo (best-effort, network): downloads the actual prep.py from
   GitHub and runs ``prep_data(binned=True)`` on ``theorem`` — the one dataset
   whose on-disk file is Schumacher's verbatim raw input — asserting it equals our
   output. Network / dependency failures skip; a genuine value mismatch fails.

Run:  python -m unittest tests.test_schumacher_preprocess -v
"""

import os
import sys
import types
import shutil
import inspect
import tempfile
import unittest
import urllib.request
import contextlib

import pandas as pd
from pandas.testing import assert_frame_equal

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCHU = os.path.join(ROOT, "datasets", "schumacher")
sys.path.insert(0, ROOT)

import datasets.schumacher.preprocess as prep  # noqa: E402

REPO_RAW = "https://raw.githubusercontent.com/tobiasschumacher/quantification_paper/master"

# on-disk file, our preprocess fn, and Schumacher's original label column name.
DATASETS = {
    "bike_sharing":      ("bike_sharing_data.csv",      prep.preprocess_bike,             "cnt"),
    "blog_feedback":     ("blog_feedback_data.csv",     prep.preprocess_blog_feedback,    "att280"),
    "concrete":          ("concrete_data.csv",          prep.preprocess_concrete,         "strength"),
    "contraceptive":     ("contraceptive_data.csv",     prep.preprocess_contraceptive,    "Contraceptive"),
    "diamonds":          ("diamonds_data.csv",          prep.preprocess_diamonds,         "cut"),
    "drugs":             ("drugs_data.csv",             prep.preprocess_drugs,            "att28"),
    "energy":            ("energy_data.csv",            prep.preprocess_energy,           "Appliances"),
    "fifa19":            ("fifa19_data.csv",            prep.preprocess_fifa19,           "Wage"),
    "news_popularity":   ("news_popularity_data.csv",   prep.preprocess_news_popularity,  "shares"),
    "skillcraft":        ("skillcraft_data.csv",        prep.preprocess_skillcraft,       "LeagueIndex"),
    "superconductor":    ("superconductor_data.csv",    prep.preprocess_superconductor,   "critical_temp"),
    "turk_student_eval": ("turk_student_eval_data.csv", prep.preprocess_turk_student_eval, "instr"),
    "video_game_sales":  ("video_game_sales_data.csv",  prep.preprocess_video_game_sales, "Critic_Score"),
    "yeast":             ("yeast_data.csv",             prep.preprocess_yeast,            "class"),
    "theorem":           (os.path.join("first-order-theorem", "all-data-raw.csv"),
                          prep.preprocess_theorem, "res"),
}

NEWS_QCOLS = [
    'timedelta', 'n_tokens_title', 'n_tokens_content', 'n_unique_tokens',
    'n_non_stop_words', 'n_non_stop_unique_tokens', 'num_hrefs', 'num_self_hrefs',
    'num_imgs', 'num_videos', 'average_token_length', 'num_keywords',
    'kw_min_min', 'kw_max_min', 'kw_avg_min', 'kw_min_max', 'kw_max_max',
    'kw_avg_max', 'kw_min_avg', 'kw_max_avg', 'kw_avg_avg',
    'self_reference_min_shares', 'self_reference_max_shares',
    'self_reference_avg_sharess', 'LDA_00', 'LDA_01', 'LDA_02', 'LDA_03',
    'LDA_04', 'global_subjectivity', 'global_sentiment_polarity',
    'global_rate_positive_words', 'global_rate_negative_words',
    'rate_positive_words', 'rate_negative_words', 'avg_positive_polarity',
    'min_positive_polarity', 'max_positive_polarity', 'avg_negative_polarity',
    'min_negative_polarity', 'max_negative_polarity', 'title_subjectivity',
    'title_sentiment_polarity', 'abs_title_subjectivity',
    'abs_title_sentiment_polarity',
]


def _qc(df, cols):
    """Schumacher's qcut idiom: pd.qcut(col, q=4, labels=False, duplicates='drop').
    Skips columns absent from this file (the on-disk _data.csv are the project's
    own materialization of the paper's data and can lack a column, e.g. diamonds'
    'carat' — see module docstring); this isolates binning logic from that gap."""
    for c in cols:
        if c not in df.columns:
            continue
        df[c] = pd.qcut(df[c], q=4, labels=False, duplicates='drop').astype('int64')
    return df


# --- verbatim transcriptions of each dataset's `if binned:` block ------------
# (target column left with its original name; identity where the paper has no
# binned mode). Source: data/<name>/prep.py in the repo above.

def ref_bike(df):            return _qc(df, list(df.columns)[2:6])
def ref_blog_feedback(df):   return _qc(_qc(df, list(df.columns)[:59]), list(df.columns)[272:-1])
def ref_concrete(df):        return _qc(df, list(df.columns)[:-1])
def ref_diamonds(df):        return _qc(df, ['carat', 'depth', 'table', 'price', 'xc', 'yc', 'zc'])
def ref_drugs(df):           return _qc(df, list(df.columns)[:12])
def ref_energy(df):          return _qc(df, list(df.columns)[1:])
def ref_fifa19(df):          return _qc(df, [c for c in list(df.columns)[:72] if c != 'Wage'])
def ref_news_popularity(df): return _qc(df, NEWS_QCOLS)
def ref_skillcraft(df):      return _qc(df, list(df.columns)[1:])
def ref_superconductor(df):  return _qc(df, list(df.columns)[:-10])
def ref_turk_student_eval(df): return df  # paper's turk prep has no binned mode
def ref_video_game_sales(df):
    return _qc(df, ['Year_of_Release', 'NA_Sales', 'EU_Sales', 'JP_Sales',
                    'Other_Sales', 'Critic_Count', 'User_Count'])


def ref_contraceptive(df):
    df['Age'] = pd.cut(df['Age'], bins=[15, 25, 30, 35, 40, 50], labels=[1, 2, 3, 4, 5]).astype('int64')
    df['NumberChildren'] = pd.cut(df['NumberChildren'], bins=[-1, 0, 1, 2, 3, 5, 20],
                                  labels=[0, 1, 2, 3, 4, 5]).astype('int64')
    return df


def ref_yeast(df):
    for col in ['mcg', 'gvh', 'alm']:
        df[col] = pd.cut(df[col], bins=[0, 0.4, 0.5, 0.6, 1], labels=[1, 2, 3, 4]).astype('int64')
    df['mit'] = pd.cut(df['mit'], bins=[-0.1, 0.1, 0.2, 0.3, 1], labels=[1, 2, 3, 4]).astype('int64')
    df['pox'] = pd.cut(df['pox'], bins=[-0.1, 0.4, 0.5, 0.6, 1], labels=[1, 2, 3, 4]).astype('int64')
    df['vac'] = pd.cut(df['vac'], bins=[-0.1, 0.25, 0.35, 1], labels=[1, 2, 3]).astype('int64')
    return df


def ref_theorem(df):
    # full port of data/theorem/prep.py (target constructed from prover times).
    df = df.copy()
    df.columns = ['att' + str(i + 1) for i in range(df.shape[1])]
    df[df == -100] = 1000
    df['min_time'] = df.iloc[:, -5:].min(axis=1)
    df['res'] = df.iloc[:, -6:-1].idxmin(axis=1)
    df['res'] = df['res'].apply(lambda t: int(t[-1]) - 3)
    df.loc[df['min_time'] > 100, 'res'] = 0
    df = df.drop(['att54', 'att55', 'att56', 'att57', 'att58', 'min_time', 'att5', 'att35'], axis=1)
    df = df[df['res'] != 2]
    df.loc[df['res'] == 5, 'res'] = 2
    return _qc(df, [c for c in df.columns if c != 'res'])


REFERENCE = {
    "bike_sharing": ref_bike, "blog_feedback": ref_blog_feedback, "concrete": ref_concrete,
    "contraceptive": ref_contraceptive, "diamonds": ref_diamonds, "drugs": ref_drugs,
    "energy": ref_energy, "fifa19": ref_fifa19, "news_popularity": ref_news_popularity,
    "skillcraft": ref_skillcraft, "superconductor": ref_superconductor,
    "turk_student_eval": ref_turk_student_eval, "video_game_sales": ref_video_game_sales,
    "yeast": ref_yeast, "theorem": ref_theorem,
}

# Schumacher repo folder (data/<dir>/prep.py) for each dataset.
REPO_DIR = {
    "bike_sharing": "bike", "blog_feedback": "blog_feedback", "concrete": "concrete",
    "contraceptive": "contraceptive", "diamonds": "diamonds", "drugs": "drugs",
    "energy": "energy", "fifa19": "fifa19", "news_popularity": "news_popularity",
    "skillcraft": "skillcraft", "superconductor": "superconductor",
    "turk_student_eval": "turk_student_eval", "video_game_sales": "video_game_sales",
    "yeast": "yeast", "theorem": "theorem",
}

# Datasets whose prep.py reads a *local* relative file (not a UCI download):
# {dataset: (local source path, filename his prep expects in cwd)}.
LOCAL_RAW = {
    "theorem":          (os.path.join(SCHU, "first-order-theorem", "all-data-raw.csv"), "all-data-raw.csv"),
    "diamonds":         (os.path.join(SCHU, "diamonds.csv"), "diamonds.csv"),
    "fifa19":           (os.path.join(SCHU, "fifa19.csv"), "data.csv"),
    "video_game_sales": (os.path.join(SCHU, "Video_Games_Sales_as_at_22_Dec_2016.csv"), "data.csv"),
}


def read_ondisk(fname):
    path = os.path.join(SCHU, fname)
    for enc in ("utf-8-sig", "latin-1"):
        try:
            return pd.read_csv(path, encoding=enc, low_memory=False)
        except UnicodeDecodeError:
            continue
    return pd.read_csv(path, encoding="latin-1", low_memory=False)


def normalize(df):
    """Align for value comparison: sort columns, bool->int, drop index."""
    df = df.copy()
    for c in df.columns:
        if df[c].dtype == bool:
            df[c] = df[c].astype("int64")
    return df.reindex(sorted(df.columns), axis=1).reset_index(drop=True)


def assert_same(a, b):
    assert_frame_equal(normalize(a), normalize(b), check_dtype=False, check_like=False)


class TestBinnedMatchesRepoLogic(unittest.TestCase):
    """Offline: our preprocess == verbatim transcription of the repo's binned block."""

    def test_all_datasets(self):
        for ds, (fname, fn, target) in DATASETS.items():
            with self.subTest(dataset=ds):
                raw = read_ondisk(fname)
                mine = fn(raw.copy())
                ref = REFERENCE[ds](raw.copy()).rename(columns={target: "class"})
                self.assertIn("class", mine.columns, f"{ds}: our output has no 'class' column")
                assert_same(mine, ref)


def _load_repo_prep(name):
    url = f"{REPO_RAW}/data/{name}/prep.py"
    src = urllib.request.urlopen(url, timeout=20).read().decode("utf-8")
    mod = types.ModuleType(f"schu_{name}")
    exec(compile(src, url, "exec"), mod.__dict__)
    return mod


@contextlib.contextmanager
def _chdir(path):
    prev = os.getcwd()
    os.chdir(path)
    try:
        yield
    finally:
        os.chdir(prev)


def _run_prep(mod, binned):
    """Call his prep_data(), passing binned= only if it accepts it
    (turk's prep_data has no binned mode)."""
    if "binned" in inspect.signature(mod.prep_data).parameters:
        return mod.prep_data(binned=binned)
    return mod.prep_data()


class TestAgainstLiveRepo(unittest.TestCase):
    """Genuine two-implementation diff: download Schumacher's actual prep.py from
    GitHub, execute it, and compare its output to ours.

    For every dataset we run his prep_data(binned=False) (his materialized frame)
    and prep_data(binned=True) (his fully-binned frame), run OUR preprocess, and
    assert equality with his binned=True output (modulo the label->'class' rename):

      * theorem  — our function consumes the raw matrix, so we run it on the raw
        file and compare to his binned=True.
      * all others — we drive OUR binning from HIS actual binned=False frame, so
        both sides start from identical data and only the binning differs. This
        sidesteps the fact that the project's on-disk *_data.csv are a
        re-materialization (e.g. diamonds' one-hot cut / dropped carat).

    Any sourcing failure (no network, an .xls/encoding dependency, a dataset whose
    prep can't run here) SKIPS with a reason; a genuine value mismatch FAILS.
    Note: this hits the network and downloads several UCI archives, so it is slow.
    """

    def test_matches_his_prep_data(self):
        for ds, (fname, fn, target) in DATASETS.items():
            with self.subTest(dataset=ds):
                try:
                    mod = _load_repo_prep(REPO_DIR[ds])
                except Exception as e:  # noqa: BLE001 - fetch problem
                    self.skipTest(f"cannot fetch prep.py ({type(e).__name__}: {e})")

                with tempfile.TemporaryDirectory() as tmp:
                    if ds in LOCAL_RAW:
                        src, expected = LOCAL_RAW[ds]
                        if not os.path.exists(src):
                            self.skipTest(f"local raw missing ({src})")
                        shutil.copy(src, os.path.join(tmp, expected))
                    try:
                        with _chdir(tmp):
                            his_base = _run_prep(mod, binned=False)
                            his_binned = _run_prep(mod, binned=True)
                    except Exception as e:  # noqa: BLE001 - download / deps / schema
                        self.skipTest(f"his prep_data() did not run here ({type(e).__name__}: {e})")

                his_binned = his_binned.rename(columns={target: "class"})
                mine = fn(read_ondisk(fname).copy()) if ds == "theorem" else fn(his_base.copy())
                assert_same(mine, his_binned)


if __name__ == "__main__":
    unittest.main(verbosity=2)
