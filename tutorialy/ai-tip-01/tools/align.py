"""Hlas po blocích -> odstavce s časy slov.

1) build/vo_in/<bid>.mp3 zrychlí (atempo) do build/vo_blk/<bid>.wav
2) faster-whisper (large-v3, lokálně) dá časy slov
3) slova bloku (fonetický text) se zarovnají na přepis, blok se rozřízne mezi odstavci
4) zapíše build/vo/<pid>.wav + build/vo/<pid>.json ({duration, words:[{text,start}]}) pro build.py a mix.py

python tools/align.py [--tempo 1.1] [--only k00,k01] [--device cpu]
"""
import argparse, json, re, subprocess

import numpy as np
from pathlib import Path

from build import align_times, norm

ROOT = Path(__file__).resolve().parent.parent
BUILD = ROOT / "build"
SR = 48000
LEAD, TAIL = .06, .18      # kolik ticha nechat před prvním / za posledním slovem odstavce


def ff(*args):
    subprocess.run(["ffmpeg", "-v", "error", "-y", *args], check=True)


def main():
    cfg = json.loads((ROOT / "project.json").read_text(encoding="utf-8"))
    ap = argparse.ArgumentParser(); ap.add_argument("--tempo", type=float, default=cfg.get("tempo", 1.1)); ap.add_argument("--only", default="")
    ap.add_argument("--device", default="cuda"); a = ap.parse_args()
    import os
    try:                              # pip balíčky nvidia-cublas/cudnn: DLL nejsou v PATH, faster-whisper by je nenašel
        import nvidia
        for d in Path(list(nvidia.__path__)[0]).glob("*/bin"): os.add_dll_directory(str(d)); os.environ["PATH"] = str(d) + os.pathsep + os.environ["PATH"]
    except ImportError: pass
    from faster_whisper import WhisperModel
    model = WhisperModel("large-v3", device=a.device, compute_type="int8_float16" if a.device == "cuda" else "int8")
    blocks = json.loads((BUILD / "blocks.json").read_text(encoding="utf-8"))
    (BUILD / "vo_blk").mkdir(exist_ok=True); (BUILD / "vo").mkdir(exist_ok=True)
    only = set(filter(None, a.only.split(",")))
    for b in blocks:
        if only and b["id"] not in only: continue
        src, wav = BUILD / "vo_in" / f"{b['id']}.mp3", BUILD / "vo_blk" / f"{b['id']}.wav"
        ff("-i", str(src), "-af", f"atempo={a.tempo}", "-ar", str(SR), "-ac", "1", str(wav))
        pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", str(wav), "-f", "f32le", "-ac", "1", "-ar", "16000", "-"], capture_output=True, check=True).stdout
        segs, info = model.transcribe(np.frombuffer(pcm, np.float32), language=cfg.get("lang", "cs"), word_timestamps=True, beam_size=5, vad_filter=False,
                                      condition_on_previous_text=False)
        rw, rs, re_ = [], [], []
        for s in segs:
            for w in s.words:
                if norm(w.word): rw.append(w.word.strip()); rs.append(w.start); re_.append(w.end)
        total = info.duration
        paras = (BUILD / "blocks" / f"{b['id']}.txt").read_text(encoding="utf-8").split("\n\n")
        assert len(paras) == len(b["paras"]), (b["id"], len(paras), len(b["paras"]))
        pw = [re.findall(r"\S+", p) for p in paras]
        flat = [w for ws in pw for w in ws]
        st = align_times(flat, rw, rs)
        en = align_times(flat, rw, re_)
        # hranice odstavců: uprostřed mezery mezi koncem posledního a začátkem prvního slova
        idx, k = [], 0
        for ws in pw: idx.append((k, k + len(ws) - 1)); k += len(ws)
        cuts = [0.0]
        for i in range(1, len(pw)):
            e, s = en[idx[i - 1][1]], st[idx[i][0]]
            cuts.append(max(e, min(s, (e + s) / 2)))
        cuts.append(total)
        for i, pid in enumerate(b["paras"]):
            i0, i1 = idx[i]
            a0 = max(cuts[i], st[i0] - LEAD); a1 = min(cuts[i + 1], en[i1] + TAIL)
            if a1 - a0 < .3: a0, a1 = cuts[i], cuts[i + 1]
            ff("-i", str(wav), "-af", f"atrim={a0:.3f}:{a1:.3f},asetpts=PTS-STARTPTS,afade=t=in:d=0.02,afade=t=out:st={max(0, a1 - a0 - .04):.3f}:d=0.04",
               "-ar", str(SR), str(BUILD / "vo" / f"{pid}.wav"))
            d = dict(duration=round(a1 - a0, 3), words=[dict(text=w, start=round(max(0, t - a0), 3)) for w, t in zip(pw[i], st[i0:i1 + 1])])
            (BUILD / "vo" / f"{pid}.json").write_text(json.dumps(d, ensure_ascii=False), encoding="utf-8")
        hit = sum(1 for w in flat if norm(w) in {norm(x) for x in rw})
        print(f"{b['id']:5s} {total:7.2f}s  slov {len(flat):4d}  přepis {len(rw):4d}  shoda {hit / max(1, len(flat)):.0%}", flush=True)


if __name__ == "__main__":
    main()
