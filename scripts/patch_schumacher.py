"""Regenerate only the `schumacher` block and splice it into the existing
datasets.json (other sources are unchanged, so no need to recompute the slow
feature-selection datasets). Run: python scripts/patch_schumacher.py
"""
import json

import generate_datasets as g  # same dir on sys.path[0] when run as a script

with open(g.OUT_PATH, "r", encoding="utf-8") as f:
    data = json.load(f)

items = []
for ds_id, name, rel_path, fn in g.CATALOG["schumacher"]:
    print(f"  schumacher {ds_id} ...", flush=True)
    items.append(g.describe("schumacher", ds_id, name, rel_path, fn))
data["schumacher"] = items

with open(g.OUT_PATH, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f"patched {len(items)} schumacher datasets in {g.OUT_PATH}")
