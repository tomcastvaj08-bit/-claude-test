#!/usr/bin/env python3
"""Dialogue editing for the cold-open lines: pull up the dead air between phrases (social-media pace).

Silent runs (amplitude envelope < 0.05) longer than --max are cut down to --keep seconds (short crossfades at
the splice), breaths/hmm/gasps stay because they are not silent. Writes voice/<id>_t.wav and replaces the
scene entry in voice/timing.json with re-timed talk/wait/date/env plus "map" (original → new seconds), which
the engine uses so every T.v(original time) cue lands on the tightened line. The original entry is kept
under "<id>_orig" so the script can be re-run with other settings.

  coldopen-tighten.py newspaper laptop … [--max 0.24] [--keep 0.12] [--beat 0.2]
--beat: pause kept right before the "date" line (the comic beat after „Počkej…“).
"""
import argparse, json, os, subprocess
import numpy as np

ROOT = os.path.join(os.path.dirname(__file__), "..", "assets", "coldopen", "voice")
ap = argparse.ArgumentParser()
ap.add_argument("ids", nargs="+")
ap.add_argument("--max", type=float, default=0.24)
ap.add_argument("--keep", type=float, default=0.12)
ap.add_argument("--beat", type=float, default=0.2)
a = ap.parse_args()
TJ = os.path.join(ROOT, "timing.json")
tim = json.load(open(TJ))
SR = 48000

for sid in a.ids:
    src = tim.get(sid + "_orig") or tim[sid]
    tim[sid + "_orig"] = src
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", os.path.join(ROOT, sid + ".mp3"), "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    x = np.frombuffer(pcm, np.float32).reshape(-1, 2)
    env = np.array(src["env"]); fps = 24
    quiet = np.r_[env < 0.05, False]
    # silent runs in seconds, never touching the head/tail of the file
    runs, s = [], None
    for i, q in enumerate(quiet):
        if q and s is None: s = i
        if not q and s is not None:
            runs.append((s / fps, i / fps)); s = None
    cuts = []  # (start, end) of removed audio, original seconds
    for r0, r1 in runs:
        if r0 <= 0.05 or r1 >= src["dur"] - 0.05:
            continue
        keep = a.beat if abs(r1 - src["date"]) < 0.25 else a.keep
        if r1 - r0 > max(a.max, keep):
            m = (r0 + r1) / 2
            cuts.append((m - (r1 - r0 - keep) / 2, m + (r1 - r0 - keep) / 2))
    # splice with 12 ms equal-power crossfades
    xf = int(0.012 * SR); out = []; pos = 0
    for c0, c1 in cuts:
        i0, i1 = int(c0 * SR), int(c1 * SR)
        seg = x[pos:i0 + xf].copy()
        if out:
            w = np.sin(np.linspace(0, np.pi / 2, xf))[:, None]
            out[-1][-xf:] = out[-1][-xf:] * w[::-1] + seg[:xf] * w
            seg = seg[xf:]
        out.append(seg); pos = i1
    seg = x[pos:].copy()
    if out:
        w = np.sin(np.linspace(0, np.pi / 2, xf))[:, None]
        out[-1][-xf:] = out[-1][-xf:] * w[::-1] + seg[:xf] * w
        seg = seg[xf:]
    out.append(seg)
    y = np.concatenate(out)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", os.path.join(ROOT, sid + "_t.wav")],
                   input=y.astype(np.float32).tobytes(), check=True)
    # time map original -> new (piecewise linear; inside a cut everything collapses onto the splice)
    pts = [[0.0, 0.0]]; removed = 0.0
    for c0, c1 in cuts:
        pts.append([round(c0, 4), round(c0 - removed, 4)]); removed += c1 - c0
        pts.append([round(c1, 4), round(c1 - removed, 4)])
    pts.append([src["dur"], round(src["dur"] - removed, 4)])
    mp = lambda t: float(np.interp(t, [p[0] for p in pts], [p[1] for p in pts]))
    new = {k: v for k, v in src.items() if k not in ("env",)}
    new["file"] = sid + "_t"
    new["dur"] = round(mp(src["dur"]), 3)
    new["talk"] = [[round(mp(p), 3), round(mp(q), 3)] for p, q in src["talk"]]
    for k in ("wait", "date", "gasp", "old"):
        if k in src: new[k] = round(mp(src[k]), 3)
    n = int(np.ceil(new["dur"] * fps))
    tn = np.arange(n) / fps
    inv = np.interp(tn, [p[1] for p in pts], [p[0] for p in pts])
    new["env"] = [round(float(np.interp(t * fps, np.arange(len(env)), env)), 2) for t in inv]
    new["map"] = pts
    tim[sid] = new
    print(json.dumps({"id": sid, "dur": [src["dur"], new["dur"]], "cuts": [[round(c0, 2), round(c1, 2)] for c0, c1 in cuts],
                      "wait": new["wait"], "date": new["date"]}))
json.dump(tim, open(TJ, "w"), ensure_ascii=False, separators=(",", ":"))
