"""01 ZOOM-THROUGH CUT  (reel effect 09/17, measured at 7.55-8.20 s of the reference)

Measured frame-by-frame at 30 fps:
  A: holds, then 7 frames of accelerating zoom into the subject's torso with growing
     radial blur (scale ~1.05 -> 4.5).  Caption is baked into A, so it zooms with it.
  CUT on the 8th frame.
  B: starts heavily zoomed (~3x) + radial blur and decelerates to 1.0 in 6 frames.
  B's small tracked caps caption appears only after B has settled.
"""
import numpy as np
from fxlib import *

A_ZOOM = [1.05, 1.15, 1.35, 1.70, 2.30, 3.20, 4.50]
B_ZOOM = [3.00, 2.00, 1.45, 1.18, 1.06, 1.00]
BLUR_K = 0.9  # blur length relative to per-frame scale change

A, A_small = load_clip(268.3, 1.75, 700)    # Thom walking on the bridge
B, B_small = load_clip(320.3, 1.6, 1217)    # Celia close-up
mA, mB = person_masks(A_small), person_masks(B_small)


def centroid(m, upper=False):
    ys, xs = np.nonzero(m > .5)
    if upper:  # torso / chest: upper-middle of the silhouette
        sel = ys < np.percentile(ys, 45); ys, xs = ys[sel], xs[sel]
    return float(xs.mean()), float(ys.mean())


# ---- captions (reel style: small sans / big serif italic cream / small sans)
cap_small = text_layer("a teď přijde", font(FONT_MED, 46))
cap_big = text_layer("zoom", font(FONT_SERIF_IT, 150), fill=(233, 228, 170))
cap_small2 = text_layer("through cut", font(FONT_MED, 40))
cap_b = text_layer("A JSME NA DRUHÉ STRANĚ", font(FONT_MED, 34), tracking=14)


def caption_a(f):
    place_center(f, cap_small, W / 2, 1010)
    place_center(f, cap_big, W / 2, 1110)
    place_center(f, cap_small2, W / 2, 1215)
    return f


out = Writer("01_zoom_through_cut.mp4")
hold = len(A) - len(A_ZOOM)
for i in range(hold):
    out.write(counter_pill(caption_a(A[i].copy()), "01/05"))

# A: accelerate in
for k, s in enumerate(A_ZOOM):
    f = caption_a(A[hold + k].copy())
    cx, cy = centroid(mA[hold + k], upper=True)
    nxt = A_ZOOM[k + 1] if k + 1 < len(A_ZOOM) else s * 1.45
    out.write(counter_pill(zoom_blur(f, s, cx, cy, (nxt / s - 1) * BLUR_K), "01/05"))

# B: decelerate out
for k, s in enumerate(B_ZOOM):
    cx, cy = centroid(mB[k])
    prev = B_ZOOM[k - 1] if k else s * 1.5
    out.write(counter_pill(zoom_blur(B[k], s, cx, cy, (prev / s - 1) * BLUR_K), "01/05"))

# B settled: tracked caption fades in over 2 frames
for i in range(len(B_ZOOM), len(B)):
    f = B[i].copy()
    k = i - len(B_ZOOM) - 1
    if k >= 0:
        place_center(f, transform_layer(cap_b, opacity=clamp01((k + 1) / 2)), W / 2, 1180)
    out.write(counter_pill(f, "01/05"))
out.close()
