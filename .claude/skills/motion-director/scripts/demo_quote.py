"""Mode Q worked example — editorial quote edit, 1728×720, 30 fps.
Footage: any 2.4:1 source (default: Tears of Steel 1080p, CC-BY Blender Foundation).
usage: python3 demo_quote.py SOURCE.mov out.mp4 [seg_model.tflite]

Shot list follows the measured pace: hook 3.4 s, then shots of 0.4–1.4 s cut on words.
"""
import sys, subprocess
import numpy as np, cv2
from mdlib import F, C, Writer, text_layer, place, tf, clamp01
from qlib import *

SRC, OUT = sys.argv[1], sys.argv[2]
SEG = sys.argv[3] if len(sys.argv) > 3 else None
W, H, U = 1728, 720, 1.0


def clip(t0, n):
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-ss", str(t0), "-i", SRC, "-frames:v", str(n),
                          "-vf", f"scale={W}:{H},fps=30", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                         capture_output=True, check=True).stdout
    a = np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3).copy()
    return np.concatenate([a, np.repeat(a[-1:], max(0, n - len(a)), 0)]) if len(a) < n else a


def person_mask(fr):
    if not SEG: return None
    import mediapipe as mp
    from mediapipe.tasks.python import vision, BaseOptions
    global _seg
    if "_seg" not in globals():
        _seg = vision.ImageSegmenter.create_from_options(vision.ImageSegmenterOptions(
            base_options=BaseOptions(model_asset_path=SEG), output_confidence_masks=True))
    m = 1 - _seg.segment(mp.Image(image_format=mp.ImageFormat.SRGB, data=np.ascontiguousarray(fr))).confidence_masks[0].numpy_view()
    m = cv2.resize(m.reshape(fr.shape[0], fr.shape[1]), (W, H))
    return cv2.GaussianBlur(np.clip((m - .5) * 6 + .5, 0, 1).astype(np.float32), (0, 0), 1.5)


w = Writer(OUT, W, H)


def emit(fr):
    fr = brand(grade(fr), U, name="MOTION DIRECTOR")
    w.write(fr)


# 1 — hook 3.4 s: wide calm shot, slow push-in, serif flanking pair (L2)
A = clip(103.0, 102)   # one continuous calm wide shot, object centred
pairs = [(18, "every", "frame"), (52, "you", "call"), (80, "one", "cinema")]
for k, fr in enumerate(A):
    s = 1.0 + 0.05 * k / len(A)
    M = np.float32([[s, 0, W / 2 * (1 - s)], [0, s, H / 2 * (1 - s)]])
    fr = cv2.warpAffine(fr, M, (W, H), borderMode=cv2.BORDER_REFLECT)
    cur = [p for p in pairs if p[0] <= k]
    if cur:
        t0, l, r = cur[-1]
        flank_pair(fr, l, r if k >= t0 + 8 else "", W * 0.5, H * 0.52, 330, U * 1.1)
    emit(fr)

# 2 — collage 1.0 s + label box (F1 + L4)
stills = [clip(t, 1)[0] for t in (176, 264, 321, 557, 24)]
for k in range(30):
    fr = collage(stills, k, H, W)
    if k >= 4: label_box(fr, "was made up", k - 4, W * 0.28, H * 0.52, U)
    emit(fr)

# 3 — giant letter build "by" small + "people" with occlusion (L3) 1.1 s
B = clip(268.3, 33)
for k, fr in enumerate(B):
    m = person_mask(fr)
    src = fr.copy()
    giant_build(fr, "people", k, W / 2, H * 0.52, cap_frac=0.52, per_letter=5, mask=m, src=src)
    spread_row(fr, ["by"], [0], k, y_frac=0.12, u=U, slots=[0.10])
    emit(fr)

# 4 — spread row 1.3 s (L1)
Cc = clip(321.0, 40)
words = ["who", "were", "no", "smarter"]
for k, fr in enumerate(Cc):
    spread_row(fr, words, [0, 7, 15, 21], k, y_frac=0.50, u=U)
    emit(fr)

# 5 — word window "than" 0.6 s with glitch out
D = clip(366.3, 18)
for k, fr in enumerate(D):
    o = word_window(fr, "than", k, H, W, cap_frac=0.42, dissolve_at=6)
    emit(rgb_block_glitch(o, k) if k >= 16 else o)

# 6 — mosaic 1.4 s + label box (F2 + L4)
tiles_src = [clip(t, 42) for t in (24, 60, 100, 132, 186, 252, 300, 420, 470, 520, 600, 640)]
tiles = [(lambda c: (lambda k: c[min(k, len(c) - 1)]))(c) for c in tiles_src]
for k in range(42):
    fr = mosaic(tiles, k, H, W, per_frame=2)
    label_box(fr, "you.", max(0, k - 10), W * 0.42, H * 0.5, U) if k >= 10 else None
    emit(rgb_block_glitch(fr, k) if k >= 40 else fr)

# 7 — PiP over black with giant grey word (F3) 0.9 s, last box grows into next shot
E = clip(557.5, 30)
boxes = [(2, tiles[0], .22, .30, .14), (5, tiles[3], .70, .25, .12), (8, tiles[5], .55, .72, .16),
         (11, tiles[7], .15, .74, .12), (14, tiles[9], .86, .66, .13)]
gl, _ = giant_layer("Change", 0.60, H, QC["grey_word"])
for k in range(27):
    fr = np.zeros((H, W, 3), np.uint8)
    place(fr, gl, W / 2, H * 0.52)
    pip_over_black(fr, boxes, k)
    if k >= 24:  # last box grows to full frame (scale 0.3 → 1 in 2 f)
        s = [0.3, 0.65, 1.0][k - 24]
        im = cv2.resize(E[0], (int(W * s), int(H * s)))
        y, x = (H - im.shape[0]) // 2, (W - im.shape[1]) // 2
        fr[y:y + im.shape[0], x:x + im.shape[1]] = im
    emit(fr)

# 8 — spread row on the grown shot, red label (L1 + L4 red) 1.0 s
for k, fr in enumerate(E[:30]):
    spread_row(fr, ["it", "is", "yours"], [0, 6, 12], k, y_frac=0.12, u=U, slots=[0.08, 0.36, 0.70])
    if k >= 18: label_box(fr, "to", k - 18, W * 0.47, H * 0.62, U, red=True)
    emit(fr)

# 9 — hard slam giant word 0.5 s, then zoom-shrink onto next shot (L3)
G = clip(320.6, 15)
sl, _ = giant_layer("shape.", 0.78, H, medium=True)
for k in range(15):
    fr = G[k].copy()
    if k < 13:
        place(fr, sl, W / 2, H * 0.50)
    emit(fr)
Hh = clip(270.5, 36)
small = text_layer("shape.", F("edit", 28), C["white"], tracking=-0.02)
for k, fr in enumerate(Hh):
    if k == 0:
        place(fr, tf(sl, 0.2), W / 2, H * 0.5)
    else:
        place(fr, small, W / 2, H * 0.5)
    emit(fr)

# 10 — end card 2.5 s
for k in range(75):
    fr = np.zeros((H, W, 3), np.uint8)
    a = text_layer("PRODUCED BY", F("bold", 22), C["white"], shadow=False, tracking=0.02)
    b = text_layer("MOTION DIRECTOR", F("bold", 30), C["white"], shadow=False, tracking=0.02)
    place(fr, a, W / 2, H / 2 - 18); place(fr, b, W / 2, H / 2 + 14)
    w.write(fr)
w.close()
