"""05 DOODLE BOIL  (reel effect 14/17, measured at 12.46-13.65 s of the reference)

Measured at 30 fps (frame 0 = hard cut):
  White rough outline hugging the subject (~10 px outside), redrawn with new wobble every
  3 frames (on threes = 'boil'), small gaps in the stroke.
  f0-f5   heart doodle (pink scribble fill, white outline) + 3 yellow emphasis ticks.
  f2-f4   rectangle draws itself on (stroke reveal).  f6 heart gone.
  f7-f8   clapper lid draws on; f10-f12 lid stripes; f14-f24 pink hatch fill, one stroke/frame.
  f32-f34 a new square doodle starts drawing top-right.
  Every doodle boils on threes too.
"""
import numpy as np, cv2
from PIL import Image, ImageDraw
from fxlib import *

V, V_small = load_clip(25.6, 2.6, 730)      # Thom on the bridge
M = person_masks(V_small)
WHITE, PINK, YEL = (255, 255, 255, 255), (236, 120, 160, 255), (245, 215, 60, 255)


def jit(pts, rng, a=4.0):
    return [(x + rng.uniform(-a, a), y + rng.uniform(-a, a)) for x, y in pts]


def partial(pts, p):
    """first p (0..1) of a polyline, by length."""
    if p >= 1: return pts
    seg = [np.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]) for i in range(len(pts) - 1)]
    goal, acc, out = sum(seg) * p, 0, [pts[0]]
    for i, s in enumerate(seg):
        if acc + s >= goal:
            t = (goal - acc) / max(s, 1e-6)
            out.append((lerp(pts[i][0], pts[i + 1][0], t), lerp(pts[i][1], pts[i + 1][1], t)))
            return out
        acc += s; out.append(pts[i + 1])
    return out


def densify(pts, step=12):
    out = []
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        n = max(1, int(np.hypot(x1 - x0, y1 - y0) / step))
        out += [(lerp(x0, x1, t / n), lerp(y0, y1, t / n)) for t in range(n)]
    return out + [pts[-1]]


def heart(cx, cy, r):
    t = np.linspace(0, 2 * np.pi, 60)
    return [(cx + r * 16 * np.sin(a) ** 3 / 16, cy - r * (13 * np.cos(a) - 5 * np.cos(2 * a) - 2 * np.cos(3 * a) - np.cos(4 * a)) / 16) for a in t]


RECT = densify([(110, 470), (390, 470), (390, 640), (110, 640), (110, 470)])
LID = densify([(105, 455), (385, 400), (370, 345), (95, 400), (105, 455)])
STRIPES = [[(150 + i * 60, 440 - i * 12), (185 + i * 60, 385 - i * 12)] for i in range(4)]
HATCH = [[(140 + i * 24, 490), (128 + i * 24, 625)] for i in range(11)]
SQUARE = densify([(925, 70), (1035, 64), (1041, 172), (931, 177), (925, 70)])


def outline(m, rng):
    b = (m > .5).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(b)
    if n > 1:  # subject only (drop railing / background false positives)
        b = (lab == 1 + np.argmax(st[1:, 4])).astype(np.uint8)
    b = cv2.dilate(b, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (21, 21)))
    cs, _ = cv2.findContours(b, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    lines = []
    for c in cs:
        if cv2.contourArea(c) < 4000: continue
        pts = [tuple(p[0]) for p in c[::7]]
        edge = [x < 6 or y < 6 or x > W - 7 or y > H - 7 for x, y in pts]
        pts = jit(pts, rng, 3.5)
        run = []
        for p, e in zip(pts + pts[:1], edge + edge[:1]):
            if e:  # no stroke along the picture border
                if len(run) > 1: lines.append(run)
                run = []; continue
            if rng.random() < 0.025 and len(run) > 3:   # small gaps in the stroke
                lines.append(run); run = []
            else:
                run.append(p)
        lines.append(run)
    return lines


out = Writer("05_doodle_boil.mp4")
for i in range(len(V)):
    rng = np.random.default_rng(1000 + i // 3)   # boil on threes
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    for run in outline(M[i], rng):
        if len(run) > 1:
            d.line(run, fill=WHITE, width=10, joint="curve")
            d.line(jit(run, rng, 2), fill=(255, 255, 255, 150), width=3)
    if i <= 5:  # heart
        h = jit(heart(860, 560, 70), rng, 3)
        for k in range(9):  # scribble fill
            y = 515 + k * 11
            d.line([(800 + rng.uniform(0, 10), y), (920 - rng.uniform(0, 10), y + 6)], fill=PINK, width=7)
        d.line(h, fill=WHITE, width=6, joint="curve")
        for a in (-40, 0, 40):
            r0, r1 = 95, 130
            ang = np.radians(a - 50)
            d.line(jit([(860 + 60 + r0 * np.cos(ang) * .6, 520 + r0 * np.sin(ang) * .6),
                        (860 + 60 + r1 * np.cos(ang) * .6, 520 + r1 * np.sin(ang) * .6)], rng, 2), fill=YEL, width=6)
    if i >= 14:  # pink hatch fill (under the rect lines)
        for s in HATCH[:min(len(HATCH), i - 13)]:
            d.line(jit(s, rng, 3), fill=PINK, width=9)
    if i >= 2:
        d.line(partial(jit(RECT, rng, 3), clamp01((i - 1) / 3)), fill=WHITE, width=8, joint="curve")
    if i >= 7:
        d.line(partial(jit(LID, rng, 3), clamp01((i - 6) / 2)), fill=WHITE, width=8, joint="curve")
    if i >= 10:
        for s in STRIPES[:min(4, (i - 9) * 2)]:
            d.line(jit(s, rng, 2), fill=WHITE, width=10)
    if i >= 32:
        d.line(partial(jit(SQUARE, rng, 3), clamp01((i - 31) / 3)), fill=WHITE, width=8, joint="curve")
    f = over_rgba(V[i].copy(), np.ascontiguousarray(np.asarray(im)[..., [2, 1, 0, 3]]))
    out.write(counter_pill(f, "05/05"))
out.close()
