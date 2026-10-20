#!/usr/bin/env python3
"""Bake a board-hook gag clip (AI-animated, FPV camera) into the frame sequence the engine plays.

  hook-gag-frames.py <id> SRC.mp4 --end 4.70 [--twos]
Writes assets/coldopen/v2/hook/<id>/clip/f0001.jpg… (24 fps; with --twos every drawing is held for two frames,
the choppy comic "on twos" look) and updates frames/fps in v2/hook/index.json. The clip's own end frame is the
engine's calendar close-up, so the engine takes over seamlessly (it cross-fades the last 0.25 s into its mark).
"""
import argparse, json, os, subprocess, shutil
ap = argparse.ArgumentParser()
ap.add_argument("id"); ap.add_argument("src")
ap.add_argument("--end", type=float, required=True)
ap.add_argument("--start", type=float, default=0.0)
ap.add_argument("--twos", action="store_true")
a = ap.parse_args()
root = os.path.join(os.path.dirname(__file__), "..", "assets", "coldopen", "v2", "hook")
out = os.path.join(root, a.id, "clip"); shutil.rmtree(out, ignore_errors=True); os.makedirs(out)
tmp = out + "_src"; shutil.rmtree(tmp, ignore_errors=True); os.makedirs(tmp)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(a.start), "-t", str(a.end - a.start), "-i", a.src,
                "-vf", "fps=24,scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080", "-q:v", "3", os.path.join(tmp, "s%04d.jpg")], check=True)
src = sorted(os.listdir(tmp)); n = len(src)
# on twos, but the hold phase restarts at every hard cut of the edit (no frame of the previous shot leaks over)
idx_p0 = os.path.join(root, "index.json")
cutf = sorted({0} | {round(c * 24) for c in json.load(open(idx_p0)).get(a.id, {}).get("cuts", [])})
for i in range(n):
    s0 = max(c for c in cutf if c <= i)
    j = s0 + ((i - s0) // 2) * 2 if a.twos else i
    shutil.copy(os.path.join(tmp, src[min(j, n - 1)]), os.path.join(out, f"f{i + 1:04d}.jpg"))
shutil.rmtree(tmp)
idx_p = os.path.join(root, "index.json"); idx = json.load(open(idx_p))
idx.setdefault(a.id, {}).update({"frames": n, "fps": 24, "src": os.path.basename(a.src), "start": a.start, "end": a.end, "twos": a.twos})
json.dump(idx, open(idx_p, "w"), indent=1, ensure_ascii=False)
print(a.id, n, "frames")
