"""Worked example of the motion-director house style (16:9, 30 fps, ~10 s).

Beat sheet
| # | world        | caption pattern                      | transition out        | depth |
| 1 | Ember        | C1 kinetic stack, A4 on hero words   | T1 whip-flash         | robot disintegrates (T6) on SAME |
| 2 | black + red  | C5 typewriter + red highlight block  | T2 pixel blocks       | — |
| 3 | Void Grid    | C8 counter + A7 3D swing, C4 decode  | T3 glitch slice       | grid floor, robot on floor |
| 4 | Poster Cream | C9 headline A9 + rule + mono labels  | T13 black breath      | — |
| 5 | Ember Spot   | C7 arched words behind robot         | end                   | D1 occlusion |
Usage: python3 demo.py [out.mp4] [--vertical]
"""
import sys, math
import numpy as np, cv2
from mdlib import *

VERT = "--vertical" in sys.argv
W, H = (1080, 1920) if VERT else (1920, 1080)
OUT = next((a for a in sys.argv[1:] if a.endswith(".mp4")), "demo_16x9.mp4")
U = W / 1920 if not VERT else W / 1080 * 0.75   # type scale unit
w = Writer(OUT, W, H)


def emit(fr, k):
    w.write(finish(fr, k))


# ------------------------------------------------------------------ beat 1 — Ember kinetic stack
ROB = robot_sprite(px=int(24 * U * (1.4 if VERT else 1)))
rx, ry = (W * 0.30, H * 0.52) if not VERT else (W * 0.5, H * 0.66)
STACK = [  # (frame, text, role, size, colour, anim)
    (4, "everyone's", "base", 70, C["white"], "pop"),
    (10, "asking", "round", 170, C["white"], "skew"),
    (18, "the", "base", 60, C["white"], "pop"),
    (22, "SAME", "condensed", 330, C["cream"], "skew"),
    (34, "thing", "serif_it", 130, C["cream"], "blur"),
]
SX, SY = (W * 0.47, H * 0.22) if not VERT else (W * 0.10, H * 0.14)
LINE_Y = [0, 72, 158, 300, 470]
B1 = 60
base1 = radial_bg(W, H, C["ember_c"], C["ember_e"], cx=0.45, cy=0.5)
last_A = None
for k in range(B1):
    fr = base1.copy()
    embers(fr, k, n=10)
    # robot: idle bob, disintegrate on SAME (f22..27), reassemble f28..31
    bob = 4 if (k // 8) % 2 else 0
    if 22 <= k < 28:
        L = fx_disintegrate(ROB, k - 22)
        place(fr, L, rx, ry)
    elif 28 <= k < 32:
        L = fx_disintegrate(ROB, k - 28, frames=4, reverse=True)
        place(fr, L, rx, ry)
    else:
        contact_shadow(fr, rx, ry + ROB.shape[0] / 2, ROB.shape[1] * 0.9)
        place(fr, robot_sprite(ROB.shape[0] // 16, blink=(k % 45) in (40, 41)), rx, ry - bob)
    # stack drawn on a separate RGBA canvas, rotated −6° (C1)
    alpha_canvas = np.zeros((H, W, 4), np.uint8)
    for (t0, text, role, size, col, an) in STACK:
        kk = k - t0
        if kk < 0: continue
        f = F(role, int(size * U))
        y = SY + LINE_Y[STACK.index((t0, text, role, size, col, an))] * U
        x = SX + (12 * U if text == "the" else 0)
        word = np.zeros((H, W, 4), np.uint8)
        if an == "skew":
            # draw on black, recover alpha from a white pass, un-premultiply
            rgb = np.zeros((H, W, 3), np.uint8); white = np.zeros((H, W, 3), np.uint8)
            draw_skew_slide(rgb, text, f, x, y, kk, col)
            draw_skew_slide(white, text, f, x, y, kk, (255, 255, 255))
            a = white.max(2).astype(np.float32)
            word[..., :3] = (rgb.astype(np.float32) * 255 / np.maximum(a, 1)[..., None]).clip(0, 255)
            word[..., 3] = a
        else:
            spec = anim_pop(kk) if an == "pop" else anim_blur_in(kk, 4)
            L = tf(text_layer(text, f, col), spec["scale"], blur=spec["blur"], opacity=spec["opacity"])
            place_rgba(word, L, x + text_layer(text, f, col).shape[1] / 2, y)  # left edge at x
        # composite word onto stack canvas
        a = word[..., 3:4].astype(np.float32) / 255
        alpha_canvas[..., :3] = (word[..., :3] * a + alpha_canvas[..., :3] * (1 - a)).astype(np.uint8)
        alpha_canvas[..., 3] = np.maximum(alpha_canvas[..., 3], word[..., 3])
    M = cv2.getRotationMatrix2D((SX + 200 * U, SY + 200 * U), 6, 1.0)
    rot = cv2.warpAffine(alpha_canvas, M, (W, H), flags=cv2.INTER_LINEAR, borderValue=(0, 0, 0, 0))
    over(fr, rot, 0, 0)
    emit(fr, k)
    last_A = fr

# ------------------------------------------------------------------ beat 2 — typewriter on black/red
B2 = 46
TXT = "Because Claude didn't make it"
f2 = F("base", int(104 * U))
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
glow = np.exp(-(((xx - W * 0.5) / (W * 0.45)) ** 2 + ((yy - H * 1.05) / (H * 0.5)) ** 2))
base2 = (glow[..., None] * np.array([120, 8, 10])).astype(np.uint8)
cv2.circle(base2, (W // 2, int(H * 0.5)), int(H * 0.28), (40, 6, 8), 2, cv2.LINE_AA)
while f2.getlength(TXT) > W * 0.86:   # keep the 7 % side margin (typography.md §5)
    f2 = F("base", f2.size - 4)
tx = W / 2 - (f2.getlength(TXT) + 2 * (int(f2.size * 0.35) + 12)) / 2


def beat2(k):
    fr = base2.copy()
    embers(fr, k, n=14, seed=8, color=(230, 40, 40))
    draw_typewriter(fr, TXT, f2, tx, H * 0.5, k - 2, per_char=1.2, accent_range=(8, 14), rng=np.random.default_rng(k))
    return fr


first_B = beat2(0)
for i, fr in enumerate(tr_whip_flash(last_A, first_B, H, W)):
    emit(fr, B1 + i)
for k in range(B2):
    fr = beat2(k)
    emit(fr, 200 + k)
    last_A = fr

# ------------------------------------------------------------------ beat 3 — Void Grid counter + decode
B3 = 66
grid = grid_floor(W, H)
fdig = F("pixel", int(220 * U)); fkb = F("round", int(150 * U)); fmot = F("condensed", int(250 * U))
r3x, r3y = W * 0.78, H * 0.70


def beat3(k):
    fr = grid.copy()
    contact_shadow(fr, r3x, r3y + ROB.shape[0] / 2, ROB.shape[1])
    place(fr, robot_sprite(ROB.shape[0] // 16), r3x, r3y - (4 if (k // 8) % 2 else 0))
    if k >= 2:
        v = anim_counter(k - 2, 0, 50, 14)
        D = text_layer(f"{v:02d}", fdig, C["orange"], shadow=False)
        gl = tf(D, blur=8); gl[..., 3] = (gl[..., 3] * 0.5).astype(np.uint8)
        place_left(fr, gl, W * 0.07 - 8, H * 0.22); place_left(fr, D, W * 0.07, H * 0.22)
        for i in range(min(18, k)):  # dotted arc trail
            a = -0.2 - i * 0.09
            px, py = W * 0.36 + math.cos(a) * W * 0.12 * (i / 6), H * 0.20 - math.sin(a) * H * 0.02 * i
            cv2.rectangle(fr, (int(px), int(py)), (int(px + 6), int(py + 6)), C["cyan"] if i % 2 else C["grid"], -1)
    if k >= 13:
        draw_swing3d(fr, "kilobytes", fkb, W * 0.27, H * 0.45, k - 13)
    if k >= 30:
        draw_binary_decode(fr, "MOTION", fmot, W * 0.25, H * 0.68, k - 30, color=C["red"])
    return fr


for k in range(8):
    emit(tr_pixel_blocks(last_A, beat3(k), k), 300 + k)
for k in range(8, B3):
    fr = beat3(k); emit(fr, 300 + k); last_A = fr

# ------------------------------------------------------------------ beat 4 — editorial poster
B4 = 40
fhead = F("expanded", int(250 * U))
fsub = F("serif_it", int(70 * U))
paper = poster_bg(W, H, C["paper"], paper=True)


def beat4(k):
    fr = paper.copy()
    draw_glitch_build(fr, "CAMERA.", fhead, W * 0.05 - (int(fhead.size * .35) + 12), H * 0.55, k - 1)
    poster_frame(fr, "0 CAMERAS  /  0 LIGHTS  /  0 CREW", "02 / 04", C["ink"], k / B4, rule_y=0.68)
    if k >= 12:
        s = anim_blur_in(k - 12, 4)
        L = tf(text_layer("rendered, not filmed.", fsub, C["ink"], shadow=False), s["scale"], blur=s["blur"], opacity=s["opacity"])
        place(fr, L, W * 0.80, H * 0.80)
    return fr


for k in range(3):
    emit(tr_glitch_slice(last_A, beat4(k), k), 400 + k)
for k in range(3, B4):
    fr = beat4(k); emit(fr, 400 + k); last_A = fr

# ------------------------------------------------------------------ beat 5 — arched words behind robot (D1)
for k in range(4):  # T13 black breath
    emit((last_A * [0.25, 0, 0, 0][k]).astype(np.uint8), 500 + k)
B5 = 70
spot = radial_bg(W, H, C["spot_c"], C["spot_e"], cx=0.5, cy=0.42, r=0.55)
BIG = int(30 * U * (1.25 if VERT else 1))
ROB5 = robot_sprite(px=BIG)
fa = F("round", int(210 * U)); fs = F("base_med", int(70 * U))
WORDS = [(0, "cheapest", "it will be.", -6), (34, "won't stay", "this cheap.", 7)]
cx5, cy5 = W / 2, H * 0.62
for k in range(B5):
    fr = spot.copy()
    for t0, word, small, tilt in WORDS:
        kk = k - t0
        nxt = [t for t, *_ in WORDS if t > t0]
        if kk < 0 or (nxt and k >= nxt[0] + 2): continue
        fade = clamp01((k - (nxt[0] - 1)) / 3) if nxt and k >= nxt[0] - 1 else None
        A = arc_text(word, fa, bend_deg=34, k=kk, fade=fade)
        A = tf(A, angle=tilt)
        place(fr, A, cx5, cy5 - ROB5.shape[0] * 0.30)  # low enough that the robot occludes the middle letters
        if kk >= 8:
            s = anim_blur_in(kk - 8, 4)
            S = tf(text_layer(small, fs, (205, 196, 188)), s["scale"], angle=-tilt * 0.8, blur=s["blur"], opacity=s["opacity"] * (1 - (fade or 0)))
            sx = cx5 + (ROB5.shape[1] * 0.95 if not VERT else ROB5.shape[1] * 0.35)
            sy = cy5 + (ROB5.shape[0] * 0.18 if not VERT else ROB5.shape[0] * 0.95)
            place(fr, S, sx, sy)
    contact_shadow(fr, cx5, cy5 + ROB5.shape[0] / 2, ROB5.shape[1])
    place(fr, robot_sprite(BIG, blink=(k % 50) in (30, 31)), cx5, cy5 - (4 if (k // 8) % 2 else 0))
    emit(fr, 600 + k)
w.close()
