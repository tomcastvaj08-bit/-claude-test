"""Časy náhledových snímků pro kapitolu: python tools/stills.py k02 [offset za cue v s] -> čárkami oddělené časy.
Bere začátek kapitoly + každou cue značku kapitoly (+ offset)."""
import json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
p = json.loads((ROOT / "build/plan.json").read_text(encoding="utf-8"))
ch = sys.argv[1]; off = float(sys.argv[2]) if len(sys.argv) > 2 else 2.5
ts = sorted(v + off for k, v in p["cues"].items() if k == ch or (k.startswith(ch + ".") and not k.endswith(".ins")))
print(",".join(f"{t:.2f}" for t in ts))
