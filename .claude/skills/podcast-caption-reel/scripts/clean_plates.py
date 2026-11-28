"""Person cutouts with the source's baked-in captions/watermark removed.
Inside caption boxes (source px, frame ranges) text pixels are detected with
white/black top-hats + saturation, dilated, and inpainted (Telea).  The new
captions are drawn at the same places, so leftovers stay hidden.
Output: OUT/cNNN.png  1080x1920 RGBA (Lanczos upscale + light unsharp)."""
import sys, os, numpy as np, cv2
from PIL import Image, ImageFilter
FR, MD, OUT = sys.argv[1:4]; os.makedirs(OUT, exist_ok=True)
only = None if len(sys.argv) < 5 else set(range(*[int(x) for x in sys.argv[4].split('-')]))
ALL = [(1, 86), (125, 271), (318, 538)]
BOXES = [  # (F0, F1, x0, y0, x1, y1)
    (1, 538, 112, 488, 228, 542),      # watermark
    (1, 538, 100, 308, 268, 346),      # live mini-subtitle on the shirt
    (512, 538, 0, 590, 90, 656),       # mini-subtitle bottom-left in the close-up
    (7, 61, 0, 15, 92, 220), (18, 61, 245, 175, 368, 295), (44, 61, 85, 105, 292, 198),
    (62, 86, 0, 165, 190, 310),
    (127, 217, 75, 325, 340, 420), (205, 271, 50, 330, 340, 500),
    (320, 439, 0, 120, 160, 265),
    (442, 478, 5, 325, 295, 410), (468, 511, 95, 310, 290, 400),
    (514, 538, 140, 170, 368, 380),
]
k3 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
k9 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
for a, b in ALL:
    for f in range(a, b + 1):
        if only and f not in only: continue
        mp = f'{MD}/m{f:03d}.png'
        if not os.path.exists(mp): continue
        bgr = cv2.imread(f'{FR}/f{f:03d}.png')
        m = cv2.imread(mp, cv2.IMREAD_GRAYSCALE)
        if m.shape != bgr.shape[:2]: m = cv2.resize(m, (bgr.shape[1], bgr.shape[0]), interpolation=cv2.INTER_AREA)
        g = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY); hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
        mask = np.zeros_like(g)
        for F0, F1, x0, y0, x1, y1 in BOXES:
            if not (F0 <= f <= F1): continue
            sl = (slice(y0, y1), slice(x0, x1))
            wt = cv2.morphologyEx(g[sl], cv2.MORPH_TOPHAT, k9); bt = cv2.morphologyEx(g[sl], cv2.MORPH_BLACKHAT, k9)
            sat = (hsv[sl][..., 1] > 110) & (hsv[sl][..., 2] > 120) & (hsv[sl][..., 0] < 30)
            t = ((wt > 20) | (bt > 26) | sat).astype(np.uint8) * 255
            t = cv2.morphologyEx(t, cv2.MORPH_CLOSE, k3, iterations=2)
            mask[sl] = np.maximum(mask[sl], t)
        mask = cv2.dilate(mask, k3, iterations=2)
        clean = cv2.inpaint(bgr, mask, 6, cv2.INPAINT_TELEA) if mask.any() else bgr
        if mask.any():   # soften the healed area; the new captions (with drop shadows) sit on top of it
            soft = cv2.GaussianBlur(clean, (0, 0), 2.2); mf = cv2.GaussianBlur(mask, (0, 0), 3)[..., None] / 255.0
            clean = (clean * (1 - mf * 0.8) + soft * mf * 0.8).astype(np.uint8)
        rgb = Image.fromarray(cv2.cvtColor(clean, cv2.COLOR_BGR2RGB)).resize((1080, 1920), Image.LANCZOS)
        rgb = rgb.filter(ImageFilter.UnsharpMask(radius=2, percent=45, threshold=2))
        al = Image.fromarray(m).resize((1080, 1920), Image.LANCZOS)
        rgb.putalpha(al); rgb.save(f'{OUT}/c{f:03d}.png', compress_level=1)
print('done')
