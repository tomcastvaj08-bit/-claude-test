"""Kontrolní archy: snímek v každé cue kapitoly (+offset) s titulky hlasu -> out/qa/<kap>/sheet.jpg.
Prohlédni archy PŘED plným renderem: prázdné záběry, useknuté karty, kamera mimo obsah, překryvy.

python tools/qa.py                 # všechny kapitoly, 3 procesy
python tools/qa.py k03 k07 --off 1.5
"""
import argparse, json, subprocess, sys, time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def one(ch, off, delay=0.0):
    time.sleep(delay)                 # Chromium nesnese start několika instancí ve stejné vteřině -> rozestup
    plan = json.loads((ROOT / "build/plan.json").read_text(encoding="utf-8"))
    ts = sorted(v + off for k, v in plan["cues"].items() if k == ch or (k.startswith(ch + ".") and not k.endswith(".ins")))
    d = ROOT / "out/qa" / ch; d.mkdir(parents=True, exist_ok=True)
    for f in d.glob("s_*.png"): f.unlink()
    for attempt in range(3):
        r = subprocess.run([sys.executable, "render.py", "--still", ",".join(f"{t:.2f}" for t in ts), "--subs", "--out", str(d / "s.png")],
                           cwd=ROOT / "engine", capture_output=True, text=True, stdin=subprocess.DEVNULL)
        if not r.returncode: break
        time.sleep(3 + attempt * 3)
    if r.returncode: return f"{ch}: CHYBA {r.stderr[-400:]}"
    subprocess.run([sys.executable, str(ROOT / "tools/sheet.py"), str(d), "4"], capture_output=True)
    return f"{ch}: {len(ts)} snímků -> {d / 'sheet.jpg'}"


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("chapters", nargs="*"); ap.add_argument("--off", type=float, default=2.0)
    ap.add_argument("--jobs", type=int, default=3); a = ap.parse_args()
    plan = json.loads((ROOT / "build/plan.json").read_text(encoding="utf-8"))
    chs = a.chapters or [c["id"] for c in plan["chapters"]]
    with ThreadPoolExecutor(a.jobs) as ex:
        for line in ex.map(lambda ic: one(ic[1], a.off, (ic[0] % a.jobs) * 4.0 if ic[0] < a.jobs else 0), enumerate(chs)): print(line, flush=True)


if __name__ == "__main__":
    main()
