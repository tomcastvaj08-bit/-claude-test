#!/usr/bin/env python3
"""Pack the cold-open v2 assets for the engine.

  src/env4k/<scene>.png        4K upscale of the user's room photo   -> v2/<scene>/plate.jpg (3200 px) + plate_blur.jpg
  src/reg/<scene>_kN[_rM].webp drawings registered to the plate       -> v2/<scene>/kN[_rM].webp (alpha cleaned)
writes v2/manifest.json: per pose the bbox and head point in plate-normalised coords (0..1), and per scene which
redraws exist. The engine works in those normalised coords, so the plate resolution can change freely.
"""
import json, os, glob
import cv2
import numpy as np

ROOT = os.path.join(os.path.dirname(__file__), "..", "assets", "coldopen")
SRC, OUT = os.path.join(ROOT, "src"), os.path.join(ROOT, "v2")
SCENES = ["newspaper", "nap", "laptop", "phone", "notebook"]
man = {}
for sc in SCENES:
    od = os.path.join(OUT, sc); os.makedirs(od, exist_ok=True)
    P = cv2.imread(os.path.join(SRC, "env4k", sc + ".png"), cv2.IMREAD_COLOR)
    if P is None:
        P = cv2.imread(os.path.join(ROOT, "env", sc + ".png"), cv2.IMREAD_COLOR)
    pw = 3200; ph = round(pw * P.shape[0] / P.shape[1])
    cv2.imwrite(os.path.join(od, "plate.jpg"), cv2.resize(P, (pw, ph), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 90])
    # low-res, heavily blurred plate: light/colour wrap over the drawing + close-up backgrounds
    b = cv2.GaussianBlur(cv2.resize(P, (640, round(640 * ph / pw)), interpolation=cv2.INTER_AREA), (0, 0), 6)
    cv2.imwrite(os.path.join(od, "plate_blur.jpg"), b, [cv2.IMWRITE_JPEG_QUALITY, 88])
    poses = {}
    for f in sorted(glob.glob(os.path.join(SRC, "reg", f"{sc}_k*.webp"))):
        name = os.path.basename(f)[len(sc) + 1:-5]          # k1, k1_r1, ...
        im = cv2.imread(f, cv2.IMREAD_UNCHANGED)
        a = im[..., 3].astype(np.float32) / 255
        # kill the soft white glow some redraws carry; keep a crisp paper edge (1px feather)
        a = np.clip((a - 0.3) / 0.55, 0, 1)
        # drawn "shock" glows come out as a translucent grey-white cloud around the head – drop it.
        # The real paper edge is a thin opaque rim, so it survives: only large soft pale areas go.
        rgb = im[..., :3].astype(np.float32) / 255
        pale = (rgb.min(axis=2) > 0.62) & ((rgb.max(axis=2) - rgb.min(axis=2)) < 0.16)
        soft = cv2.GaussianBlur(a, (0, 0), 1.5) < 0.97
        cloud = pale & soft
        cloud = cv2.morphologyEx(cloud.astype(np.uint8), cv2.MORPH_OPEN, np.ones((9, 9), np.uint8)).astype(bool)
        a = np.where(cloud, a * 0.08, a)
        a = cv2.GaussianBlur(a, (0, 0), 0.6)
        im[..., 3] = (a * 255).astype(np.uint8)
        im[a < 0.02] = 0
        cv2.imwrite(os.path.join(od, name + ".webp"), im, [cv2.IMWRITE_WEBP_QUALITY, 92])
        H, W = a.shape
        ys, xs = np.nonzero(a > 0.5)
        x0, y0, x1, y1 = xs.min(), ys.min(), xs.max(), ys.max()
        # head = alpha centroid of the top 22 % of the drawing
        top = (ys < y0 + 0.22 * (y1 - y0))
        hx, hy = xs[top].mean(), ys[top].mean()
        poses[name] = {"bbox": [round(x0 / W, 4), round(y0 / H, 4), round(x1 / W, 4), round(y1 / H, 4)], "head": [round(hx / W, 4), round(hy / H, 4)]}
    man[sc] = {"plate": [pw, ph], "poses": poses}
    print(sc, sorted(poses))
# close-up faces (lip-sync): open / half / closed mouth, each with two hand redraws
fd = os.path.join(OUT, "face"); os.makedirs(fd, exist_ok=True)
for f in sorted(glob.glob(os.path.join(SRC, "face", "*.webp"))):
    im = cv2.imread(f, cv2.IMREAD_UNCHANGED)
    im = cv2.resize(im, (2304, round(2304 * im.shape[0] / im.shape[1])), interpolation=cv2.INTER_AREA)
    a = np.clip((im[..., 3].astype(np.float32) / 255 - 0.3) / 0.55, 0, 1)
    im[..., 3] = (cv2.GaussianBlur(a, (0, 0), 0.6) * 255).astype(np.uint8)
    im[im[..., 3] < 5] = 0
    cv2.imwrite(os.path.join(fd, os.path.basename(f)), im, [cv2.IMWRITE_WEBP_QUALITY, 92])
json.dump(man, open(os.path.join(OUT, "manifest.json"), "w"), indent=1)
