"""Procedural sound design for the spotlight kinetic reel (no samples needed).
Every event is placed on a source-frame number (30 fps, F1 = 0.0 s) so it locks
to the picture.  Usage: python3 sound_design.py OUT.wav [frames=223]"""
import sys, numpy as np, wave

SR = 44100
NF = int(sys.argv[2]) if len(sys.argv) > 2 else 223
DUR = NF / 30 + 0.12
N = int(DUR * SR)
L = np.zeros(N); R = np.zeros(N)
rng = np.random.default_rng(7)
t_all = np.arange(N) / SR

def at(F): return (F - 1) / 30.0
def db(x): return 10 ** (x / 20)

def place(sig, F, gain_db=0.0, pan=0.0):
    i = int(at(F) * SR)
    if i >= N: return
    sig = sig[: N - i] * db(gain_db)
    k = min(len(sig), int(0.03 * SR)); sig = sig.copy(); sig[-k:] *= np.linspace(1, 0, k) ** 2   # de-click tail
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    L[i:i + len(sig)] += sig * l * 1.41; R[i:i + len(sig)] += sig * r * 1.41

def onepole_lp(x, fc):
    a = np.exp(-2 * np.pi * fc / SR); y = np.zeros_like(x); s = 0.0
    for k in range(len(x)):
        s = (1 - a) * x[k] + a * s; y[k] = s
    return y

def bandnoise(n, f_lo, f_hi):
    """noise band-limited in the frequency domain; f_lo/f_hi may be arrays (sweep) -> use mean"""
    x = rng.standard_normal(n); X = np.fft.rfft(x); fr = np.fft.rfftfreq(n, 1 / SR)
    X[(fr < f_lo) | (fr > f_hi)] = 0
    y = np.fft.irfft(X, n); return y / (np.abs(y).max() + 1e-9)

def sweep_noise(n, f0, f1, q=0.6):
    """noise through a moving band (STFT-ish, 20 chunks)"""
    # overlap-add of hann-windowed, individually filtered noise grains (no seams)
    hop = 1024; win = 2048; out = np.zeros(n + win); base = rng.standard_normal(n + win)
    w = np.hanning(win); fr = np.fft.rfftfreq(win, 1 / SR)
    for a in range(0, n, hop):
        fc = f0 * (f1 / f0) ** (a / max(1, n - 1))
        X = np.fft.rfft(base[a:a + win] * w)
        X *= np.exp(-((np.log(fr + 1) - np.log(fc)) ** 2) / (2 * q ** 2))
        out[a:a + win] += np.fft.irfft(X, win)
    out = out[:n]
    return out / (np.abs(out).max() + 1e-9)

def env(n, att, rel, shape=2.0):
    t = np.arange(n) / SR; e = np.minimum(1, t / max(att, 1e-4)) * np.exp(-np.maximum(0, t - att) / max(rel, 1e-4))
    return e ** (shape / 2)

def swell(n, peak_at=0.8):
    t = np.linspace(0, 1, n); e = np.where(t < peak_at, (t / peak_at) ** 2.2, np.exp(-(t - peak_at) / (1 - peak_at) * 4))
    return e

def whoosh(dur, f0, f1, peak=0.7):
    n = int(dur * SR); return sweep_noise(n, f0, f1) * swell(n, peak)

def click(f=3200, dur=0.012):
    n = int(dur * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * t) * 0.6 + rng.standard_normal(n) * 0.4) * np.exp(-t / (dur / 5))

def blip(f0, f1, dur):
    n = int(dur * SR); t = np.arange(n) / SR; f = f0 * (f1 / f0) ** (t / dur)
    ph = 2 * np.pi * np.cumsum(f) / SR; return np.sin(ph) * env(n, 0.002, dur / 4)

def kick(f0=120, f1=42, dur=0.9, drive=1.6):
    n = int(dur * SR); t = np.arange(n) / SR; f = f1 + (f0 - f1) * np.exp(-t / 0.045)
    ph = 2 * np.pi * np.cumsum(f) / SR; y = np.sin(ph) * np.exp(-t / (dur / 3.2))
    return np.tanh(y * drive) / np.tanh(drive)

def impact(dur=1.1):
    k = kick(150, 38, dur, 2.2)
    n = len(k); nz = bandnoise(n, 60, 3000) * env(n, 0.001, 0.06)
    return k * 0.9 + nz * 0.35

def pad(dur, freqs, gain):
    n = int(dur * SR); t = np.arange(n) / SR; y = np.zeros(n)
    for i, f in enumerate(freqs):
        for d in (-0.35, 0.0, 0.4):
            y += np.sin(2 * np.pi * (f + d) * t + i) * (0.9 if d == 0 else 0.5)
    y /= np.abs(y).max(); fade = np.minimum(1, t / 0.6) * np.minimum(1, (dur - t) / 0.8)
    return y * fade * db(gain)

def glitch(dur):
    n = int(dur * SR); y = np.zeros(n); i = 0
    while i < n:
        seg = int(rng.uniform(0.006, 0.03) * SR); f = rng.choice([400, 800, 1600, 3100, 5200])
        tt = np.arange(min(seg, n - i)) / SR
        y[i:i + len(tt)] = np.sign(np.sin(2 * np.pi * f * tt)) * rng.uniform(0.2, 1) * (rng.random() > 0.3)
        i += seg
    return onepole_lp(y, 6000) * env(n, 0.005, dur / 2.5, 1)

# ---------------- bed ----------------
bed = pad(DUR, [55, 82.4, 110, 164.8, 220], -30)
bed = onepole_lp(bed, 900)
L += bed; R += bed
air = bandnoise(N, 2000, 9000) * db(-48); L += air; R += air[::-1]

# ---------------- scene A ----------------
place(whoosh(0.32, 3000, 400, 0.15), 1, -10)                       # zoom-out arrival
place(kick(90, 40, 0.5, 1.2), 1, -12)
place(whoosh(0.55, 6000, 1500, 0.55), 2, -16, 0.5)                  # comet flies across
for F, p in [(7.5, -.4), (9.1, -.2), (10.7, 0), (12.3, .2), (13.9, .4)]:   # loader squares
    place(click(2600 + 300 * p, 0.018), F, -14, p); place(blip(1300, 1900, 0.05), F, -24, p)
for i, F in enumerate(np.linspace(10.6, 15.8, 10)):                  # letters typed
    place(click(4200 + 200 * (i % 3), 0.008), F, -24, -0.2 + 0.04 * i)
for i, F in enumerate([22, 23.5, 25, 26.5, 28]):                       # squares vanish
    place(blip(1800, 900, 0.045), F, -22, -0.4 + 0.2 * i)
place(whoosh(0.28, 600, 4000, 0.85), 19, -10)                        # "price." slam build
place(impact(0.7), 27.5, -6)
place(sweep_noise(int(0.3 * SR), 5000, 9000) * env(int(0.3 * SR), 0.03, 0.12), 28, -22, -0.3)   # pen scribble
place(blip(2200, 2600, 0.12) * 0.6, 33, -24, 0.4)                    # "on" sparkle
place(whoosh(0.9, 1200, 3500, 0.3), 35, -26, 0.6)                    # plane glides
place(whoosh(0.6, 2500, 900, 0.5), 60, -30, 0.3)
# riser into the morph
n = int(0.5 * SR); tt = np.arange(n) / SR
riser = (sweep_noise(n, 300, 6000) * 0.7 + np.sin(2 * np.pi * np.cumsum(200 * (8 ** (tt / 0.5))) / SR) * 0.3) * (tt / 0.5) ** 2.5
place(riser, 73, -10)
place(click(3500, 0.02), 80, -12, 0.2)                                # plane docks on the pill
place(click(2000, 0.03), 88, -10)
place(glitch(0.22), 91, -16)
place(whoosh(0.3, 5000, 700, 0.3), 92, -10)                           # card collapses
place(blip(700, 1400, 0.09), 96.5, -14, 0.1)                          # badge pop
place(impact(1.2), 97, -3)                                            # "value." drop
place(whoosh(0.45, 900, 3000, 0.4), 95, -16, -0.3)                    # ring drawn
place(whoosh(0.5, 800, 4500, 0.7), 121, -16, 0.4)                     # words slide out
place(sweep_noise(int(0.35 * SR), 3000, 8000) * swell(int(0.35 * SR), 0.6), 126, -20, 0.6)
place(blip(1200, 500, 0.08), 135.5, -22)                              # badge -> dot

# ---------------- scene B ----------------
place(whoosh(0.32, 7000, 1500, 0.55), 132, -9)                        # whip into "show"
place(kick(110, 45, 0.45, 1.4), 139, -12)
place(sweep_noise(int(0.6 * SR), 2500, 6000) * env(int(0.6 * SR), 0.02, 0.25), 139, -22, 0.3)
place(click(5000, 0.01), 157, -22, 0.3); place(click(1200, 0.02), 160, -20, -0.2)

# ---------------- scene C ----------------
place(whoosh(0.4, 500, 6000, 0.9), 168, -12)                          # build to the cut
place(impact(0.9), 180, -6)
place(whoosh(0.4, 4000, 800, 0.2), 180, -16)
for i, F in enumerate([186, 188, 190]):                               # thought bubbles pop in
    place(blip(900 - 150 * i, 450, 0.09), F, -20, -0.5 + 0.1 * i)

# master: gentle glue + limiter, fades
mix = np.stack([L, R], 1)
mix *= np.minimum(1, t_all / 0.01)[:, None] * np.minimum(1, (DUR - t_all) / 0.25)[:, None]
pk = np.abs(mix).max(); mix = np.tanh(mix / pk * 1.6) / np.tanh(1.6) * db(-1.0)
w = wave.open(sys.argv[1], 'w'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
w.writeframes((mix * 32767).astype(np.int16).tobytes()); w.close()
print('wrote', sys.argv[1], round(DUR, 2), 's')
