#!/usr/bin/env python3
"""First-person phone insert: split a "his hand holding a phone with a chroma-green screen" composite into
  - <out>_hand*.webp : hand + phone body, the screen keyed OUT (the thumb stays, it sits in front of the app)
  - the screen quad -> CSS matrix3d for a W x H screen div (homography), written to <out>.json
Background = the clean room crop (separate layer, so the hand can move against it).
  coldopen-povphone.py BG.png COMPOSITE.png OUT_PREFIX [EXTRA_COMPOSITE …]   (extras = thumb in-betweens)
"""
import json, sys
import cv2, numpy as np
from scipy import ndimage as ndi

bg_p, comp_p, out = sys.argv[1], sys.argv[2], sys.argv[3]
extras = sys.argv[4:]
OW, OH = 1920, 1080
bg = cv2.resize(cv2.imread(bg_p), (2048, 1152), interpolation=cv2.INTER_AREA).astype(np.float32)
sift = cv2.SIFT_create(8000)

def register(im, ref):
    k1, d1 = sift.detectAndCompute(cv2.cvtColor(im.astype(np.uint8), cv2.COLOR_BGR2GRAY), None)
    k2, d2 = sift.detectAndCompute(cv2.cvtColor(ref.astype(np.uint8), cv2.COLOR_BGR2GRAY), None)
    g = [m for m, n in cv2.BFMatcher().knnMatch(d1, d2, k=2) if m.distance < 0.75 * n.distance]
    M, inl = cv2.estimateAffinePartial2D(np.float32([k1[m.queryIdx].pt for m in g]), np.float32([k2[m.trainIdx].pt for m in g]),
                                         method=cv2.RANSAC, ransacReprojThreshold=4)
    return cv2.warpAffine(im, M, (ref.shape[1], ref.shape[0]), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE), int(inl.sum())

def layer(comp_path, ref):
    C = cv2.resize(cv2.imread(comp_path), (2048, 1152), interpolation=cv2.INTER_AREA).astype(np.float32)
    R, n = register(C, ref)
    b, g, r = R[..., 0], R[..., 1], R[..., 2]
    greenness = g - np.maximum(r, b)                     # chroma key
    key = np.clip((greenness - 40) / 60, 0, 1)
    d = cv2.GaussianBlur(np.abs(R - bg).max(2), (0, 0), 4)
    m = d > 26
    m = ndi.binary_opening(m, iterations=3)
    lab, k = ndi.label(m); sz = ndi.sum(m, lab, range(1, k + 1))
    m = np.isin(lab, [i + 1 for i, v in enumerate(sz) if v > sz.max() * 0.2])
    m = ndi.binary_fill_holes(ndi.binary_dilation(m, iterations=4))
    a = cv2.GaussianBlur(m.astype(np.float32), (0, 0), 1.6) * (1 - key)
    # despill the green fringe
    R[..., 1] = np.minimum(g, np.maximum(r, b) + 8)
    return R, a, key, n

R, a, key, n = layer(comp_p, bg)
scr = ndi.binary_fill_holes(key > 0.5)                   # screen incl. the thumb hole
lab, k = ndi.label(scr); sz = ndi.sum(scr, lab, range(1, k + 1)); scr = lab == (np.argmax(sz) + 1)
cs, _ = cv2.findContours(scr.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
hull = cv2.convexHull(cs[0])
eps = 0.02 * cv2.arcLength(hull, True)
q = cv2.approxPolyDP(hull, eps, True).reshape(-1, 2).astype(np.float32)
while len(q) > 4:
    eps *= 1.2; q = cv2.approxPolyDP(hull, eps, True).reshape(-1, 2).astype(np.float32)
if len(q) < 4:
    x, y, w, h = cv2.boundingRect(hull); q = np.float32([[x, y], [x + w, y], [x + w, y + h], [x, y + h]])
# corners: rounded screen corners make the hull cut inside – push the quad out to the true corner lines
s = q.sum(1); dd = q[:, 0] - q[:, 1]
tl, br, tr, bl = q[np.argmin(s)], q[np.argmax(s)], q[np.argmax(dd)], q[np.argmin(dd)]
quad = np.float32([tl, tr, br, bl])
c = quad.mean(0); quad = c + (quad - c) * 1.035          # bleed under the bezel
quad *= OW / 2048
SW = 460; SH = round(SW * np.linalg.norm(quad[3] - quad[0]) / np.linalg.norm(quad[1] - quad[0]))
Hm = cv2.getPerspectiveTransform(np.float32([[0, 0], [SW, 0], [SW, SH], [0, SH]]), quad)
Hm = Hm / Hm[2, 2]
mat = [Hm[0, 0], Hm[1, 0], 0, Hm[2, 0], Hm[0, 1], Hm[1, 1], 0, Hm[2, 1], 0, 0, 1, 0, Hm[0, 2], Hm[1, 2], 0, Hm[2, 2]]

def save(R, a, path):
    o = np.dstack([R, a[..., None] * 255]).clip(0, 255).astype(np.uint8)
    o = cv2.resize(o, (OW, OH), interpolation=cv2.INTER_AREA)
    o[o[..., 3] < 3] = 0
    cv2.imwrite(path, o, [cv2.IMWRITE_WEBP_QUALITY, 92])

save(R, a, out + "_hand.webp")
names = [out.split("/")[-1] + "_hand.webp"]
for i, e in enumerate(extras):
    R2, a2, _, n2 = layer(e, bg)
    # in-between: only the thumb region may differ; everything else stays pixel-identical to the master
    diff = cv2.GaussianBlur(np.abs(R2 - R).max(2), (0, 0), 5) > 30
    diff &= ndi.binary_dilation(scr, iterations=60)
    diff = ndi.binary_dilation(ndi.binary_opening(diff, iterations=3), iterations=14)
    soft = cv2.GaussianBlur(diff.astype(np.float32), (0, 0), 6)
    Rm = R * (1 - soft[..., None]) + R2 * soft[..., None]
    am = a * (1 - soft) + a2 * soft
    p = f"{out}_hand{chr(97 + i)}.webp"; save(Rm, am, p); names.append(p.split("/")[-1]); print("inbetween", p, n2)
cv2.imwrite(out + "_bg.jpg", cv2.resize(bg, (OW, OH), interpolation=cv2.INTER_AREA).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 90])
json.dump({"screen": [SW, SH], "quad": quad.round(1).tolist(), "matrix3d": [round(float(v), 7) for v in mat], "hands": names},
          open(out + ".json", "w"), indent=1)
print("inliers", n, "quad", quad.round(1).tolist(), "screen", SW, SH)
