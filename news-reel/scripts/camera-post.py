#!/usr/bin/env python3
"""Camera move over the finished picture, like an adjustment layer in After Effects: scale (and optional
drift) keyframed with clean easing curves, applied to the rendered frames, so no re-render is needed.

  camera-post.py <in.mp4> <out.mp4> <keyframes.json> [--fps 24]

keyframes: [{ "t": 9.13, "z": 1.10, "x": 0, "y": 0, "ease": "outExpo" }, ...]
  the segment that ENDS at a keyframe uses that keyframe's "ease"; "jump": true snaps to it (on a cut).
  Outside the first..last keyframe the picture is untouched (z = 1). x / y = drift in px of the frame centre.
Fast zooms get a shutter (4 sub-samples across half a frame), like the engine's own motion blur.
"""
import json, math, subprocess, sys
import cv2
import numpy as np

src, dst, kfp = sys.argv[1:4]
fps = float(sys.argv[sys.argv.index("--fps") + 1]) if "--fps" in sys.argv else 24.0
# zoom anchor as a fraction of the frame height: above centre, so the header line (series title, page
# counter) stays in frame on push-ins
AY = float(sys.argv[sys.argv.index("--anchor-y") + 1]) if "--anchor-y" in sys.argv else 0.3
K = json.load(open(kfp))
K = sorted(K, key=lambda k: k["t"])

E = {
    "linear": lambda p: p,
    "inQuad": lambda p: p * p, "outQuad": lambda p: 1 - (1 - p) ** 2,
    "inOutQuad": lambda p: 2 * p * p if p < 0.5 else 1 - (-2 * p + 2) ** 2 / 2,
    "inCubic": lambda p: p ** 3, "outCubic": lambda p: 1 - (1 - p) ** 3,
    "inOutCubic": lambda p: 4 * p ** 3 if p < 0.5 else 1 - (-2 * p + 2) ** 3 / 2,
    "outQuart": lambda p: 1 - (1 - p) ** 4,
    "inOutQuart": lambda p: 8 * p ** 4 if p < 0.5 else 1 - (-2 * p + 2) ** 4 / 2,
    "outExpo": lambda p: 1 if p >= 1 else 1 - 2 ** (-10 * p),
    "inOutSine": lambda p: -(math.cos(math.pi * p) - 1) / 2,
}


def cam(t):
    if not K or t < K[0]["t"] or t > K[-1]["t"]:
        return 1.0, 0.0, 0.0
    for a, b in zip(K, K[1:]):
        if a["t"] <= t <= b["t"]:
            if b.get("jump") or b["t"] - a["t"] < 1e-6:
                p = 1.0 if t >= b["t"] else 0.0
            else:
                p = E[b.get("ease", "inOutSine")]((t - a["t"]) / (b["t"] - a["t"]))
            g = lambda k, d: a.get(k, d) + (b.get(k, d) - a.get(k, d)) * p
            return g("z", 1.0), g("x", 0.0), g("y", 0.0)
    return 1.0, 0.0, 0.0


probe = json.loads(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height",
                                   "-of", "json", src], capture_output=True, check=True).stdout)["streams"][0]
W, H = probe["width"], probe["height"]
dec = subprocess.Popen(["ffmpeg", "-v", "error", "-i", src, "-f", "rawvideo", "-pix_fmt", "bgr24", "-"], stdout=subprocess.PIPE)
enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", str(fps), "-i", "-",
                        "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-pix_fmt", "yuv420p", dst], stdin=subprocess.PIPE)


def warp(img, z, x, y):
    M = np.float32([[z, 0, (1 - z) * W / 2 - x * z], [0, z, (1 - z) * H * AY - y * z]])
    return cv2.warpAffine(img, M, (W, H), flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REFLECT)


n = 0
while True:
    buf = dec.stdout.read(W * H * 3)
    if len(buf) < W * H * 3:
        break
    img = np.frombuffer(buf, np.uint8).reshape(H, W, 3)
    t = n / fps
    z, x, y = cam(t)
    if abs(z - 1) < 1e-4 and abs(x) < 0.05 and abs(y) < 0.05:
        out = img
    else:
        z0 = cam(t - 0.5 / fps)[0]
        # shutter only when the zoom moves fast enough to smear (>0.3 % of the frame per half frame)
        if abs(z - z0) > 0.003:
            subs = [cam(t - 0.5 / fps * k / 3) for k in range(4)]
            out = np.mean([warp(img, *c).astype(np.float32) for c in subs], axis=0).round().astype(np.uint8)
        else:
            out = warp(img, z, x, y)
    enc.stdin.write(out.tobytes())
    n += 1
enc.stdin.close()
enc.wait()
dec.wait()
print(f"camera: {n} frames, {len(K)} keyframes -> {dst}")
