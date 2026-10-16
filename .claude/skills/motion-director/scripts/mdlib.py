"""motion-director library — frame-measured primitives (30 fps).

Frames are RGB uint8 numpy arrays (H, W, 3). Layers are RGBA uint8 (h, w, 4).
Spec references (A1, C4, T2 ...) point to the reference/*.md tables.
"""
import os, subprocess, math
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont, ImageFilter

FPS = 30
HERE = os.path.dirname(os.path.abspath(__file__))
FONTS = os.path.join(HERE, "..", "assets", "fonts")

# ------------------------------------------------------------------ palette
C = dict(
    white=(255, 255, 255), cream=(253, 241, 217), paper=(245, 226, 201), ink=(9, 6, 12),
    red=(252, 69, 60), block_red=(224, 36, 42), dark_red=(122, 14, 18), orange=(242, 106, 21),
    poster_orange=(245, 49, 7), peach=(227, 139, 105), cyan=(106, 229, 206), grid=(47, 168, 160),
    yellow=(243, 236, 120), pink=(232, 70, 110), arc_grey=(184, 175, 168), blue=(8, 29, 245),
    ember_c=(210, 79, 13), ember_e=(107, 30, 4), blood_c=(148, 22, 26), blood_e=(58, 6, 8),
    spot_c=(168, 48, 12), spot_e=(20, 3, 2), void=(2, 0, 1),
)

# ------------------------------------------------------------------ fonts
_ROLE = {
    "base": ("Poppins-SemiBold.ttf", None), "base_med": ("Poppins-Medium.ttf", None),
    "round": ("Poppins-ExtraBold.ttf", None), "bold": ("Poppins-Bold.ttf", None),
    "condensed": ("Anton-Regular.ttf", None), "condensed_thin": ("BebasNeue-Regular.ttf", None),
    "expanded": ("Archivo.ttf", {"wght": 900, "wdth": 125}),
    "serif_it": ("InstrumentSerif-Italic.ttf", None), "serif": ("InstrumentSerif-Regular.ttf", None),
    "pixel": ("Silkscreen-Bold.ttf", None), "lcd": ("VT323-Regular.ttf", None),
    "mono": ("JetBrainsMono.ttf", {"wght": 500}), "ui": ("Inter.ttf", {"wght": 500}),
}
_font_cache = {}


def F(role, size):
    key = (role, int(size))
    if key not in _font_cache:
        fn, axes = _ROLE[role]
        f = ImageFont.truetype(os.path.join(FONTS, fn), int(size))
        if axes:
            names = [a["name"] if isinstance(a["name"], str) else a["name"].decode() for a in f.get_variation_axes()]
            tag = {"Weight": "wght", "Width": "wdth", "Optical size": "opsz"}
            vals = []
            for a, n in zip(f.get_variation_axes(), names):
                t = tag.get(n, n)
                vals.append(axes.get(t, a["default"]))
            f.set_variation_by_axes(vals)
        _font_cache[key] = f
    return _font_cache[key]


# ------------------------------------------------------------------ easing
def clamp01(x): return max(0.0, min(1.0, float(x)))
def lerp(a, b, t): return a + (b - a) * t
def ease_out_cubic(t): t = clamp01(t); return 1 - (1 - t) ** 3
def ease_in_cubic(t): t = clamp01(t); return t ** 3
def ease_out_expo(t): t = clamp01(t); return 1.0 if t >= 1 else 1 - 2 ** (-10 * t)
def ease_in_out_cubic(t): t = clamp01(t); return 4 * t ** 3 if t < .5 else 1 - (-2 * t + 2) ** 3 / 2
def ease_out_back(t, s=1.70158): t = clamp01(t) - 1; return 1 + (s + 1) * t ** 3 + s * t ** 2


# ------------------------------------------------------------------ layers
def text_layer(text, font, fill=C["white"], shadow=True, tracking=0.0, pad=None, alpha=255):
    """RGBA layer; tracking in fraction of font size. Soft shadow per typography.md."""
    size = font.size
    pad = pad if pad is not None else int(size * 0.35) + 12
    tr = tracking * size
    widths = [font.getlength(ch) for ch in text]
    tw = int(sum(widths) + tr * max(0, len(text) - 1)) + 2
    asc, desc = font.getmetrics()
    w, h = tw + 2 * pad, asc + desc + 2 * pad
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    if tr:
        x = pad
        for ch, cw in zip(text, widths):
            d.text((x, pad), ch, font=font, fill=tuple(fill) + (alpha,)); x += cw + tr
    else:
        d.text((pad, pad), text, font=font, fill=tuple(fill) + (alpha,))
    if shadow:
        a = im.split()[3].filter(ImageFilter.GaussianBlur(max(2, size * 0.09)))
        sh = Image.new("RGBA", (w, h), (0, 0, 0, 0)); sh.putalpha(a.point(lambda v: int(v * .55)))
        base = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        base.alpha_composite(sh, (0, max(2, int(size * 0.04)))); base.alpha_composite(im)
        im = base
    return np.asarray(im).copy()


def glyph_layers(text, font, fill=C["white"], shadow=True):
    """Per-character layers + their x offsets (for per-letter animation)."""
    out, x = [], 0.0
    for ch in text:
        if ch == " ":
            x += font.getlength(" "); continue
        L = text_layer(ch, font, fill, shadow)
        out.append((L, x, ch)); x += font.getlength(ch)
    return out, x


def tf(layer, scale=1.0, angle=0.0, blur=0.0, opacity=1.0, skew_x=0.0):
    """Transform an RGBA layer about its centre. skew_x in degrees."""
    out = layer
    h, w = out.shape[:2]
    if scale != 1.0 or angle or skew_x:
        grow = max(1.0, scale) * (1 + abs(math.tan(math.radians(skew_x))) * h / max(w, 1))
        W2, H2 = int(w * grow) + 4, int(h * max(1.0, scale)) + 4
        M = cv2.getRotationMatrix2D((w / 2, h / 2), angle, scale)
        if skew_x:
            S = np.float32([[1, math.tan(math.radians(skew_x)), 0], [0, 1, 0], [0, 0, 1]])
            S[0, 2] = -S[0, 1] * h / 2
            M = (np.vstack([M, [0, 0, 1]]) @ S)[:2]
        M[0, 2] += (W2 - w) / 2; M[1, 2] += (H2 - h) / 2
        out = cv2.warpAffine(out, M.astype(np.float32), (W2, H2), flags=cv2.INTER_LINEAR, borderValue=(0, 0, 0, 0))
    if blur > 0.3:
        k = int(blur * 3) | 1
        pad = k
        out = cv2.copyMakeBorder(out, pad, pad, pad, pad, cv2.BORDER_CONSTANT, value=(0, 0, 0, 0))
        out = cv2.GaussianBlur(out, (0, 0), blur)
    if opacity < 1:
        out = out.copy(); out[..., 3] = (out[..., 3] * clamp01(opacity)).astype(np.uint8)
    return out


def tint(layer, rgb, amount):
    if amount <= 0: return layer
    out = layer.copy().astype(np.float32)
    out[..., :3] = out[..., :3] * (1 - amount) + np.array(rgb, np.float32) * amount
    return out.astype(np.uint8)


def over(dst, layer, x, y):
    """Alpha-composite RGBA layer onto RGB frame with top-left at (x, y). In place."""
    h, w = layer.shape[:2]
    x, y = int(round(x)), int(round(y))
    x0, y0, x1, y1 = max(x, 0), max(y, 0), min(x + w, dst.shape[1]), min(y + h, dst.shape[0])
    if x1 <= x0 or y1 <= y0: return dst
    sub = layer[y0 - y:y1 - y, x0 - x:x1 - x].astype(np.float32)
    a = sub[..., 3:4] / 255
    reg = dst[y0:y1, x0:x1].astype(np.float32)
    dst[y0:y1, x0:x1] = (sub[..., :3] * a + reg * (1 - a)).astype(np.uint8)
    return dst


def place(dst, layer, cx, cy):
    h, w = layer.shape[:2]
    return over(dst, layer, cx - w / 2, cy - h / 2)


def place_left(dst, layer, x, cy):
    """Left edge (minus internal pad) at x, vertical centre at cy."""
    h, w = layer.shape[:2]
    return over(dst, layer, x, cy - h / 2)


def warp_layer_quad(layer, quad, size):
    """Map RGBA layer onto destination quad [(x,y)*4 TL,TR,BR,BL] in a canvas of size (W,H)."""
    h, w = layer.shape[:2]
    src = np.float32([[0, 0], [w, 0], [w, h], [0, h]])
    M = cv2.getPerspectiveTransform(src, np.float32(quad))
    return cv2.warpPerspective(layer, M, size, flags=cv2.INTER_LINEAR, borderValue=(0, 0, 0, 0))


def over_full(dst, layer_full):
    return over(dst, layer_full, 0, 0)


def rgb_split(layer, px):
    if px < 0.5: return layer
    out = layer.copy()
    p = int(round(px))
    r = np.roll(layer, -p, axis=1); b = np.roll(layer, p, axis=1)
    out[..., 0] = r[..., 0]
    out[..., 2] = b[..., 2]
    out[..., 3] = np.maximum(np.maximum(layer[..., 3], r[..., 3]), b[..., 3])
    return out


# ------------------------------------------------------------------ entrance / exit specs
def anim_pop(k):                       # A1
    if k < 0: return None
    return dict(scale=[1.15, 1.04, 1.0][min(k, 2)], opacity=1.0, blur=0.0)


def anim_blur_in(k, frames=3):         # A2
    if k < 0: return None
    e = ease_out_cubic((k + 1) / frames)
    return dict(scale=lerp(1.12, 1.0, e), blur=lerp(14, 0, e), opacity=lerp(.15, 1, e))


def anim_blur_out(k, frames=2):        # X1
    t = clamp01((k + 1) / frames)
    return dict(scale=1.0, blur=lerp(0, 14, t), opacity=lerp(1, 0, t))


def anim_slam(k):                      # A3
    if k < 0: return None
    s = [1.6, 0.96, 0.99, 1.0][min(k, 3)]
    return dict(scale=s, opacity=1.0, blur=[3.0, 0, 0, 0][min(k, 3)], angle=[-3, -1, 0, 0][min(k, 3)])


def anim_counter(k, start, end, frames=14):   # A15
    return int(round(lerp(start, end, ease_out_cubic((k + 1) / frames))))


# ------------------------------------------------------------------ composite text animations
def draw_skew_slide(dst, text, font, x, cy, k, fill=C["white"], dx=120):
    """A4: skew-slide with 3-copy trail + multicolour tint settling over 5 f, per-letter stagger 1 f."""
    glyphs, _ = glyph_layers(text, font, fill)
    tints = [C["pink"], C["cyan"], C["yellow"]]
    for i, (g, gx, ch) in enumerate(glyphs):
        kk = k - i
        if kk < 0: continue
        t = ease_out_expo((kk + 1) / 5)
        off = lerp(dx, 0, t); sk = lerp(-20, 0, t)
        gl = tint(g, tints[i % 3], 0.6 * (1 - t))
        for j, op in enumerate([0.5, 0.25, 0.1]):
            if t < 0.98:
                place_left(dst, tf(gl, skew_x=sk, opacity=op * (1 - t)), x + gx + off + 18 * (j + 1), cy)
        place_left(dst, tf(gl, skew_x=sk), x + gx + off, cy)
    return dst


def draw_letter_drop(dst, text, font, x, cy, k, fill=C["white"]):
    """A5 / C3: letters fall from −80 px, overshoot, pastel → white over 6 f."""
    glyphs, _ = glyph_layers(text, font, fill)
    pastels = [(120, 220, 230), (240, 140, 190), (250, 225, 120), (150, 230, 150)]
    for i, (g, gx, ch) in enumerate(glyphs):
        kk = k - i
        if kk < 0: continue
        t = (kk + 1) / 6
        y = lerp(-80, 0, ease_out_back(t, 2.2))
        gl = tint(g, pastels[i % 4], 0.85 * (1 - clamp01(t)))
        if t < 1:
            place_left(dst, tf(gl, opacity=0.2), x + gx, cy + y - 40)
        place_left(dst, tf(gl, opacity=clamp01(t * 3)), x + gx, cy + y)
    return dst


def draw_typewriter(dst, text, font, x, cy, k, per_char=1.5, fill=C["white"], accent=None,
                    accent_range=None, cursor="block", rng=None):
    """A6 / C5. accent_range=(i0, i1) chars get the red highlight block that grows with them."""
    rng = rng or np.random.default_rng(k)
    n = min(len(text), int(k / per_char) + 1) if k >= 0 else 0
    if n <= 0: return dst
    shown = text[:n]
    asc, desc = font.getmetrics()
    pad = int(font.size * 0.35) + 12
    if accent_range:
        i0, i1 = accent_range
        if n > i0:
            bx0 = x + pad + font.getlength(text[:i0]) - 4
            bx1 = x + pad + font.getlength(text[:min(n, i1)]) + 4
            cv2.rectangle(dst, (int(bx0), int(cy - asc * 0.62)), (int(bx1), int(cy + asc * 0.42)), C["block_red"], -1)
    for i, ch in enumerate(shown):
        if ch == " ": continue
        age = n - 1 - i
        L = text_layer(ch, font, fill, shadow=False)
        ccx = x + pad + font.getlength(text[:i]) + font.getlength(ch) / 2
        ccy = cy - L.shape[0] / 2 + pad + (asc + desc) / 2   # centre of the glyph box
        if age < 2:
            in_accent = accent_range is not None and accent_range[0] <= i < accent_range[1]
            L = tint(L, C["red"], 0.0 if in_accent else 1.0)
            L = tf(L, blur=6 * (1 - age / 2))
        place(dst, L, ccx, ccy)
    end = x + pad + font.getlength(shown)
    if cursor == "block" and n < len(text) + 4:
        cw, chh = int(font.size * 0.55), int(asc * 0.95)
        cv2.rectangle(dst, (int(end + 4), int(cy - chh * 0.65)), (int(end + 4 + cw), int(cy + chh * 0.4)), C["block_red"], -1)
        for _ in range(int(rng.integers(2, 4))):  # pixel flicker squares break off
            s = int(rng.integers(6, 14))
            px, py = end + 4 + rng.uniform(0, cw), cy - chh * 0.65 - rng.uniform(4, 40)
            cv2.rectangle(dst, (int(px), int(py)), (int(px + s), int(py + s)), C["block_red"], -1)
    elif cursor == "underscore":
        cv2.rectangle(dst, (int(end + 6), int(cy + asc * 0.3)), (int(end + 6 + font.size * 0.5), int(cy + asc * 0.3 + max(3, font.size * 0.06))), C["orange"], -1)
    return dst


def draw_binary_decode(dst, word, font, cx, cy, k, color=C["red"], rng=None):
    """A8 / C4: cyan pixel binary → glitch → solid word + pixel sparks."""
    rng = rng or np.random.default_rng(1000 + k)
    if k < 0: return dst
    if k == 0:
        bits = "".join(rng.choice(["0", "1"]) for _ in word)
        place(dst, text_layer(bits, F("pixel", int(font.size * 0.8)), C["cyan"], shadow=False), cx, cy)
        return dst
    if k <= 3:
        mix = "".join(ch if rng.random() < k / 4 else rng.choice(["0", "1"]) for ch in word)
        L = text_layer(mix, font, color, shadow=False)
        L = rgb_split(L, 4)
        h = L.shape[0]
        for _ in range(4):
            y0 = int(rng.integers(0, h - 4)); hh = int(rng.integers(3, max(4, h // 5)))
            L[y0:y0 + hh] = np.roll(L[y0:y0 + hh], int(rng.integers(-12, 12)), axis=1)
        place(dst, L, cx, cy)
        return dst
    place(dst, text_layer(word, font, color), cx, cy)
    kk = k - 4
    if kk < 6:
        r2 = np.random.default_rng(77)
        for i in range(5):
            ang = r2.uniform(-2.6, -0.4); sp = r2.uniform(10, 22); s = int(r2.integers(4, 9))
            px = cx + font.getlength(word) * 0.3 + math.cos(ang) * sp * (kk + 1)
            py = cy + math.sin(ang) * sp * (kk + 1)
            col = tuple(int(v * (1 - kk / 6)) for v in C["cyan"])
            cv2.rectangle(dst, (int(px), int(py)), (int(px + s), int(py + s)), col, -1)
    return dst


def draw_glitch_build(dst, word, font, x, cy, k, fill=C["ink"], rng=None):
    """A9: letters appear 1/f with decaying slice offsets (poster headlines)."""
    n = min(len(word), k + 1)
    if n <= 0: return dst
    L = text_layer(word[:n], font, fill, shadow=False)
    rng = rng or np.random.default_rng(500 + k)
    settle = k - len(word)
    amp = 30 if settle < 0 else (12 if settle == 0 else (4 if settle == 1 else 0))
    if amp:
        h = L.shape[0]
        for _ in range(6):
            y0 = int(rng.integers(0, h - 4)); hh = int(rng.integers(4, max(5, h // 4)))
            L[y0:y0 + hh] = np.roll(L[y0:y0 + hh], int(rng.integers(-amp, amp + 1)), axis=1)
    place_left(dst, L, x, cy)
    return dst


def draw_swing3d(dst, text, font, cx, cy, k, fill=C["white"], frames=5):
    """A7: rotateY 70°→0, scale 2→1, RGB split 10→0."""
    if k < 0: return dst
    t = ease_out_cubic((k + 1) / frames)
    L = text_layer(text, font, fill)
    h, w = L.shape[:2]
    ang = math.radians(lerp(70, 0, t)); s = lerp(2.0, 1.0, t)
    d = 3 * w
    pts = []
    for (u, v) in [(-w / 2, -h / 2), (w / 2, -h / 2), (w / 2, h / 2), (-w / 2, h / 2)]:
        X, Z = u * math.cos(ang), u * math.sin(ang)
        f = d / (d + Z)
        pts.append((cx + X * f * s, cy + v * f * s))
    full = warp_layer_quad(L, pts, (dst.shape[1], dst.shape[0]))
    full = rgb_split(full, lerp(10, 0, t))
    return over(dst, full, 0, 0)


def arc_text(text, font, bend_deg=30, fill=C["arc_grey"], downward=False, k=None, stagger=1, fade=None):
    """D1: word on a circular arc spanning bend_deg. Radius is derived from the word's
    advance width so letter spacing is preserved (arc length == set width).
    k: frames since entrance (letters blur-in L→R, 1 f stagger). fade: X2 progress 0..1."""
    glyphs, total = glyph_layers(text, font, fill, shadow=False)
    span = math.radians(bend_deg)
    radius = total / span
    W = int(radius * 2 + font.size * 2); H = int(radius * (1 - math.cos(span / 2)) + font.size * 2.6)
    canvas = np.zeros((H, W, 4), np.uint8)
    ox = W / 2
    oy = font.size * 1.1 if not downward else H - font.size * 1.1
    for i, (g, gx, ch) in enumerate(glyphs):
        frac = (gx + font.getlength(ch) / 2) / total - 0.5
        a = frac * span
        bright = 0.75 + 0.25 * math.cos(a * 2)
        gg = g.copy(); gg[..., :3] = (gg[..., :3] * bright).astype(np.uint8)
        sc = 1 - 0.08 * abs(frac) * 2
        opacity, blur, rise = 1.0, 0.0, 0.0
        if k is not None:
            kk = k - i * stagger
            if kk < 0: continue
            e = ease_out_cubic((kk + 1) / 4)
            opacity, blur, rise = e, lerp(10, 0, e), lerp(20, 0, e)
        if fade is not None:
            opacity *= 1 - fade; blur += 16 * fade
        px = ox + radius * math.sin(a)
        py = oy + radius * (1 - math.cos(a)) * (1 if not downward else -1)
        rot = -math.degrees(a) if not downward else math.degrees(a)
        L = tf(gg, scale=sc, angle=rot, blur=blur, opacity=opacity)
        place_rgba(canvas, L, px, py + rise)
    return canvas


def place_rgba(dst, L, cx, cy):
    """Composite RGBA onto RGBA (premultiplied-ish 'over')."""
    h, w = L.shape[:2]
    x, y = int(round(cx - w / 2)), int(round(cy - h / 2))
    x0, y0, x1, y1 = max(x, 0), max(y, 0), min(x + w, dst.shape[1]), min(y + h, dst.shape[0])
    if x1 <= x0 or y1 <= y0: return dst
    s = L[y0 - y:y1 - y, x0 - x:x1 - x].astype(np.float32) / 255
    d = dst[y0:y1, x0:x1].astype(np.float32) / 255
    a = s[..., 3:4] + d[..., 3:4] * (1 - s[..., 3:4])
    rgb = (s[..., :3] * s[..., 3:4] + d[..., :3] * d[..., 3:4] * (1 - s[..., 3:4])) / np.maximum(a, 1e-6)
    dst[y0:y1, x0:x1] = (np.concatenate([rgb, a], -1) * 255).astype(np.uint8)
    return dst


def mono_label(text, size, color=C["white"], opacity=0.5):
    return text_layer(text, F("mono", size), color, shadow=False, tracking=0.12, alpha=int(255 * opacity))


# ------------------------------------------------------------------ backgrounds / finish
def radial_bg(W, H, c_in, c_out, cx=0.45, cy=0.45, r=0.8):
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    d = np.sqrt(((xx - cx * W) / W) ** 2 + ((yy - cy * H) / W) ** 2) / r
    t = np.clip(d, 0, 1)[..., None] ** 1.2
    return (np.array(c_in, np.float32) * (1 - t) + np.array(c_out, np.float32) * t).astype(np.uint8)


def vignette(frame, strength=0.5):
    H, W = frame.shape[:2]
    key = (H, W, strength)
    if key not in _vig:
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        d = np.sqrt(((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2) / math.sqrt(2)
        _vig[key] = (1 - strength * d ** 2)[..., None].astype(np.float32)
    return (frame.astype(np.float32) * _vig[key]).clip(0, 255).astype(np.uint8)


_vig = {}


def grain(frame, sigma=5, seed=None):
    rng = np.random.default_rng(seed)
    n = rng.normal(0, sigma, frame.shape[:2]).astype(np.float32)[..., None]
    return (frame.astype(np.float32) + n).clip(0, 255).astype(np.uint8)


def finish(frame, k, vig=0.45, sigma=5):
    """Grain + vignette — apply to every frame (backgrounds.md §Texture)."""
    return grain(vignette(frame, vig), sigma, seed=k)


def embers(frame, k, n=8, seed=3, color=(255, 170, 90)):
    rng = np.random.default_rng(seed)
    H, W = frame.shape[:2]
    for i in range(n):
        x0, y0, sp = rng.uniform(0, W), rng.uniform(0, H), rng.uniform(0.5, 1.2)
        x = (x0 + 6 * math.sin(k / 9 + i)) % W; y = (y0 - sp * k) % H
        a = 0.5 + 0.5 * math.sin(k / 3 + i * 2)
        r = int(rng.integers(2, 4))
        cv2.circle(frame, (int(x), int(y)), r, tuple(int(c * a) for c in color), -1, cv2.LINE_AA)
    return frame


def grid_floor(W, H, horizon=0.62, color=C["grid"], opacity=0.25, spacing=90, k=0, speed=0.0):
    """D8 Void Grid floor on black."""
    fr = np.zeros((H, W, 3), np.uint8); fr[:] = C["void"]
    layer = np.zeros((H, W, 3), np.float32)
    hy = int(H * horizon); vx = W / 2
    for i in range(-30, 31):
        x_bottom = vx + i * spacing * 3.2
        cv2.line(layer, (int(vx + i * spacing * 0.25), hy), (int(x_bottom), H), (1, 1, 1), 2, cv2.LINE_AA)
    off = (k * speed) % 1
    for j in range(1, 40):
        zz = j + off
        y = hy + (H - hy) * (1 / (1 + 6 / zz)) * 1.6
        if y >= H: break
        cv2.line(layer, (0, int(y)), (W, int(y)), (1, 1, 1), 2, cv2.LINE_AA)
    yy = np.arange(H, dtype=np.float32)[:, None]
    fade = np.clip((yy - hy) / (H - hy), 0, 1) ** 0.8
    glow = np.exp(-((yy - hy) / (H * 0.08)) ** 2) * 0.35
    lay = layer * fade[..., None]
    out = fr.astype(np.float32) + lay * np.array(color, np.float32) * opacity * 2.2
    out += glow[..., None] * np.array(color, np.float32) * 0.4
    return out.clip(0, 255).astype(np.uint8)


def poster_bg(W, H, color, paper=False, seed=0):
    fr = np.zeros((H, W, 3), np.uint8); fr[:] = color
    if paper:
        rng = np.random.default_rng(seed)
        n = cv2.GaussianBlur(rng.normal(0, 1, (H // 4, W // 4)).astype(np.float32), (0, 0), 1.2)
        n = cv2.resize(n, (W, H))[..., None] * 6
        fr = (fr.astype(np.float32) + n).clip(0, 255).astype(np.uint8)
    return fr


def poster_frame(fr, label_left, label_right, ink, progress, margin=0.05, rule_y=0.70):
    """C9 editorial furniture: rule, mono labels, bottom progress line."""
    H, W = fr.shape[:2]
    x0, x1 = int(W * margin), int(W * (1 - margin))
    y = int(H * rule_y)
    cv2.rectangle(fr, (x0, y), (x1, y + 2), ink, -1)
    L = mono_label(label_left, int(H * 0.017), ink, 0.8)
    over(fr, L, x0 - int(H * .017 * .35) - 12, y + 8)
    R = mono_label(label_right, int(H * 0.017), ink, 0.8)
    over(fr, R, x1 - R.shape[1] + 12, y + 8)
    py = H - int(H * 0.02)
    cv2.rectangle(fr, (x0, py), (x1, py + 2), tuple(int(c * 0.4) for c in ink), -1)
    cv2.rectangle(fr, (x0, py), (int(lerp(x0, x1, clamp01(progress))), py + 2), ink, -1)
    return fr


# ------------------------------------------------------------------ sprites
ROBOT = [  # cube robot, 16x16 pixel map: H hat, B band, O body, E eye, L leg, . empty
    "....HHHHHHHH....",
    "....HHHHHHHH....",
    "....BBBBBBBB....",
    "..HHHHHHHHHHHH..",
    "...OOOOOOOOOO...",
    "...OOOOOOOOOO...",
    "...OOEOOOOEOO..O",
    "...OOEOOOOEOO.O.",
    "..OOOOOOOOOOOO..",
    "...OOOOOOOOOO...",
    "...OOOOOOOOOO...",
    "...OOOOOOOOOO...",
    "...OOOOOOOOOO...",
    "....L.L..L.L....",
    "....L.L..L.L....",
    "................",
]
_RC = {"H": (60, 58, 62), "B": (200, 196, 185), "O": C["orange"], "E": (25, 15, 10), "L": (200, 80, 20)}


def robot_sprite(px=14, blink=False, bob=0):
    """Orange cube robot (film's mascot) as RGBA, pixel size px. Shaded voxel look."""
    n = len(ROBOT)
    im = np.zeros((n * px, n * px, 4), np.uint8)
    for r, row in enumerate(ROBOT):
        for c, ch in enumerate(row):
            if ch == ".": continue
            if ch == "E" and blink: ch = "O"
            col = np.array(_RC[ch], np.float32)
            shade = 1.0 - 0.18 * (c / n) - 0.1 * (r / n)  # light from top-left
            if ch == "O" and c in (3, 4) and 4 <= r <= 12: shade += 0.12
            im[r * px:(r + 1) * px, c * px:(c + 1) * px, :3] = (col * shade).clip(0, 255)
            im[r * px:(r + 1) * px, c * px:(c + 1) * px, 3] = 255
    if bob:
        im = np.roll(im, -bob, axis=0)
    return im


def contact_shadow(dst, cx, y, w, strength=0.45):
    H, W = dst.shape[:2]
    m = np.zeros((H, W), np.float32)
    cv2.ellipse(m, (int(cx), int(y)), (int(w / 2), int(w / 9)), 0, 0, 360, 1, -1)
    m = cv2.GaussianBlur(m, (0, 0), 12) * strength
    dst[:] = (dst.astype(np.float32) * (1 - m[..., None])).astype(np.uint8)
    return dst


# ------------------------------------------------------------------ transitions / fx
def scale_about(img, s, cx, cy):
    M = np.float32([[s, 0, cx - s * cx], [0, s, cy - s * cy]])
    return cv2.warpAffine(img, M, (img.shape[1], img.shape[0]), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)


def zoom_blur(img, s, cx, cy, strength, samples=12):
    if strength < 0.004: return scale_about(img, s, cx, cy)
    acc = np.zeros(img.shape, np.float32)
    for i in range(samples):
        acc += scale_about(img, s * (1 + strength * i / (samples - 1)), cx, cy)
    return (acc / samples).astype(np.uint8)


def motion_blur_h(img, px):
    if px < 1: return img
    k = np.zeros((1, int(px) | 1), np.float32); k[:] = 1 / k.size
    return cv2.filter2D(img, -1, k, borderType=cv2.BORDER_REFLECT)


def scale_pop(frame, k):               # T10 / E1
    s = [1.04, 1.02][k] if 0 <= k < 2 else 1.0
    H, W = frame.shape[:2]
    return scale_about(frame, s, W / 2, H / 2) if s != 1 else frame


def tr_whip_flash(A_last, B_first, H, W):
    """T1: returns list of frames f4..f11 (8 frames) between A hold and B start."""
    out = []
    a = scale_about(motion_blur_h(A_last, 40), 1.04, W / 2, H / 2)
    out.append((a * 0.85).astype(np.uint8))                                   # f4
    sm = motion_blur_h(A_last, 200).astype(np.float32)
    lum = sm.mean(2, keepdims=True)
    out.append((lum / 255 * np.array([150, 255, 240]) * 0.6 + 255 * 0.4).clip(0, 255).astype(np.uint8))  # f5 cyan/white
    r = (lum / 255 * np.array(C["block_red"]) * 1.3).clip(0, 255).astype(np.uint8)
    bh = int(H * 0.15); r[:bh] = 0; r[-bh:] = 0
    out.append(r)                                                             # f6 red letterbox
    w = np.full((H, W, 3), 245, np.uint8)
    band = cv2.resize(motion_blur_h(A_last, 300), (W, H // 3))
    bl = band.mean(2, keepdims=True) / 255
    w[H // 3:H // 3 + H // 3] = (bl * np.array(C["cyan"]) + (1 - bl) * 200).astype(np.uint8)
    out.append(w)                                                             # f7
    b = np.zeros((H, W, 3), np.uint8)
    vb = cv2.rotate(motion_blur_h(cv2.rotate(B_first, cv2.ROTATE_90_CLOCKWISE), 260), cv2.ROTATE_90_COUNTERCLOCKWISE)
    x0, x1 = int(W * 0.3), int(W * 0.7)
    vl = vb[:, x0:x1].mean(2, keepdims=True) / 255
    b[:, x0:x1] = (np.array(C["block_red"]) * (0.5 + 0.5 * vl)).astype(np.uint8)
    out.append(b)                                                             # f8
    w2 = np.full((H, W, 3), 248, np.uint8)
    x0, x1 = int(W * 0.42), int(W * 0.6)
    w2[:, x0:x1] = (np.array(C["cyan"]) * (0.6 + 0.4 * vl[:, :x1 - x0])).astype(np.uint8)
    out.append(w2)                                                            # f9
    out += [np.zeros((H, W, 3), np.uint8)] * 2                               # f10-11
    return out


def tr_pixel_blocks(A, B, k, total=8, cell=None, seed=11, palette=None):
    """T2 pixel-block storm. A, B: frames for this k. k in 0..total-1."""
    H, W = B.shape[:2]
    cell = cell or W // 18
    cov = [0.0, 0.15, 0.45, 0.60, 0.35, 0.15, 0.05, 0.0][min(k, 7)]
    base = A if k == 0 else B
    out = base.copy()
    if k == 0:  # flare
        return np.clip(out.astype(np.float32) * 1.15 + 20, 0, 255).astype(np.uint8)
    rng = np.random.default_rng(seed)
    gx, gy = W // cell + 1, H // cell + 1
    order = rng.random((gy, gx))
    yy, xx = np.mgrid[0:gy, 0:gx]
    edge = np.minimum(np.minimum(xx, gx - 1 - xx), np.minimum(yy, gy - 1 - yy)) / max(gx, gy)
    order = order * 0.7 + edge * 0.6  # edges first
    pal = palette or [(C["block_red"], .4), (C["dark_red"], .2), ((242, 242, 242), .2), ((0, 0, 0), .1), (C["peach"], .1)]
    cols, w = zip(*pal); w = np.array(w) / sum(w)
    r2 = np.random.default_rng(seed + k)
    thr = np.quantile(order, cov) if cov > 0 else -1
    for j in range(gy):
        for i in range(gx):
            if order[j, i] <= thr:
                col = cols[r2.choice(len(cols), p=w)]
                s = cell * (2 if r2.random() < 0.08 else 1)
                cv2.rectangle(out, (i * cell, j * cell), (i * cell + s - 2, j * cell + s - 2), col, -1)
    return out


def tr_glitch_slice(A, B, k, seed=5):
    """T3: 3-frame slice cut (k=0,1,2)."""
    H, W = B.shape[:2]
    rng = np.random.default_rng(seed + k)
    amp = [120, 60, 10][min(k, 2)]
    mixB = [0.3, 0.85, 1.0][min(k, 2)]
    out = B.copy() if k else A.copy()
    y = 0
    while y < H:
        h = int(rng.uniform(0.02, 0.12) * H)
        src = B if rng.random() < mixB else A
        sl = src[y:y + h]
        if rng.random() < 0.6:
            sl = np.roll(sl, int(rng.integers(-amp, amp + 1)), axis=1)
        out[y:y + h] = sl
        y += h
    if k < 2:
        sh = 6 - 3 * k
        out[..., 0] = np.roll(out[..., 0], sh, axis=1); out[..., 2] = np.roll(out[..., 2], -sh, axis=1)
    return out


def fx_disintegrate(layer, k, frames=6, reverse=False, seed=9, cell=5):
    """T6 / X3: RGBA layer → particles. k 0..frames-1. Returns RGBA layer (bigger canvas, centred)."""
    h, w = layer.shape[:2]
    pad = 80
    out = np.zeros((h + 2 * pad, w + 2 * pad, 4), np.uint8)
    t = (k + 1) / frames
    if reverse: t = 1 - t
    rng = np.random.default_rng(seed)
    for y in range(0, h, cell):
        for x in range(0, w, cell):
            a = layer[y:y + cell, x:x + cell, 3]
            if a.mean() < 40: continue
            col = layer[y:y + cell, x:x + cell, :3].reshape(-1, 3).mean(0)
            delay = rng.uniform(0, 0.5)
            tt = clamp01((t - delay) / 0.5)
            dx = rng.normal(0, 30) * tt + 25 * tt; dy = rng.normal(0, 30) * tt - 10 * tt + 20 * tt * tt
            if rng.random() < tt * 0.5: continue
            px, py = int(x + pad + dx), int(y + pad + dy)
            if 0 <= px < out.shape[1] - cell and 0 <= py < out.shape[0] - cell:
                s = cell if tt < 0.3 else max(2, cell - 2)
                out[py:py + s, px:px + s, :3] = col
                out[py:py + s, px:px + s, 3] = int(255 * (1 - tt * 0.6))
    return out


# ------------------------------------------------------------------ writer
class Writer:
    def __init__(self, path, W, H, fps=FPS):
        self.path, self.W, self.H = path, W, H
        os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
        self.p = subprocess.Popen(["ffmpeg", "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24",
                                   "-s", f"{W}x{H}", "-r", str(fps), "-i", "-", "-c:v", "libx264", "-preset", "medium",
                                   "-crf", "17", "-pix_fmt", "yuv420p", "-movflags", "+faststart", path], stdin=subprocess.PIPE)
        self.n = 0

    def write(self, fr):
        assert fr.shape == (self.H, self.W, 3), fr.shape
        self.p.stdin.write(np.ascontiguousarray(fr, np.uint8).tobytes()); self.n += 1

    def close(self):
        self.p.stdin.close(); self.p.wait()
        print(f"wrote {self.path}: {self.n} frames ({self.n / FPS:.2f}s)")
