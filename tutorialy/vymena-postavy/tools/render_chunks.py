"""Plný render po úsecích s možností navázat: každý úsek je samostatný proces (pád jednoho nezničí ostatní),
hotové úseky se správným počtem snímků se přeskočí, na konci se slepí do out/video.mp4 (bez zvuku).

python tools/render_chunks.py [--chunk 260] [--jobs 2] [--no-mblur]
Rychlost ~6 fps na proces s motion blurem. 4 procesy naráz už na 16 GB RAM padaly (MemoryError) -> default 2, max 3.
Spouštěj na pozadí (run_in_background), 35 min videa ~ 1,5–2 h.
"""
import argparse, json, subprocess, sys, time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FPS = 30


def frames(p):
    if not p.exists(): return -1
    r = subprocess.run(["ffprobe", "-v", "error", "-count_frames", "-select_streams", "v:0", "-show_entries", "stream=nb_read_frames",
                        "-of", "csv=p=0", str(p)], capture_output=True, text=True)
    try: return int(r.stdout.strip())
    except ValueError: return -1


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--chunk", type=float, default=260); ap.add_argument("--jobs", type=int, default=2)
    ap.add_argument("--no-mblur", action="store_true"); ap.add_argument("--end", type=float, default=None); a = ap.parse_args()
    dur = a.end or json.loads((ROOT / "build/plan.json").read_text(encoding="utf-8"))["duration"]
    F = int(round(dur * FPS)); step = int(a.chunk * FPS)
    parts = [(f0, min(F, f0 + step)) for f0 in range(0, F, step)]
    d = ROOT / "out/chunks"; d.mkdir(parents=True, exist_ok=True)

    def job(i_p):
        i, (f0, f1) = i_p; out = d / f"c{i:03d}.mp4"
        if frames(out) == f1 - f0: return f"c{i:03d} hotovo (přeskočeno)"
        cmd = [sys.executable, "render.py", "--start", f"{f0 / FPS:.4f}", "--end", f"{f1 / FPS:.4f}", "--out", str(out)] + ([] if a.no_mblur else ["--mblur"])
        if i < a.jobs: time.sleep(i * 6)          # Chromium nesnese start několika instancí najednou -> rozestup
        for attempt in range(3):                  # spadlý start prohlížeče zkusit znovu
            with open(d / f"c{i:03d}.log", "w", encoding="utf-8") as log:
                r = subprocess.run(cmd, cwd=ROOT / "engine", stdout=log, stderr=subprocess.STDOUT, stdin=subprocess.DEVNULL)   # bez DEVNULL padá driver v paralelu
            if frames(out) == f1 - f0: break
            time.sleep(5)
        n = frames(out)
        return f"c{i:03d} exit {r.returncode}, snímků {n}/{f1 - f0}" + ("" if n == f1 - f0 else "  <-- CHYBA, spusť znovu (naváže)")

    with ThreadPoolExecutor(a.jobs) as ex:
        res = list(ex.map(job, enumerate(parts)))
    print("\n".join(res))
    if all(frames(d / f"c{i:03d}.mp4") == f1 - f0 for i, (f0, f1) in enumerate(parts)):
        lst = d / "list.txt"; lst.write_text("".join(f"file 'c{i:03d}.mp4'\n" for i in range(len(parts))), encoding="utf-8")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(ROOT / "out/video.mp4")], check=True)
        print("hotovo ->", ROOT / "out/video.mp4", f"({F} snímků)")
    else:
        print("některé úseky chybí – spusť znovu stejný příkaz, hotové se přeskočí"); sys.exit(1)


if __name__ == "__main__":
    main()
