"""Zvuková stopa podle plánu: hlas (build/vo/<pid>.wav, když existuje) + vložky s původním zvukem (assets/audio/<src>.wav).

python tools/mix.py [--end 230] -> build/mix.wav
"""
import argparse, json, subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SR = 48000


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--end", type=float, default=None); ap.add_argument("--out", default=str(ROOT / "build/mix.wav"))
    a = ap.parse_args()
    plan = json.loads((ROOT / "build/plan.json").read_text(encoding="utf-8"))
    end = a.end or plan["duration"]
    src = {k: ROOT / "assets/audio" / f"{k}.wav" for k in {i["src"] for i in plan["inserts"]}}
    inputs, filters = [], []
    for ins in plan["inserts"]:
        if ins["t"] >= end: continue
        i = len(inputs) // 2; inputs += ["-i", str(src[ins["src"]])]
        filters.append(f"[{i}:a]atrim={ins['a']}:{ins['b']},asetpts=PTS-STARTPTS,afade=t=in:d=0.05,afade=t=out:st={ins["b"] - ins["a"] - 0.25:.3f}:d=0.25,"
                       f"adelay={int(ins['t'] * 1000)}|{int(ins['t'] * 1000)}[x{i}]")
    for p in plan["paras"]:
        wav = ROOT / "build/vo" / f"{p['id']}.wav"
        if p["t"] >= end or not wav.exists(): continue
        i = len(inputs) // 2; inputs += ["-i", str(wav)]
        filters.append(f"[{i}:a]aresample={SR},adelay={int(p['t'] * 1000)}|{int(p['t'] * 1000)}[x{i}]")
    n = len(inputs) // 2
    base = f"anullsrc=r={SR}:cl=stereo,atrim=0:{end}[base]"
    mix = "".join(f"[x{i}]" for i in range(n))
    fc = ";".join([base] + filters + [f"[base]{mix}amix=inputs={n + 1}:normalize=0:duration=first[out]"])
    subprocess.run(["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", fc, "-map", "[out]", "-ar", str(SR), a.out], check=True)
    print("mix", a.out, f"{end:.1f}s, vrstev {n}")


if __name__ == "__main__":
    main()
