"""03 DIGITAL ZOOM  (reel effect 05/17, measured at 3.40-4.30 s of the reference)

Measured at 30 fps:
  small caption builds word by word (words just appear, no animation).
  P      : punch-in starts, scale ~1.10 with zoom blur; small caption blurs out (2 frames).
  P+1    : scale ~1.25, heavy blur; big white word blurs in (3 frames, 1.12 -> 1.0 scale).
  P+2    : scale 1.30, sharp.  Zoom holds.
  P+10   : second big word, yellow, blurs in under the first (3 frames).
"""
import numpy as np
from fxlib import *

V, V_small = load_clip(177.4, 2.5, 385)     # Kasey, medium shot
M = person_masks(V_small)

ZOOM = [1.10, 1.25, 1.30]
SMALL_WORDS = [(0, "a nepotřebuješ"), (7, "a nepotřebuješ žádný")]
P = 16
f_small = font(FONT_BOLD, 54)
small = {t: text_layer(s, f_small) for t, s in SMALL_WORDS}
big1 = text_layer("drahý", font(FONT_BLACK, 168))
big2 = text_layer("software", font(FONT_BLACK, 168), fill=(243, 236, 120))

ys, xs = np.nonzero(M[P] > .5)
sel = ys < np.percentile(ys, 30)                 # face / head region
CX, CY = xs[sel].mean(), ys[sel].mean()

out = Writer("03_digital_zoom.mp4")
for i in range(len(V)):
    k = i - P
    if k < 0:
        s, prev = 1.0, 1.0
    else:
        s = ZOOM[min(k, 2)]
        prev = ZOOM[k - 1] if 0 < k <= 2 else (1.0 if k == 0 else s)
    f = zoom_blur(V[i], s, CX, CY, (s / prev - 1) * 1.4)
    # small caption: build-up, then blur out at P
    cur = [l for t, l in sorted(small.items()) if t <= i]
    if cur and k < 2:
        sc, bl, op = (1, 0, 1) if k < 0 else blur_out(k)
        place_center(f, transform_layer(cur[-1], sc, bl, op), W / 2, 980)
    # big word 1
    if k >= 1:
        sc, bl, op = blur_in(k - 1)
        place_center(f, transform_layer(big1, sc, bl, op), W / 2, 1010)
    # big word 2 (yellow)
    if k >= 10:
        sc, bl, op = blur_in(k - 10)
        place_center(f, transform_layer(big2, sc, bl, op), W / 2, 1150)
    out.write(counter_pill(f, "03/05"))
out.close()
