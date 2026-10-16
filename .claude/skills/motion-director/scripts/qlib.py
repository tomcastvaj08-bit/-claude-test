"""Mode Q primitives — editorial quote edit (references/editorial-quote-edit.md).
Built on mdlib. Frames RGB uint8. Sizes are given for a 720-px-high canvas and scaled by `u`."""
import math
import numpy as np, cv2
from PIL import Image, ImageDraw
from mdlib import F, C, text_layer, tf, place, place_left, over, clamp01, lerp, ease_out_cubic

QC = dict(grey_word=(133, 130, 134), mosaic=(108, 104, 108), box=(250, 247, 251), box_ink=(9, 6, 12),
          label_red=(253, 0, 2), glitch_red=(255, 32, 32), glitch_cyan=(32, 224, 224))

# Spread-row x slots (fraction of width) — uneven on purpose (Q3 L1)
SPREAD_X = [0.06, 0.18, 0.27, 0.37, 0.49, 0.57, 0.72, 0.84]


def spread_row(fr, words, k_onsets, k, y_frac=0.48, u=1.0, slots=None, type_on=True):
    """L1: words on one baseline spread across the width. k_onsets: frame each word starts.
    Letters type on 1 per frame within a word if type_on."""
    H, W = fr.shape[:2]
    f = F("edit", int(28 * u))
    slots = slots or SPREAD_X
    for i, (wd, t0) in enumerate(zip(words, k_onsets)):
        kk = k - t0
        if kk < 0: continue
        txt = wd[:kk + 1] if type_on else wd
        L = text_layer(txt, f, C["white"], tracking=-0.02)
        place_left(fr, L, slots[i % len(slots)] * W - (int(f.size * .35) + 12), y_frac * H)
    return fr


def flank_pair(fr, left, right, cx, cy, gap, u=1.0, serif=True):
    """L2: one word each side of a centred object."""
    f = F("serif_it" if serif else "edit", int(38 * u))
    Ll = text_layer(left, f, (240, 240, 240)); Lr = text_layer(right, f, (240, 240, 240))
    place(fr, Ll, cx - gap - Ll.shape[1] / 2 + 30, cy)
    place(fr, Lr, cx + gap + Lr.shape[1] / 2 - 30, cy)
    return fr


def giant_layer(word, cap_frac, H, color=C["white"], medium=False, tracking=-0.05):
    """Giant word as RGBA, sized so cap height ≈ cap_frac·H."""
    size = int(H * cap_frac / 0.73)  # Inter Display cap height ≈ 0.73 em
    W = H * 2.4
    fam = "edit_med" if medium else "edit"
    while size > 20 and F(fam, size).getlength(word) * (1 + tracking) > W * 0.92:  # fit 92 % width
        size -= 6
    return text_layer(word, F(fam, size), color, shadow=False, tracking=tracking), size


def giant_build(fr, word, k, cx, cy, cap_frac=0.62, per_letter=5, mask=None, src=None, color=C["white"]):
    """L3 letter build with gradient cursor; optional occlusion (mask + src frame drawn on top)."""
    H, W = fr.shape[:2]
    size = int(H * cap_frac / 0.73)
    f = F("edit", size)
    n = min(len(word), k // per_letter + 1)
    full = text_layer(word, f, color, shadow=False, tracking=-0.05)
    x0 = cx - full.shape[1] / 2
    pad = int(size * .35) + 12
    tr = -0.05 * size
    for i in range(n):
        ch = word[i]
        gx = x0 + pad + sum(f.getlength(c) + tr for c in word[:i])
        L = text_layer(ch, f, color, shadow=False)
        age = k - i * per_letter
        s, b, o = (1.15, 4, 0.4) if age == 0 else ((1.05, 1.5, 0.8) if age == 1 else (1, 0, 1))
        place(fr, tf(L, s, blur=b, opacity=o), gx + f.getlength(ch) / 2, cy)
    if n < len(word):  # gradient cursor where the next letter goes
        gx = x0 + pad + sum(f.getlength(c) + tr for c in word[:n])
        cw, chh = int(size * 0.5), int(size * 0.73)
        top = int(cy - chh * 0.55)
        grad = np.linspace(0.6, 0.0, chh)[:, None, None]
        reg = fr[top:top + chh, int(gx):int(gx) + cw].astype(np.float32)
        fr[top:top + chh, int(gx):int(gx) + cw] = (reg * (1 - grad) + 200 * grad).astype(np.uint8)
    if mask is not None and src is not None:
        fr[:] = (src * mask[..., None] + fr * (1 - mask[..., None])).astype(np.uint8)
    return fr


def word_window(fr_src, word, k, H, W, cap_frac=0.42, dissolve_at=6):
    """L3 'people': footage visible only inside the word's bbox, then box → black + glow."""
    L, size = giant_layer(word, cap_frac, H)
    out = np.zeros((H, W, 3), np.uint8)
    h, w = L.shape[:2]
    x0, y0 = int(W / 2 - w / 2), int(H / 2 - h / 2)
    a = clamp01((k - dissolve_at) / 4)
    box = fr_src[y0 + h // 6:y0 + h - h // 6, x0 + 20:x0 + w - 20]
    out[y0 + h // 6:y0 + h - h // 6, x0 + 20:x0 + w - 20] = (box * (1 - a)).astype(np.uint8)
    if a > 0:
        g = tf(L, blur=18, opacity=0.4 * a)
        place(out, g, W / 2, H / 2)
    place(out, L, W / 2, H / 2)
    return out


def label_box(fr, text, k, x, cy, u=1.0, red=False, per_char=1, ghost=2):
    """L4: white box hugging text, typing 1 char/f with 2 grey ghost chars ahead."""
    f = F("edit", int((24 if red else 33) * u))
    n = min(len(text), k // per_char + 1)
    if n <= 0: return fr
    shown, gh = text[:n], text[n:n + ghost]
    tr = -0.04 * f.size
    wfull = sum(f.getlength(c) + tr for c in shown + gh)
    asc, desc = f.getmetrics()
    px, py = 0.22 * f.size, 0.08 * f.size
    bx0, by0 = int(x), int(cy - (asc + desc) / 2 - py)
    bx1, by1 = int(x + wfull + 2 * px), int(cy + (asc + desc) / 2 + py)
    cv2.rectangle(fr, (bx0, by0), (bx1, by1), QC["label_red"] if red else QC["box"], -1)
    im = Image.fromarray(fr[by0:by1, bx0:bx1].copy())
    d = ImageDraw.Draw(im)
    cx_ = px
    ink = (255, 255, 255) if red else QC["box_ink"]
    for i, ch in enumerate(shown + gh):
        col = ink if i < n else (150, 150, 150)
        d.text((cx_, py - 2), ch, font=f, fill=col); cx_ += f.getlength(ch) + tr
    fr[by0:by1, bx0:bx1] = np.asarray(im)
    return fr


def rgb_block_glitch(fr, k, seed=3):
    """Q6: 2-frame red/cyan solid blocks + duotone half."""
    H, W = fr.shape[:2]
    rng = np.random.default_rng(seed + k)
    out = fr.copy()
    lum = fr.mean(2, keepdims=True) / 255
    x0 = int(rng.uniform(0.3, 0.6) * W); y0 = int(rng.uniform(0.0, 0.4) * H)
    out[y0:, x0:] = (lum[y0:, x0:] * np.array(QC["glitch_red"])).astype(np.uint8)
    cw = int(W * rng.uniform(0.12, 0.25))
    out[y0:y0 + int(H * 0.45), x0 - cw // 2:x0 + cw // 2] = QC["glitch_cyan"]
    out[int(H * 0.55):, max(0, x0 - cw):x0] = QC["glitch_red"]
    return out


def mosaic(tiles, k, H, W, u=1.0, per_frame=1, start=6, seed=21):
    """F2: grey bg, tiles pop in one per frame at random grid cells (rows offset)."""
    out = np.zeros((H, W, 3), np.uint8); out[:] = QC["mosaic"]
    tw = int(W * 0.15); th = int(tw * 9 / 16); gut = 2
    rng = np.random.default_rng(seed)
    cells = []
    for r in range(H // th + 1):
        off = int(rng.uniform(0.25, 0.5) * tw) if r % 2 else 0
        for c in range(-1, W // tw + 1):
            cells.append((c * (tw + gut) + off, r * (th + gut)))
    order = rng.permutation(len(cells))
    n = min(len(cells), start + k * per_frame)
    for j in order[:n]:
        x, y = cells[j]
        clip = tiles[j % len(tiles)]
        t = cv2.resize(clip(k) if callable(clip) else clip, (tw, th), interpolation=cv2.INTER_AREA)
        xa, ya = max(x, 0), max(y, 0); xb, yb = min(x + tw, W), min(y + th, H)
        if xb > xa and yb > ya:
            out[ya:yb, xa:xb] = t[ya - y:yb - y, xa - x:xb - x]
    return out


def collage(stills, k, H, W, seed=4, intro_blocks=3):
    """F1: tilted overlapping desaturated cards; first frames covered by cyan/red blocks."""
    rng = np.random.default_rng(seed)
    out = np.full((H, W, 3), 190, np.uint8)
    for i, im in enumerate(stills):
        if k < i: continue  # 1 card per frame
        g = cv2.cvtColor(cv2.cvtColor(im, cv2.COLOR_RGB2GRAY), cv2.COLOR_GRAY2RGB)
        cw = int(W * rng.uniform(0.42, 0.6)); ch = int(cw * im.shape[0] / im.shape[1])
        card = cv2.resize(g, (cw, ch), interpolation=cv2.INTER_AREA)
        rgba = np.dstack([card, np.full(card.shape[:2], 255, np.uint8)])
        ang = rng.uniform(-8, 8); s = 1.06 if k - i == 0 else 1.0
        L = tf(rgba, s, angle=ang)
        drift = (k * rng.uniform(-1.5, 1.5), k * rng.uniform(-1, 1))
        cx, cy = rng.uniform(0.2, 0.8) * W + drift[0], rng.uniform(0.25, 0.75) * H + drift[1]
        sh = tf(L, blur=20, opacity=0.35); sh[..., :3] = 0
        place(out, sh, cx + 10, cy + 14); place(out, L, cx, cy)
    if k < intro_blocks:
        cv2.rectangle(out, (int(W * .22), 0), (int(W * .62), int(H * .7)), (24, 200, 200), -1)
        pts = np.array([[int(W * .2), int(H * .75)], [int(W * .5), int(H * .68)], [int(W * .5), int(H * .74)], [int(W * .2), int(H * .8)]])
        cv2.fillPoly(out, [pts], (224, 24, 24))
    return out


def pip_over_black(fr_black, boxes, k):
    """F3: boxes = [(t0, frame_fn, cx, cy, w_frac)] pop in hard at t0."""
    H, W = fr_black.shape[:2]
    for t0, fn, cx, cy, wf in boxes:
        if k < t0: continue
        w = int(W * wf); h = int(w * 9 / 16)
        im = cv2.resize(fn(k), (w, h), interpolation=cv2.INTER_AREA)
        x, y = int(cx * W - w / 2), int(cy * H - h / 2)
        xa, ya, xb, yb = max(x, 0), max(y, 0), min(x + w, W), min(y + h, H)
        fr_black[ya:yb, xa:xb] = im[ya - y:yb - y, xa - x:xb - x]
    return fr_black


def brand(fr, u=1.0, top="PRODUCED BY", name="STUDIO"):
    H, W = fr.shape[:2]
    a = text_layer(top, F("bold", int(11 * u)), C["white"], shadow=False, tracking=0.02)
    b = text_layer(name, F("bold", int(15 * u)), C["white"], shadow=False, tracking=0.02)
    x = W - 0.04 * W - max(a.shape[1], b.shape[1]) + 20
    over(fr, a, x, 0.035 * H - 14); over(fr, b, x, 0.035 * H + 2)
    return fr


def grade(fr):
    """Q7: contrast +5 %, sat −10 %, black lift 3 %."""
    f = fr.astype(np.float32)
    g = f.mean(2, keepdims=True)
    f = g + (f - g) * 0.9
    f = (f - 128) * 1.05 + 128
    f = 8 + f * (1 - 8 / 255)
    return f.clip(0, 255).astype(np.uint8)
