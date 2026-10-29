"""Založí nový tutoriálový projekt ze šablony skillu.

python scripts/new_project.py "C:/Users/tomca/Desktop/tutorialy patreon/muj_tutorial" [--slug Muj_tutorial] [--title "..."] [--empty]
--empty  = bez ukázkových kapitol (k00–k02) a ukázkového scénáře, jen engine, tools a k-layout.js
"""
import argparse, json, shutil
from pathlib import Path

SKILL = Path(__file__).resolve().parent.parent

ap = argparse.ArgumentParser(); ap.add_argument("dest"); ap.add_argument("--slug"); ap.add_argument("--title"); ap.add_argument("--empty", action="store_true")
a = ap.parse_args()
dest = Path(a.dest)
if dest.exists() and any(dest.iterdir()):
    raise SystemExit(f"{dest} už existuje a není prázdná – vyber jinou složku")
shutil.copytree(SKILL / "template", dest, dirs_exist_ok=True)
for d in ("build", "out", "assets/seq", "assets/thumbs", "assets/audio"): (dest / d).mkdir(parents=True, exist_ok=True)
(dest / ".gitignore").write_text("build/\nout/\nassets/seq/\nassets/thumbs/\nassets/audio/\nassets/img/\npodklady/*.html\ncovers/*.jpg\ncovers/*.png\n__pycache__/\n", encoding="utf-8")
if a.empty:
    for f in ("k00.js", "k01.js", "k02.js"): (dest / "timeline" / f).unlink()
    (dest / "scenar.md").write_text("# Scénář: \n\n---\n\n## K00 · Úvod (~1:00)\n\n", encoding="utf-8")
cfg = json.loads((dest / "project.json").read_text(encoding="utf-8"))
if a.slug: cfg["slug"] = a.slug
if a.title: cfg["title"] = a.title
(dest / "project.json").write_text(json.dumps(cfg, ensure_ascii=False, indent=2), encoding="utf-8")
print("projekt:", dest)
