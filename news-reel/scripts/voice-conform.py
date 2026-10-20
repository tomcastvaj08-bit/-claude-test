#!/usr/bin/env python3
"""Conform a new voiceover take to the timing of the one the video was rendered with (swap the voice
without re-rendering): every word of the new take is time-stretched (rubberband, formants kept) so it
starts exactly where the same word starts in build/words.json. Pauses are stretched along with the words.

  voice-conform.py <episode> <new.mp3> <new.words.json (Scribe)> [--out build/voice.mp3]
"""
import json, os, subprocess, sys, tempfile, unicodedata, re

ep, src, wj = sys.argv[1:4]
out = sys.argv[sys.argv.index("--out") + 1] if "--out" in sys.argv else os.path.join(ep, "build", "voice.mp3")
old = json.load(open(os.path.join(ep, "build", "words.json")))
norm = lambda s: re.sub(r"[^\w]", "", unicodedata.normalize("NFC", s.lower()))
ow = [w for w in old["words"] if norm(w["text"])]
def spoken(ws):  # drop audio tags ([whispering, playful] can span several "words")
    out, inside = [], False
    for w in ws:
        t = w["text"]
        if t.startswith("["): inside = True
        if not inside and w.get("type", "word") == "word" and norm(t): out.append(w)
        if t.endswith("]"): inside = False
    return out
nw = spoken(json.load(open(wj))["words"])
# --loose: same word count is enough (phonetic respellings like "karusely" for "carousely")
if (len(ow) != len(nw)) if "--loose" in sys.argv else ([norm(w["text"]) for w in ow] != [norm(w["text"]) for w in nw]):
    sys.exit("word lists differ:\n" + " ".join(w["text"] for w in ow) + "\n" + " ".join(w["text"] for w in nw))
def onset(f, db=-38):
    """first 10 ms window above `db` dBFS: Scribe often places the first word late (an audio tag at the start
    of the prompt swallows its timing), and anchoring there would clip the word's beginning"""
    import numpy as np
    x = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", f, "-ac", "1", "-ar", "16000", "-f", "f32le", "-"],
                                     capture_output=True, check=True).stdout, np.float32)
    w = x[: len(x) // 160 * 160].reshape(-1, 160)
    loud = np.nonzero(20 * np.log10(np.sqrt((w * w).mean(1)) + 1e-9) > db)[0]
    return max(0.0, loud[0] * 0.01 - 0.02) if len(loud) else 0.0
ref = sys.argv[sys.argv.index("--ref") + 1] if "--ref" in sys.argv else None  # the voice the video was timed to
# anchors: (new time, old time); segment i = [anchor i, anchor i+1)
A = [(min(onset(src), nw[0]["start"]), min(onset(ref), ow[0]["start"]) if ref else max(0, ow[0]["start"] - 0.03))]
A += [(n["start"], o["start"]) for n, o in zip(nw[1:], ow[1:])]
A += [(nw[-1]["end"] + 0.15, ow[-1]["end"] + 0.15)]
tmp = tempfile.mkdtemp()
parts = []
for i, ((n0, o0), (n1, o1)) in enumerate(zip(A, A[1:])):
    tempo = max(0.5, min(2.5, (n1 - n0) / max(0.02, o1 - o0)))
    p = os.path.join(tmp, f"s{i:03d}.wav")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-af",
                    f"atrim={n0:.3f}:{n1:.3f},asetpts=PTS-STARTPTS,aresample=48000,rubberband=tempo={tempo:.4f}:pitchq=quality:formant=preserved,"
                    f"apad,atrim=0:{o1 - o0:.3f}", "-ac", "1", "-ar", "48000", p], check=True)
    parts.append(p)
lst = os.path.join(tmp, "l.txt"); open(lst, "w").write("".join(f"file '{p}'\n" for p in parts))
lead = A[0][1]
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst, "-af",
                f"adelay={int(lead * 1000)},apad,atrim=0:{old['duration']:.3f}", "-ar", "48000", "-b:a", "256k", out], check=True)
print(f"conformed {len(parts)} segments -> {out} ({old['duration']:.2f}s)")
