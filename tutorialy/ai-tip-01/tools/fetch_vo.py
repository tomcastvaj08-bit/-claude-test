"""Stažení namluvených bloků z ElevenLabs (podepsané URL z creative_get_flow_run_status platí jen 2 h).

python tools/fetch_vo.py build/dl.txt      # řádky: "<blok> <url>", např. "k03 https://storage.googleapis.com/..."
-> build/vo_in/<blok>.mp3 + délka každého bloku
"""
import subprocess, sys, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

out = ROOT / "build/vo_in"; out.mkdir(parents=True, exist_ok=True)
for ln in Path(sys.argv[1]).read_text(encoding="utf-8").split("\n"):
    if not ln.strip(): continue
    name, url = ln.split(None, 1)
    dst = out / f"{name}.mp3"
    urllib.request.urlretrieve(url.strip(), dst)
    d = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(dst)], capture_output=True, text=True).stdout.strip()
    print(f"{name:6s} {float(d):7.2f} s")
