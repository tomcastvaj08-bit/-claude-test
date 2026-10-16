"""04 PAPER CUT  (reel effect 13/17, measured at 11.60-12.45 s of the reference)

Measured at 30 fps (frame 0 = hard cut into the collage):
  Static collage: grid paper, blue pencil scribble block, torn yellow paper strip, red hatching,
  black x-marks + loops.  The live subject is a torn cut-out with a white paper border + shadow.
  Ransom-note letters stamp in at f4, f9, f13, f16: each lands at 1.35x / -12 deg with a big
  shadow, 1.08x next frame, settled (own slight tilt) on the 3rd frame.
  f20-f22 a red marker ellipse draws itself around the number (stroke reveal, 3 frames).
  f24+ a second smaller tile word stamps in under it (2 frames apart).
"""
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFilter
from fxlib import *

rng = np.random.default_rng(7)
V, V_small = load_clip(25.6, 2.6, 1255)     # Celia on the bridge
M = person_masks(V_small)
N = len(V)
SHIFT = 380  # reference layout: subject sits in the lower half, running off the bottom edge
V = np.concatenate([np.zeros((N, SHIFT, W, 3), np.uint8), V[:, :H - SHIFT]], 1)
M = np.concatenate([np.zeros((N, SHIFT, W), np.float32), M[:, :H - SHIFT]], 1)


# ------------------------------------------------------------- static collage
def pencil(im, pts, color, width):
    d = ImageDraw.Draw(im)
    d.line(pts, fill=color, width=width, joint="curve")


def scribble_block(im, box, color, rows, amp, width, slant=0.0):
    x0, y0, x1, y1 = box
    for r in range(rows):
        y = y0 + (y1 - y0) * r / rows
        pts, x, up = [], x0 + rng.uniform(-10, 10), True
        while x < x1:
            pts.append((x + slant * (1 if up else -1), y + (0 if up else amp) + rng.uniform(-6, 6)))
            x += rng.uniform(14, 24); up = not up
        pencil(im, pts, color, width)


def torn_poly(box, jag=18, step=22):
    x0, y0, x1, y1 = box
    pts = []
    for x in np.arange(x0, x1, step): pts.append((x, y0 + rng.uniform(-jag, jag)))
    for y in np.arange(y0, y1, step): pts.append((x1 + rng.uniform(-jag, jag), y))
    for x in np.arange(x1, x0, -step): pts.append((x, y1 + rng.uniform(-jag, jag)))
    for y in np.arange(y1, y0, -step): pts.append((x0 + rng.uniform(-jag, jag), y))
    return pts


def build_background():
    bg = Image.new("RGBA", (W, H), (239, 237, 230, 255))
    d = ImageDraw.Draw(bg)
    for x in range(0, W, 44): d.line([(x, 0), (x, H)], fill=(205, 212, 222, 255), width=2)
    for y in range(0, H, 44): d.line([(0, y), (W, y)], fill=(205, 212, 222, 255), width=2)
    # blue pencil scribble block (top)
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    scribble_block(lay, (150, 130, 960, 560), (120, 145, 215, 210), 14, 26, 7, slant=10)
    # yellow torn paper strip (right, middle)
    y = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(y).polygon(torn_poly((430, 880, 1120, 1300)), fill=(244, 228, 104, 255))
    bg.alpha_composite(y.filter(ImageFilter.GaussianBlur(0.8)))
    scribble_block(lay, (680, 930, 1010, 1230), (60, 60, 90, 230), 7, 34, 6, slant=6)
    for i in range(7):  # red ticks
        x = 780 + i * 28
        ImageDraw.Draw(lay).line([(x, 905), (x + 14, 935)], fill=(215, 40, 50, 255), width=6)
    scribble_block(lay, (800, 1330, 1000, 1520), (225, 85, 105, 230), 9, 22, 6, slant=-8)  # red hatch
    dl = ImageDraw.Draw(lay)
    for (cx, cy) in [(120, 640), (160, 610), (930, 1270), (975, 1240)]:  # x marks
        dl.line([(cx - 18, cy - 18), (cx + 18, cy + 18)], fill=(30, 30, 30, 255), width=6)
        dl.line([(cx - 18, cy + 18), (cx + 18, cy - 18)], fill=(30, 30, 30, 255), width=6)
    pts = [(820 + t * 3.2 + 22 * np.cos(t / 3), 1620 + 22 * np.sin(t / 3)) for t in np.arange(0, 60, .3)]
    dl.line(pts, fill=(30, 30, 30, 255), width=5)  # loops
    # pencil grain
    a = np.asarray(lay).copy()
    grain = rng.uniform(.55, 1, a.shape[:2])
    a[..., 3] = (a[..., 3] * grain).astype(np.uint8)
    bg.alpha_composite(Image.fromarray(a))
    return np.ascontiguousarray(np.asarray(bg)[..., [2, 1, 0]])


BG = build_background()
JITTER = cv2.resize(rng.uniform(-1, 1, (H // 40, W // 40)).astype(np.float32), (W, H), interpolation=cv2.INTER_CUBIC)


def cutout_alpha(m):
    """Torn cut-out shape: dilated silhouette with a jagged edge, plus the white border ring."""
    b = (m > .5).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(b)
    if n > 1:
        b = (lab == 1 + np.argmax(st[1:, 4])).astype(np.uint8)
    ys, xs = np.nonzero(b)
    if len(ys):  # torn piece continues down to the bottom edge, as in the reference
        b[int(np.percentile(ys, 90)):, int(np.percentile(xs, 4)):int(np.percentile(xs, 96))] = 1
    dist = cv2.distanceTransform(1 - b, cv2.DIST_L2, 5)
    inner = np.clip(32 + 14 * JITTER - dist, 0, 1)           # photo area
    outer = np.clip(50 + 16 * JITTER - dist, 0, 1)           # incl. white border
    return cv2.GaussianBlur(inner.astype(np.float32), (0, 0), .8), cv2.GaussianBlur(outer.astype(np.float32), (0, 0), .8)


# ------------------------------------------------------------- ransom tiles
def tile(ch, bgc, fg, fnt, size, tilt):
    im = Image.new("RGBA", (size + 60, size + 60), (0, 0, 0, 0))
    t = Image.new("RGBA", (size, int(size * 1.15)), bgc + (255,))
    d = ImageDraw.Draw(t)
    tw = fnt.getlength(ch); asc, desc = fnt.getmetrics()
    d.text(((size - tw) / 2, (size * 1.15 - asc - desc) / 2 - 4), ch, font=fnt, fill=fg + (255,))
    t = t.rotate(tilt, resample=Image.BICUBIC, expand=True)
    im = Image.new("RGBA", (t.width + 60, t.height + 60), (0, 0, 0, 0))
    im.alpha_composite(t, (30, 30))
    return np.ascontiguousarray(np.asarray(im)[..., [2, 1, 0, 3]])


def with_shadow(layer, off, blur, alpha):
    h, w = layer.shape[:2]
    pad = 60
    out = np.zeros((h + 2 * pad, w + 2 * pad, 4), np.uint8)
    sh = np.zeros_like(out); sh[pad + off:pad + off + h, pad + off:pad + off + w, 3] = (layer[..., 3] * alpha).astype(np.uint8)
    sh[..., 3] = cv2.GaussianBlur(sh[..., 3], (0, 0), blur)
    out = sh
    region = out[pad:pad + h, pad:pad + w]
    a = layer[..., 3:4].astype(np.float32) / 255
    region[..., :3] = (layer[..., :3] * a + region[..., :3] * (1 - a)).astype(np.uint8)
    region[..., 3] = np.maximum(region[..., 3], layer[..., 3])
    return out


F_SANS = font(FONT_BLACK, 120)
F_SERIF = font("/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf", 120)
LETTERS = [  # (char, tile bg, fg, font, tilt, x, frame)
    ("1", (40, 70, 200), (255, 255, 255), F_SANS, 4, 150, 4),
    ("0", (215, 215, 210), (20, 20, 20), F_SANS, -3, 300, 9),
    ("0", (250, 250, 248), (205, 30, 40), F_SERIF, 2, 445, 13),
    ("%", (18, 18, 18), (243, 220, 70), F_SANS, -4, 590, 16),
]
TILES = [tile(c, b, f, fn, 130, tl) for c, b, f, fn, tl, _, _ in LETTERS]
F_SMALL = font(FONT_BLACK, 66)
SMALL = [("O", (250, 250, 248), (20, 20, 20), F_SMALL, -5, 330, 24), ("K", (244, 228, 104), (20, 20, 20), F_SMALL, 6, 405, 26)]
STILES = [tile(c, b, f, fn, 72, tl) for c, b, f, fn, tl, _, _ in SMALL]
TY = 290


def stamp(frame, lay, x, y, k):
    # k = frames since landing start
    sc, rot, off, blur = [(1.35, -12, 26, 14), (1.08, -3, 12, 8)][k] if k < 2 else (1.0, 0, 8, 5)
    big = with_shadow(lay, off, blur, .45)
    big = transform_layer(big, sc, angle=rot)
    return place_center(frame, big, x, y)


def ellipse_layer(progress):
    im = Image.new("RGBA", (W, 520), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    cx, cy, rx, ry = 380, 260, 340, 120
    ts = np.linspace(-0.3, -0.3 + 2 * np.pi * 1.08 * progress, max(2, int(180 * progress)))
    pts = [(cx + rx * np.cos(t) * (1 + .03 * np.sin(3 * t)), cy + ry * np.sin(t) + 6 * np.sin(2 * t)) for t in ts]
    d.line(pts, fill=(205, 30, 40, 235), width=11, joint="curve")
    return np.ascontiguousarray(np.asarray(im)[..., [2, 1, 0, 3]])


out = Writer("04_paper_cut.mp4")
for i in range(N):
    inner, outer = cutout_alpha(M[i])
    f = BG.copy()
    sh = np.zeros_like(outer); sh[10:, 8:] = outer[:-10, :-8]
    shadow = cv2.GaussianBlur(sh, (0, 0), 10) * .45
    f = (f.astype(np.float32) * (1 - shadow[..., None])).astype(np.uint8)
    f = over(f, np.full_like(f, 250), outer)            # white paper border
    f = over(f, V[i], inner)                            # live photo
    for (c, b, fg, fn, tl, x, t0), lay in zip(LETTERS, TILES):
        if i >= t0: stamp(f, lay, x + 70, TY, i - t0)
    if i >= 20:
        f = over_rgba(f, ellipse_layer(clamp01((i - 19) / 3)), 0, TY - 260)
    for (c, b, fg, fn, tl, x, t0), lay in zip(SMALL, STILES):
        if i >= t0: stamp(f, lay, x + 40, TY + 160, i - t0)
    out.write(counter_pill(f, "04/05"))
out.close()
