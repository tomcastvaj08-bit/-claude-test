#!/usr/bin/env python3
"""Turn a gpt_image edit of a pose ("same drawing, only the pen hand moved") into a clean in-between.

The model redraws the WHOLE figure a little differently on every edit, which reads as blinking when the
frames alternate. So we take ONLY the region that really changed (the moving hand / head / page) from
the edit and keep every other pixel of the master drawing:
  1. register the edit onto the master (SIFT similarity on the drawing + ECC on the alpha),
  2. find where they really differ (blurred colour/alpha difference, biggest blobs only),
  3. paste the edit there with a soft feathered mask.

  coldopen-inbetween.py MASTER.webp EDIT.png OUT.webp [--grow 28] [--t 0.16]
MASTER is a registered pose in plate framing (src/reg/<scene>_kN.webp); OUT lands in the same framing.
"""
import argparse, json
import cv2
import numpy as np
from scipy import ndimage as ndi

ap = argparse.ArgumentParser()
ap.add_argument("master"); ap.add_argument("edit"); ap.add_argument("out")
ap.add_argument("--grow", type=int, default=28)
ap.add_argument("--t", type=float, default=0.16)
ap.add_argument("--keep", type=float, default=0.08, help="keep blobs >= keep * largest")
a = ap.parse_args()

Mst = cv2.imread(a.master, cv2.IMREAD_UNCHANGED)
E = cv2.imread(a.edit, cv2.IMREAD_UNCHANGED)
H, W = Mst.shape[:2]
E = cv2.resize(E, (W, round(W * E.shape[0] / E.shape[1])), interpolation=cv2.INTER_AREA)

sift = cv2.SIFT_create(nfeatures=6000)
def feats(im):
    m = cv2.erode((im[..., 3] > 128).astype(np.uint8) * 255, np.ones((5, 5), np.uint8))
    return sift.detectAndCompute(cv2.cvtColor(im[..., :3], cv2.COLOR_BGR2GRAY), m)
k1, d1 = feats(E); k2, d2 = feats(Mst)
good = [m for m, n in cv2.BFMatcher(cv2.NORM_L2).knnMatch(d1, d2, k=2) if m.distance < 0.78 * n.distance]
M, inl = cv2.estimateAffinePartial2D(np.float32([k1[m.queryIdx].pt for m in good]), np.float32([k2[m.trainIdx].pt for m in good]),
                                     method=cv2.RANSAC, ransacReprojThreshold=4.0, maxIters=20000, confidence=0.999)
R = cv2.warpAffine(E, M, (W, H), flags=cv2.INTER_CUBIC, borderValue=(0, 0, 0, 0))
ma = cv2.GaussianBlur(Mst[..., 3].astype(np.float32) / 255, (0, 0), 2.5)
ra = cv2.GaussianBlur(R[..., 3].astype(np.float32) / 255, (0, 0), 2.5)
w = np.eye(2, 3, dtype=np.float32)
try:
    _, w = cv2.findTransformECC(ma, ra, w, cv2.MOTION_EUCLIDEAN, (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 200, 1e-6), None, 5)
    R = cv2.warpAffine(R, w, (W, H), flags=cv2.INTER_CUBIC | cv2.WARP_INVERSE_MAP, borderValue=(0, 0, 0, 0))
except cv2.error:
    pass

# where the drawings really differ (premultiplied colour + alpha, blurred so line jitter doesn't count)
def pm(im):
    f = im.astype(np.float32) / 255
    return np.dstack([f[..., :3] * f[..., 3:4], f[..., 3:4]])
d = np.abs(cv2.GaussianBlur(pm(Mst), (0, 0), 6) - cv2.GaussianBlur(pm(R), (0, 0), 6)).max(axis=2)
m = d > a.t
m = ndi.binary_opening(m, iterations=3)
lab, n = ndi.label(m)
if n:
    sizes = ndi.sum(m, lab, range(1, n + 1))
    m = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s >= sizes.max() * a.keep])
m = ndi.binary_dilation(m, iterations=a.grow)
m = ndi.binary_fill_holes(m)
soft = cv2.GaussianBlur(m.astype(np.float32), (0, 0), a.grow * 0.45)[..., None]

out = Mst.astype(np.float32) * (1 - soft) + R.astype(np.float32) * soft
out = np.clip(out, 0, 255).astype(np.uint8)
out[out[..., 3] < 4] = 0
cv2.imwrite(a.out, out, [cv2.IMWRITE_WEBP_QUALITY, 94])
ys, xs = np.nonzero(m)
print(json.dumps({"out": a.out, "inliers": int(inl.sum()), "changed_px": int(m.sum()),
                  "region": [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())] if len(xs) else None}))
