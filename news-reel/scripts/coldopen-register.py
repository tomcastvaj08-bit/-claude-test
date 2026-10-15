#!/usr/bin/env python3
"""Register a transparent character cut-out onto the clean room plate.

gpt_image_2_5 re-frames the room a little on every edit (zoom, shift). The cut-out
inherits the framing of the composite it was taken from, so we match the composite
against the plate (SIFT + RANSAC similarity, features on the character masked out)
and push the cut-out through the same transform.

  coldopen-register.py PLATE COMP CUT OUT.webp [--w 2688] [--ref REF.webp]
     --ref : a registered cut-out of the same pose family; the result is then
             refined onto it with ECC on the alpha (keeps redraws from drifting)
  prints JSON {scale, rot, dx, dy, inliers, bbox}
"""
import argparse, json
import cv2
import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument("plate"); ap.add_argument("comp"); ap.add_argument("cut"); ap.add_argument("out")
ap.add_argument("--w", type=int, default=2688)
ap.add_argument("--ref")
ap.add_argument("--identity", action="store_true", help="cut is already in plate framing")
ap.add_argument("--preview")
a = ap.parse_args()

P = cv2.imread(a.plate, cv2.IMREAD_COLOR)
W = a.w; H = round(W * P.shape[0] / P.shape[1])
P = cv2.resize(P, (W, H), interpolation=cv2.INTER_AREA)
cut = cv2.imread(a.cut, cv2.IMREAD_UNCHANGED)
if cut.shape[2] == 3:
    raise SystemExit("cut-out has no alpha")

info = {}
if a.identity:
    M = np.array([[W / cut.shape[1], 0, 0], [0, H / cut.shape[0], 0]], np.float64)
else:
    C = cv2.imread(a.comp, cv2.IMREAD_COLOR)
    sx = cut.shape[1] / C.shape[1]
    C = cv2.resize(C, (cut.shape[1], cut.shape[0]), interpolation=cv2.INTER_AREA)
    # mask the character (+margin) out of the composite so only the room drives the match
    cm = (cut[..., 3] > 8).astype(np.uint8)
    cm = cv2.dilate(cm, np.ones((41, 41), np.uint8))
    sift = cv2.SIFT_create(nfeatures=6000)
    gp = cv2.cvtColor(P, cv2.COLOR_BGR2GRAY); gc = cv2.cvtColor(C, cv2.COLOR_BGR2GRAY)
    kp1, d1 = sift.detectAndCompute(gc, (1 - cm) * 255)
    kp2, d2 = sift.detectAndCompute(gp, None)
    mt = cv2.BFMatcher(cv2.NORM_L2).knnMatch(d1, d2, k=2)
    good = [m for m, n in mt if m.distance < 0.72 * n.distance]
    src = np.float32([kp1[m.queryIdx].pt for m in good]); dst = np.float32([kp2[m.trainIdx].pt for m in good])
    M, inl = cv2.estimateAffinePartial2D(src, dst, method=cv2.RANSAC, ransacReprojThreshold=4.0, maxIters=20000, confidence=0.999)
    info["inliers"] = int(inl.sum()); info["matches"] = len(good)
    # the extraction pass can also re-scale the drawing: match cut-out -> composite on the character itself
    gk = cv2.cvtColor(cut[..., :3], cv2.COLOR_BGR2GRAY)
    am = (cut[..., 3] > 128).astype(np.uint8) * 255
    k3, d3 = sift.detectAndCompute(gk, cv2.erode(am, np.ones((5, 5), np.uint8)))
    k4, d4 = sift.detectAndCompute(gc, cv2.dilate(am, np.ones((151, 151), np.uint8)))
    good2 = [m for m, n in cv2.BFMatcher(cv2.NORM_L2).knnMatch(d3, d4, k=2) if m.distance < 0.75 * n.distance]
    if len(good2) >= 12:
        M1, inl1 = cv2.estimateAffinePartial2D(np.float32([k3[m.queryIdx].pt for m in good2]), np.float32([k4[m.trainIdx].pt for m in good2]),
                                               method=cv2.RANSAC, ransacReprojThreshold=3.0, maxIters=20000, confidence=0.999)
        if M1 is not None and inl1.sum() >= 10:
            M = np.vstack([M, [0, 0, 1]]) @ np.vstack([M1, [0, 0, 1]])
            M = M[:2]
            info["cut2comp"] = {"inliers": int(inl1.sum()), "scale": round(float(np.hypot(M1[0, 0], M1[1, 0])), 4),
                                "dx": round(float(M1[0, 2]), 1), "dy": round(float(M1[1, 2]), 1)}

out = cv2.warpAffine(cut, M, (W, H), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0))

if a.ref:
    R = cv2.imread(a.ref, cv2.IMREAD_UNCHANGED)
    ra = cv2.GaussianBlur(R[..., 3].astype(np.float32) / 255, (0, 0), 3)
    oa = cv2.GaussianBlur(out[..., 3].astype(np.float32) / 255, (0, 0), 3)
    w = np.eye(2, 3, dtype=np.float32)
    try:
        _, w = cv2.findTransformECC(ra, oa, w, cv2.MOTION_AFFINE,
                                    (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 300, 1e-6), None, 5)
        out = cv2.warpAffine(out, w, (W, H), flags=cv2.INTER_CUBIC | cv2.WARP_INVERSE_MAP, borderValue=(0, 0, 0, 0))
        info["ecc"] = w.round(4).tolist()
    except cv2.error as e:
        info["ecc"] = "failed"

# un-premultiplied edges: kill colour fringes from the model's matte
al = out[..., 3]
out[al < 6] = 0
cv2.imwrite(a.out, out, [cv2.IMWRITE_WEBP_QUALITY, 94])
ys, xs = np.nonzero(al > 20)
s = float(np.hypot(M[0, 0], M[1, 0]))
info.update({"out": a.out, "scale": round(s, 4), "rot": round(float(np.degrees(np.arctan2(M[1, 0], M[0, 0]))), 3),
             "dx": round(float(M[0, 2]), 1), "dy": round(float(M[1, 2]), 1),
             "bbox": [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())] if len(xs) else None})
if a.preview:
    o = out.astype(np.float32) / 255
    pv = P.astype(np.float32) / 255 * (1 - o[..., 3:]) + o[..., :3] * o[..., 3:]
    cv2.imwrite(a.preview, cv2.resize((pv * 255).astype(np.uint8), (1344, round(1344 * H / W))), [cv2.IMWRITE_JPEG_QUALITY, 85])
print(json.dumps(info))
