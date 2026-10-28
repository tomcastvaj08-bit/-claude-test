"""Náhradní knihovna zvuků a hudby, když není po ruce ~/Desktop/SFX AI final (cloud).

Vyrobí syntetické whooshe, swishe, UI kliky, swell, boom a klidný pad se stejnými názvy, jaké čte tools/bed.py.
python tools/synth_lib.py  ->  build/sfxlib/  (project.json "sfx_lib": "build/sfxlib", "music": ["pad"])
"""
import subprocess
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
LIB = ROOT / "build/sfxlib"
SR = 48000
rng = np.random.default_rng(7)


def save(rel, a):
    p = LIB / rel; p.parent.mkdir(parents=True, exist_ok=True)
    a = np.asarray(a, np.float32)
    if a.ndim == 1: a = np.stack([a, a], 1)
    a = a / max(1e-6, np.abs(a).max()) * .9
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ac", "2", "-ar", str(SR), "-i", "-", str(p)], input=a.tobytes(), check=True)


def lp(x, fc):
    """Jednopólová dolní propust s proměnnou frekvencí (fc pole nebo číslo)."""
    fc = np.broadcast_to(np.asarray(fc, np.float32), x.shape)
    k = 1 - np.exp(-2 * np.pi * fc / SR)
    y = np.empty_like(x); s = 0.0
    for i in range(len(x)): s += k[i] * (x[i] - s); y[i] = s
    return y


def whoosh(dur, f0, f1, peak=.5, sharp=2.0):
    n = int(dur * SR); t = np.linspace(0, 1, n)
    env = np.where(t < peak, (t / peak) ** sharp, ((1 - t) / (1 - peak)) ** 1.5)
    fc = f0 + (f1 - f0) * np.sin(np.pi * np.clip(t / peak, 0, 1) / 2) * (t < peak) + f1 * (t >= peak) * (1 - (t - peak) / (1 - peak)) ** 2
    noise = rng.standard_normal(n).astype(np.float32)
    x = lp(noise, np.maximum(80, fc)) - lp(noise, np.maximum(40, fc * .25)) * .6
    pan = np.sin(np.pi * t) * .35
    return np.stack([x * env * (1 - pan), x * env * (1 + pan)], 1)


def click(f, dur=.06, noise=.3):
    n = int(dur * SR); t = np.arange(n) / SR
    x = np.sin(2 * np.pi * f * t) * np.exp(-t * 90) + rng.standard_normal(n) * noise * np.exp(-t * 400)
    return x


def boom(dur=4.0):
    n = int(dur * SR); t = np.arange(n) / SR
    f = 55 * np.exp(-t * .6) + 30
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.1)
    x += lp(rng.standard_normal(n).astype(np.float32), 300) * np.exp(-t * 2.5) * 2
    return x


def pad(dur=96.0, bpm_bar=4.0):
    """Klidný pad Am–F–C–G, rozladěné siny, pomalá obálka, tlumené výšky."""
    chords = [[57, 60, 64, 69], [53, 57, 60, 65], [48, 55, 60, 64], [55, 59, 62, 67]]
    n = int(dur * SR); t = np.arange(n) / SR; out = np.zeros((n, 2), np.float32)
    bar = int(bpm_bar * SR)
    for b in range(int(np.ceil(n / bar))):
        a0 = b * bar; m = min(n, a0 + bar + SR) - a0
        tt = np.arange(m) / SR; env = np.minimum(1, tt / 1.2) * np.minimum(1, (m / SR - tt) / 1.0)
        for k, note in enumerate(chords[b % 4]):
            f = 440 * 2 ** ((note - 69) / 12)
            for det, side in ((-.15, 0), (.15, 1)):
                out[a0:a0 + m, side] += (np.sin(2 * np.pi * (f + det) * tt + k) + .3 * np.sin(4 * np.pi * (f + det) * tt)) * env * (.5 if k else .8)
        sub = 440 * 2 ** ((chords[b % 4][0] - 12 - 69) / 12)
        out[a0:a0 + m] += (np.sin(2 * np.pi * sub * tt) * env * .6)[:, None]
    for c in range(2): out[:, c] = lp(out[:, c], 1800)
    out *= (1 + .08 * np.sin(2 * np.pi * .13 * t))[:, None]
    return out


def main():
    save("01_whoosh_swish/whoosh_noise_swell.wav", whoosh(2.2, 200, 4500, .6))
    save("01_whoosh_swish/cinematic_woosh.wav", whoosh(1.8, 150, 3800, .5))
    save("01_whoosh_swish/woosh_short.wav", whoosh(.55, 400, 6000, .45, 1.5))
    save("01_whoosh_swish/whoosh_low_short.wav", whoosh(.6, 120, 1800, .45, 1.5))
    for i in range(1, 7): save(f"01_whoosh_swish/whoosh_action_swish_hw_0{i}.wav", whoosh(.4 + .05 * i, 500 + 80 * i, 5000 + 300 * i, .4, 1.3))
    save("01_whoosh_swish/whoosh_slow_swell.wav", whoosh(5.5, 100, 3000, .8, 2.5))
    save("04_digital_UI/ui_select_01.wav", click(1800)); save("04_digital_UI/ui_select_02.wav", click(2200))
    save("04_digital_UI/ui_select_03.wav", click(1500)); save("04_digital_UI/ui_hand_pop_diminished_01.wav", click(900, .09, .15))
    save("05_click_shutter/tick_soft.wav", click(3000, .04, .5))
    save("03_impact_hit/boom_tail_long.wav", boom())
    save("_downloads/music_synth/pad.wav", pad())
    print("lib ->", LIB)


if __name__ == "__main__":
    main()
