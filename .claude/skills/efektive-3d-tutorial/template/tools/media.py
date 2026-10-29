"""Zdrojové video -> sekvence snímků (přehrávač na plátně), náhledy 1 fps (galerie), zvuk (vložky).

python tools/media.py reel D:/cesta/reel.mp4 [--fps 30] [--width 1280]
Zapíše assets/seq/<name>/f_%04d.jpg, assets/thumbs/<name>_%03d.jpg, assets/audio/<name>.wav a záznam do assets/media.json.
V timeline pak: L.player('reel', {...}), L.frame('reel', 7.6), L.thumb('reel', 3); vložka v project.json: "src": "reel".
"""
import argparse, json, subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def ff(*a):
    subprocess.run(["ffmpeg", "-v", "error", "-y", *a], check=True)


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("name"); ap.add_argument("video")
    ap.add_argument("--fps", type=int, default=30); ap.add_argument("--width", type=int, default=1280); a = ap.parse_args()
    seq, th, au = ROOT / "assets/seq" / a.name, ROOT / "assets/thumbs", ROOT / "assets/audio"
    for d in (seq, th, au): d.mkdir(parents=True, exist_ok=True)
    for f in seq.glob("f_*.jpg"): f.unlink()
    for f in th.glob(f"{a.name}_*.jpg"): f.unlink()
    pr = json.loads(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height:format=duration",
                                    "-of", "json", a.video], capture_output=True, check=True).stdout)
    w, h, dur = pr["streams"][0]["width"], pr["streams"][0]["height"], float(pr["format"]["duration"])
    ff("-i", a.video, "-vf", f"fps={a.fps},scale={a.width}:-2", "-q:v", "3", str(seq / "f_%04d.jpg"))
    ff("-i", a.video, "-vf", "fps=1,scale=480:-2", "-q:v", "4", str(th / f"{a.name}_%03d.jpg"))
    has_audio = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "a", "-show_entries", "stream=index", "-of", "csv=p=0", a.video],
                               capture_output=True, text=True).stdout.strip()
    if has_audio: ff("-i", a.video, "-vn", "-ar", "48000", "-ac", "2", str(au / f"{a.name}.wav"))
    mj = ROOT / "assets/media.json"
    m = json.loads(mj.read_text(encoding="utf-8")) if mj.exists() else {}
    m[a.name] = dict(fps=a.fps, frames=len(list(seq.glob("f_*.jpg"))), thumbs=len(list(th.glob(f"{a.name}_*.jpg"))),
                     dur=round(dur, 3), w=w, h=h, audio=bool(has_audio))
    mj.write_text(json.dumps(m, ensure_ascii=False, indent=1), encoding="utf-8")
    print(a.name, m[a.name])


if __name__ == "__main__":
    main()
