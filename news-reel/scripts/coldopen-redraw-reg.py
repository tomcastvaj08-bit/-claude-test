#!/usr/bin/env python3
"""Register a hand-redrawn variant onto its registered master drawing (plate space).

A redraw keeps the pose but the model may shift or re-scale it slightly. SIFT on the
drawing itself (alpha-masked) gives a similarity transform redraw -> master; a final
ECC on the blurred alphas removes the residual so the redraw boils in place instead
of jumping.

  coldopen-redraw-reg.py MASTER.webp REDRAW.png OUT.webp
"""
import json, sys
import cv2
import numpy as np

master_p, redraw_p, out_p = sys.argv[1:4]
Mst = cv2.imread(master_p, cv2.IMREAD_UNCHANGED)
R = cv2.imread(redraw_p, cv2.IMREAD_UNCHANGED)
H, W = Mst.shape[:2]
R = cv2.resize(R, (W, round(W * R.shape[0] / R.shape[1])), interpolation=cv2.INTER_AREA)

sift = cv2.SIFT_create(nfeatures=5000)
def feats(im):
    m = cv2.erode((im[..., 3] > 128).astype(np.uint8) * 255, np.ones((5, 5), np.uint8))
    return sift.detectAndCompute(cv2.cvtColor(im[..., :3], cv2.COLOR_BGR2GRAY), m)
k1, d1 = feats(R); k2, d2 = feats(Mst)
good = [m for m, n in cv2.BFMatcher(cv2.NORM_L2).knnMatch(d1, d2, k=2) if m.distance < 0.78 * n.distance]
M, inl = cv2.estimateAffinePartial2D(np.float32([k1[m.queryIdx].pt for m in good]), np.float32([k2[m.trainIdx].pt for m in good]),
                                     method=cv2.RANSAC, ransacReprojThreshold=4.0, maxIters=20000, confidence=0.999)
out = cv2.warpAffine(R, M, (W, H), flags=cv2.INTER_CUBIC, borderValue=(0, 0, 0, 0))

ra = cv2.GaussianBlur(Mst[..., 3].astype(np.float32) / 255, (0, 0), 2.5)
oa = cv2.GaussianBlur(out[..., 3].astype(np.float32) / 255, (0, 0), 2.5)
w = np.eye(2, 3, dtype=np.float32)
ecc = "ok"
try:
    _, w = cv2.findTransformECC(ra, oa, w, cv2.MOTION_EUCLIDEAN, (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 200, 1e-6), None, 5)
    out = cv2.warpAffine(out, w, (W, H), flags=cv2.INTER_CUBIC | cv2.WARP_INVERSE_MAP, borderValue=(0, 0, 0, 0))
except cv2.error:
    ecc = "failed"
out[out[..., 3] < 6] = 0
cv2.imwrite(out_p, out, [cv2.IMWRITE_WEBP_QUALITY, 94])
# overlap score: how well the silhouettes agree (1 = identical)
a, b = Mst[..., 3] > 128, out[..., 3] > 128
iou = (a & b).sum() / max(1, (a | b).sum())
print(json.dumps({"out": out_p, "inliers": int(inl.sum()), "scale": round(float(np.hypot(M[0, 0], M[1, 0])), 4),
                  "dx": round(float(M[0, 2]), 1), "dy": round(float(M[1, 2]), 1), "ecc": ecc, "iou": round(float(iou), 3)}))
