"""Build RGBA character cutouts (source RGB + refined matte) and a clean camera table.
Usage: python3 prepare_plates.py FRAMES_DIR MATTE_DIR CAM_RAW.json OUT_DIR
 - cutouts:  OUT_DIR/cut/cNNN.png   (720x1280 RGBA, screen space)
 - camera:   OUT_DIR/cam.json       (frame -> [s, tx, ty]) with blurry frames repaired
Graphics from the source that leak into the matte (saturated yellow, flat white
text above the head) are keyed out so only the person + chair remain."""
import sys, os, json, numpy as np
from PIL import Image, ImageFilter

FR, MD, CAMRAW, OUT = sys.argv[1:5]
os.makedirs(f'{OUT}/cut', exist_ok=True)

# ---- camera: repair frames where ECC failed (motion-blurred), then smooth ----
raw = {int(k): v for k, v in json.load(open(CAMRAW)).items()}
cam = {}
for f, (s, tx, ty, cc) in raw.items():
    cam[f] = [s, tx, ty, cc]
# the "pay" shot re-uses the same zoom-out move as the opening (F180+k ~ F1+k)
for k in range(0, 10):
    if raw.get(180 + k, [0, 0, 0, 0])[3] < 0.9:
        cam[180 + k] = list(raw[1 + k])
def smooth(seq, fast=()):
    """Local quadratic regression (LOESS) of the track.  The ECC track wobbles by
    1-2 px in static stretches (the legs/hands move inside the tracking mask); world
    graphics locked to that wobble visibly shake.  sigma is wide (4 frames) where the
    camera is steady and narrow inside the fast zoom-outs listed in `fast`."""
    ks = sorted(seq); arr = np.array([seq[k][:3] for k in ks], float); ks = np.array(ks)
    out = {}
    for i, f in enumerate(ks):
        sig = 1.0 if any(a <= f <= b for a, b in fast) else 4.0
        w = np.exp(-0.5 * ((ks - f) / sig) ** 2); m = w > 1e-3
        x = ks[m] - f; W = w[m]
        A = np.stack([np.ones_like(x), x, x * x], 1).astype(float)
        AtW = A.T * W
        coef = np.linalg.lstsq(AtW @ A, AtW @ arr[m], rcond=None)[0]
        out[int(f)] = [float(v) for v in coef[0]]
    return out
camA = smooth({f: v for f, v in cam.items() if f <= 138}, fast=[(1, 12)])
camC = smooth({f: v for f, v in cam.items() if f >= 180}, fast=[(180, 192)])
camA.update(camC)
json.dump({str(k): v for k, v in camA.items()}, open(f'{OUT}/cam.json', 'w'))

# ---- cutouts ----
names = sorted(os.listdir(MD))
idx = [int(n[1:4]) for n in names]
mattes = {f: np.asarray(Image.open(f'{MD}/m{f:03d}.png').convert('L')).astype(np.float32) / 255 for f in idx}
def shot(f): return 0 if f <= 138 else 1
for f in idx:
    rgb = np.asarray(Image.open(f'{FR}/f{f:03d}.png').convert('RGB')).astype(np.float32)
    nb = [mattes[g] for g in (f - 1, f, f + 1) if g in mattes and shot(g) == shot(f)]
    m = np.median(np.stack(nb), 0) if len(nb) == 3 else mattes[f]
    a = np.clip((m - 0.06) / 0.86, 0, 1)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    # key out leaked yellow graphics (character is neutral/dark)
    yellow = np.clip(((r + g) / 2 - b - 40) / 40, 0, 1)
    a *= 1 - yellow
    # key out very bright flat-white pixels (text / pill) above shoulder line
    s_, tx, ty = camA[f]
    shoulder = s_ * 560 + ty
    lum = (r + g + b) / 3
    white = np.clip((lum - 170) / 40, 0, 1) * (np.arange(1280)[:, None] < shoulder - 40)
    a *= 1 - white
    alpha = Image.fromarray((a * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6))
    out = Image.fromarray(rgb.astype(np.uint8)).convert('RGBA'); out.putalpha(alpha)
    out.save(f'{OUT}/cut/c{f:03d}.png')
print('ok', len(os.listdir(f'{OUT}/cut')))
