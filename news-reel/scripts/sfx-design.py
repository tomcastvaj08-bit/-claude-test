#!/usr/bin/env python3
"""Designed (synthesised) sound layers for the cold opens – the "editorial" layer a sound designer builds on
top of foley/ambience, cut to the frame. Nothing here is AI: noise + oscillators shaped like the real thing.

  whoosh = sub + mid body + high air, band-pass swept with the motion, peak at a known time (place it on the cut)
  hit    = transient click (attack) + pitch-dropping body + short room tail
  sub    = 58→32 Hz drop WITH its 2nd/3rd harmonics, so the weight still reads on a phone speaker
  riser  = reverse-swell (noise opening up), cut dead at the end -> sucks the ear into the next shot
  tension= low drone under the realisation (beating fifths + dark air)
Each file's "peak" (the moment that must sit on the picture event) is written to assets/sfx/designed/peaks.json.
"""
import json, os
import numpy as np
from scipy import signal

SR = 48000
OUT = os.path.join(os.path.dirname(__file__), "..", "assets", "sfx", "designed")
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(7)
peaks = {}

def pink(n):
    w = rng.standard_normal(n)
    b, a = [0.049922035, -0.095993537, 0.050612699, -0.004408786], [1, -2.494956002, 2.017265875, -0.522189400]
    return signal.lfilter(b, a, w)

def sweep_bp(x, fcurve, q=1.2):
    """band-pass whose centre follows fcurve(u), u = 0..1 over the sound (STFT mask, log-gaussian band)"""
    f, tt, Z = signal.stft(x, SR, nperseg=1024, noverlap=768)
    u = tt / (len(x) / SR)
    fc = np.array([fcurve(min(1.0, v)) for v in u])
    lf = np.log2(np.maximum(f, 20))[:, None]
    mask = np.exp(-0.5 * ((lf - np.log2(fc)[None, :]) * q * 1.6) ** 2)
    _, y = signal.istft(Z * mask, SR, nperseg=1024, noverlap=768)
    return y[: len(x)] if len(y) >= len(x) else np.pad(y, (0, len(x) - len(y)))

def norm(x, peak_db=-1.0):
    return x / (np.abs(x).max() + 1e-9) * 10 ** (peak_db / 20)

def stereo(m, pan_from=0.0, pan_to=0.0):
    p = np.linspace(pan_from, pan_to, len(m))
    l, r = np.cos((p + 1) * np.pi / 4), np.sin((p + 1) * np.pi / 4)
    return np.stack([m * l, m * r], 1)

def save(name, x, peak):
    x = x if x.ndim == 2 else stereo(x)
    x = x / (np.abs(x).max() + 1e-9) * 10 ** (-1 / 20)
    import wave
    with wave.open(os.path.join(OUT, name + ".wav"), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype("<i2").tobytes())
    peaks[name] = round(peak, 3)

def env_ar(n, peak_at, a_pow=2.2, r_pow=1.6):
    t = np.linspace(0, 1, n); p = peak_at
    return np.where(t < p, (t / p) ** a_pow, ((1 - t) / (1 - p)) ** r_pow)

def whoosh(dur, peak, f_lo, f_hi, f_end, body=0.55, air=0.35, pan=(0, 0)):
    n = int(dur * SR); pk = peak / dur
    x = pink(n)
    curve = lambda u: f_lo + (f_hi - f_lo) * (u / pk) ** 1.5 if u < pk else f_hi + (f_end - f_hi) * ((u - pk) / (1 - pk)) ** 0.7
    mid = sweep_bp(x, curve, q=1.4)
    lo = signal.sosfilt(signal.butter(2, 180, "low", fs=SR, output="sos"), pink(n))
    hi = signal.sosfilt(signal.butter(2, 5000, "high", fs=SR, output="sos"), rng.standard_normal(n))
    e = env_ar(n, pk)
    m = norm(mid) * e + norm(lo) * body * env_ar(n, pk, 1.6, 2.2) + norm(hi) * air * env_ar(n, pk, 3.0, 3.0)
    return stereo(m, *pan)

# short cut whoosh (room <-> insert): peak at 0.26 s -> place at cut - 0.26
save("d_whoosh_s", whoosh(0.5, 0.26, 350, 2600, 900, body=0.45, air=0.3, pan=(-0.35, 0.35)), 0.26)
# heavier swish into the shock shot
save("d_whoosh_m", whoosh(0.6, 0.34, 220, 1800, 500, body=0.8, air=0.25, pan=(0.3, -0.2)), 0.34)
# closing camera pan: doppler-ish whoosh travelling L -> R, peak when the pan is fastest
save("d_whoosh_pan", whoosh(0.8, 0.52, 260, 3200, 600, body=0.7, air=0.45, pan=(-0.8, 0.85)), 0.52)

# hit: click + pitch-drop body + noise thud + short tail
n = int(1.1 * SR); t = np.arange(n) / SR
click = rng.standard_normal(n) * np.exp(-t / 0.0025)
click = signal.sosfilt(signal.butter(2, 2500, "high", fs=SR, output="sos"), click)
f = 120 * np.exp(-t / 0.06) + 55
body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.13)
body = np.tanh(body * 2.2)
thud = signal.sosfilt(signal.butter(2, 700, "low", fs=SR, output="sos"), rng.standard_normal(n)) * np.exp(-t / 0.05)
tail = signal.sosfilt(signal.butter(2, [300, 2400], "band", fs=SR, output="sos"), rng.standard_normal(n)) * np.exp(-t / 0.28) * (1 - np.exp(-t / 0.02))
save("d_hit", norm(click) * 0.55 + norm(body) * 1.0 + norm(thud) * 0.6 + norm(tail) * 0.12, 0.0)

# sub drop with harmonics (translates on phone speakers)
n = int(1.2 * SR); t = np.arange(n) / SR
f = 32 + 26 * np.exp(-t / 0.25)
ph = 2 * np.pi * np.cumsum(f) / SR
sub = (np.sin(ph) + 0.45 * np.sin(2 * ph) + 0.22 * np.sin(3 * ph)) * np.exp(-t / 0.45) * (1 - np.exp(-t / 0.006))
save("d_sub", np.tanh(sub * 1.6), 0.0)

# riser / reverse swell, cut dead at its end (end = the picture event)
n = int(0.9 * SR); u = np.linspace(0, 1, n)
r = sweep_bp(pink(n), lambda v: 300 + 6500 * v ** 2.2, q=0.9) * u ** 3.2
shimmer = signal.sosfilt(signal.butter(2, 6000, "high", fs=SR, output="sos"), rng.standard_normal(n)) * u ** 5
r = norm(r) + norm(shimmer) * 0.35
r[-int(0.004 * SR):] *= np.linspace(1, 0, int(0.004 * SR))
save("d_riser", stereo(r, -0.2, 0.2), 0.9)

# tension drone (A1 + E2, slow beating) with dark air, 6 s, fades in over 0.8 s
n = int(6 * SR); t = np.arange(n) / SR
dr = np.sin(2 * np.pi * 55 * t) + 0.6 * np.sin(2 * np.pi * 55.6 * t) + 0.5 * np.sin(2 * np.pi * 82.4 * t) + 0.25 * np.sin(2 * np.pi * 110.3 * t)
air = signal.sosfilt(signal.butter(2, [120, 900], "band", fs=SR, output="sos"), pink(n)) * 0.6
d = (norm(dr) + norm(air) * 0.5) * np.minimum(1, t / 0.8) * (0.85 + 0.15 * np.sin(2 * np.pi * 0.7 * t))
save("d_tension", stereo(d * 0.9), 0.0)

# phone vibrating on a mattress: 160 Hz motor + soft rattle, two pulses (0.4 s on, 0.15 off, 0.35 on)
n = int(1.0 * SR); t = np.arange(n) / SR
gate = ((t < 0.4) | ((t > 0.55) & (t < 0.9))).astype(float)
gate = np.convolve(gate, np.ones(240) / 240, "same")
mot = np.sin(2 * np.pi * 158 * t + 0.3 * np.sin(2 * np.pi * 9 * t)) + 0.3 * np.sign(np.sin(2 * np.pi * 158 * t))
mot = signal.sosfilt(signal.butter(2, [90, 1400], "band", fs=SR, output="sos"), mot)
save("d_buzz_bed", mot * gate, 0.0)

json.dump(peaks, open(os.path.join(OUT, "peaks.json"), "w"), indent=1)
print(peaks)
