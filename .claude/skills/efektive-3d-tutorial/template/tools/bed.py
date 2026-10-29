"""Hudební podklad + zvukové efekty podle plánu a událostí enginu.

- hudba: každá kapitola má svou stopu (prolínačka při přeletu kamery), pod hlasem ztlumená, během vložek reelu ticho
- efekty: přelet kapitoly = whoosh, whip kamery = swish, naskočení karty = jemný UI klik, konec = swell + boom
Vstup: build/plan.json, build/events.json (python tools/events.py), knihovna project.json "sfx_lib" (default ~/Desktop/SFX AI final).
Výstup: build/music.wav, build/sfx.wav (48 kHz stereo). Pak python tools/master.py.

python tools/bed.py
"""
import json, subprocess
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
BUILD = ROOT / "build"
CFG = json.loads((ROOT / "project.json").read_text(encoding="utf-8"))
LIB = Path(CFG.get("sfx_lib", "~/Desktop/SFX AI final")).expanduser()
MUS = LIB / "_downloads"
SR = 48000

# stopy s malým rozsahem hlasitosti (LRA <= ~6 LU), integrovaná hlasitost změřená přes loudnorm
TRACKS = {
    "newslike": ("music_liborio_conti/NewsLike-No-Copyright-Music.com-01-NewsLike.mp3", -13.4),
    "timelapse": ("music_liborio_conti/Timelapse-Pack-Free-Royalty-Free-Music-Liborio-Conti-02-Timelapse-No-Clock-Full-Track.mp3", -15.0),
    "exploration": ("music_liborio_conti/Exploration.mp3", -16.3),
    "wonder": ("music_liborio_conti/Wonder-Free-Royalty-Free-Music-by-Liborio-Conti-Free-No-Copyright-Music-01-Wonder-Full-Track.mp3", -16.7),
    "rise": ("music_liborio_conti/On-The-Rise-No-Copyright-Music.com-01-On-The-Rise.mp3", -11.2),
    "harp": ("music_liborio_conti/Storytelling-Essentials-Free-No-Copyright-Music-by-Liborio-Conti-12-Harp-Arpeggio.mp3", -14.2),
    "harppiano": ("music_liborio_conti/Storytelling-Essentials-Free-No-Copyright-Music-by-Liborio-Conti-13-Harp-Arpeggio-With-Piano.mp3", -16.2),
    "pads": ("music_liborio_conti/Storytelling-Essentials-Free-No-Copyright-Music-by-Liborio-Conti-17-Pads.mp3", -13.2),
    "pad": ("music_synth/pad.wav", -10.1),   # z tools/synth_lib.py (cloud bez knihovny)
    "celeste": ("music_liborio_conti/Storytelling-Essentials-Free-No-Copyright-Music-by-Liborio-Conti-18-Celeste.mp3", -15.3),
}
# stopy se po kapitolách střídají v tomhle pořadí (project.json "music" ho může přepsat); když je kapitola delší než stopa, naváže další
ROTATION = CFG.get("music", ["newslike", "timelapse", "exploration", "rise", "wonder", "pads", "celeste", "harppiano", "harp"])
REF_LUFS = -16.0           # stopy srovnané na stejnou hlasitost
MUSIC_OPEN_DB = CFG.get("music_open_db", -9.0)    # když hlas mlčí (přelety)
MUSIC_DUCK_DB = CFG.get("music_duck_db", -19.0)   # pod hlasem (výsledek ~15–17 dB pod hlasem)
XF = 1.6                   # prolínačka mezi kapitolami


def load(path, gain_db=0.0):
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(pcm, np.float32).reshape(-1, 2) * np.float32(10 ** (gain_db / 20))


def write(path, a):
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ac", "2", "-ar", str(SR), "-i", "-", str(path)], stdin=subprocess.PIPE)
    for i in range(0, len(a), SR * 30): p.stdin.write(np.ascontiguousarray(a[i:i + SR * 30]).tobytes())
    p.stdin.close(); p.wait()


def ramp_env(n, segs, lo, hi, att, rel):
    """Obálka (n vzorků po 10 ms): `lo` uvnitř segmentů, jinak `hi`, s náběhem/doběhem."""
    env = np.full(n, hi, np.float32)
    for a, b in segs: env[max(0, int(a * 100)):int(b * 100)] = lo
    out = env.copy()                  # vyhlazení: do ztlumení rychle (att), zpátky pomalu (rel)
    ka, kr = 1 - np.exp(-1 / (att * 100)), 1 - np.exp(-1 / (rel * 100))
    for i in range(1, n):
        k = ka if env[i] < out[i - 1] else kr
        out[i] = out[i - 1] + (env[i] - out[i - 1]) * k
    return out


def merge(segs, gap):
    segs = sorted(segs); out = []
    for a, b in segs:
        if out and a - out[-1][1] < gap: out[-1][1] = max(out[-1][1], b)
        else: out.append([a, b])
    return out


def music(plan):
    dur = plan["duration"]; N = int(dur * SR)
    bed = np.zeros((N, 2), np.float32)
    cache = {}
    def track(k):
        if k not in cache: f, lufs = TRACKS[k]; cache[k] = load(MUS / f, REF_LUFS - lufs)
        return cache[k]
    chs = plan["chapters"]
    for i, ch in enumerate(chs):
        t0 = ch["t"] - XF / 2 if i else 0.0
        t1 = (chs[i + 1]["t"] + XF / 2) if i + 1 < len(chs) else dur
        need = int((t1 - t0) * SR)
        seg = np.zeros((0, 2), np.float32)
        order = [ROTATION[(i + j) % len(ROTATION)] for j in range(len(ROTATION))]
        for k in order:                                 # stopy navazují s prolínačkou, dokud není kapitola pokrytá
            tr = track(k)
            if not len(seg): seg = tr.copy()
            else:
                x = int(2.0 * SR); w = np.linspace(0, 1, x, dtype=np.float32)[:, None]
                seg = np.concatenate([seg[:-x], seg[-x:] * (1 - w) + tr[:x] * w, tr[x:]])
            if len(seg) >= need: break
        seg = seg[:need]
        x = int(XF * SR)
        if i: seg[:x] *= np.linspace(0, 1, x, dtype=np.float32)[:, None]
        if i + 1 < len(chs): seg[-x:] *= np.linspace(1, 0, x, dtype=np.float32)[:, None]
        s = int(t0 * SR); bed[s:s + len(seg)] += seg
    # obálka: ducking pod hlasem, ticho během vložek, fade na konci
    n = int(dur * 100) + 1
    voice = merge([(p["t"] - .15, p["t"] + p["dur"]) for p in plan["paras"]], 1.2)
    duck = ramp_env(n, voice, MUSIC_DUCK_DB, MUSIC_OPEN_DB, .25, .9)
    ins = [(x["t"] - .6, x["t"] + x["dur"] + .3) for x in plan["inserts"]]
    mute = ramp_env(n, ins, -80.0, 0.0, .15, .5)
    end = np.ones(n, np.float32); e0 = int((dur - 6) * 100); end[e0:] = np.linspace(1, 0, n - e0) ** 2
    g = (10 ** ((duck + mute) / 20) * end).astype(np.float32)
    gi = np.interp(np.arange(N) / SR * 100, np.arange(n), g).astype(np.float32)
    bed *= gi[:, None]
    return bed


def sfx(plan, ev):
    dur = plan["duration"]; N = int(dur * SR)
    out = np.zeros((N, 2), np.float32)
    cache = {}
    def put(rel, t, peak_db):
        if rel not in cache:
            a = load(LIB / rel); cache[rel] = a / max(1e-6, np.abs(a).max())
        a = cache[rel] * np.float32(10 ** (peak_db / 20)); s = int(t * SR)
        if s < 0: a, s = a[-s:], 0
        e = min(N, s + len(a)); out[s:e] += a[:e - s]
    ins = [(x["t"], x["t"] + x["dur"]) for x in plan["inserts"]]
    quiet = lambda t: any(a - .2 <= t <= b + .2 for a, b in ins)
    chap = [c["t"] for c in plan["chapters"]]
    shots = sorted(ev["shots"], key=lambda s: s["t"])
    last_end = max(s["t"] for s in shots)
    # 1) přelety kamery: velký pohyb (smooth, >= 1.6 s) = vzdušný whoosh, střídat dva
    big = ["01_whoosh_swish/whoosh_noise_swell.wav", "01_whoosh_swish/cinematic_woosh.wav"]
    whip = ["01_whoosh_swish/woosh_short.wav", "01_whoosh_swish/whoosh_low_short.wav"] + [f"01_whoosh_swish/whoosh_action_swish_hw_0{i}.wav" for i in range(1, 7)]
    used = []
    nb = nw = 0
    for s in shots:
        t = s["t"]
        if t < .5 or quiet(t) or t >= last_end - .01: continue
        if s["ease"] == "smooth" and s["dur"] >= 1.6:
            near_ch = any(abs(t - c) < 2.5 for c in chap)
            put(big[nb % 2], t + .05, -15 if near_ch else -20); nb += 1; used.append(t)
        elif s["ease"] == "whip":
            put(whip[nw % len(whip)], t + .02, -23); nw += 1; used.append(t)
    # 2) karty: ostré uzly (dof:false), které naskočí; max jeden klik za 0.3 s, ne těsně u swishe
    pops = ["04_digital_UI/ui_select_01.wav", "05_click_shutter/tick_soft.wav", "04_digital_UI/ui_select_02.wav", "04_digital_UI/ui_hand_pop_diminished_01.wav", "04_digital_UI/ui_select_03.wav"]
    ts = sorted(n["t"] for n in ev["nodes"] if n.get("dof") is False and n["anim"] in ("pop", "rise", "tilt", "flip", "fly") and n["t"] > .5)
    np_ = 0; prev = -9
    for t in ts:
        if t - prev < .3 or quiet(t) or any(abs(t - u) < .12 for u in used): continue
        put(pops[np_ % len(pops)], t + .03, -27); np_ += 1; prev = t
    # 3) finále: pomalý swell do přehledu mapy a boom pod závěrečnou kartou
    last = plan["chapters"][-1]["id"]
    zo = plan["cues"].get(last + ".zoomout"); endc = plan["cues"].get(last + ".end")
    if zo: put("01_whoosh_swish/whoosh_slow_swell.wav", zo - .2, -14)
    if endc: put("03_impact_hit/boom_tail_long.wav", endc - .35, -12)
    print(f"sfx: přelety {nb}, whipy {nw}, karty {np_}")
    return out


def main():
    plan = json.loads((BUILD / "plan.json").read_text(encoding="utf-8"))
    ev = json.loads((BUILD / "events.json").read_text(encoding="utf-8"))
    write(BUILD / "music.wav", music(plan)); print("music ok")
    write(BUILD / "sfx.wav", sfx(plan, ev)); print("sfx ok")


if __name__ == "__main__":
    main()
