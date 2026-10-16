"""02 FRAME BREAK  (reel effect 04/17, measured at 2.40-3.05 s of the reference)

Measured at 30 fps:
  f0-f3   full-frame shot (enters on a hard cut).
  f4-f13  the shot shrinks into a rounded 'reel' window (scale 1 -> 0.667, ease-in-out,
          fastest around f8).  The window is a tighter crop than the scaled picture, so the
          subject's head / hands stick out over the window edge (cut-out on top).
          Everything outside the window = same footage, heavily blurred and darkened.
  f12-f17 reel UI (heart, comment, send, user row, progress bar) fades in, staggered.
"""
import numpy as np, cv2
from PIL import Image, ImageDraw
from fxlib import *

V, V_small = load_clip(270.3, 2.3, 700)    # Thom walking, head at top edge, arms swinging
M = person_masks(V_small)

S_END = 0.667
WIN_END = (0.155, 0.125, 0.845, 0.92)       # window in SOURCE coords (x0, y0, x1, y1)
# measured scale per frame from f4 on, normalised to progress 0..1
SCALE = [0.97, 0.95, 0.92, 0.88, 0.78, 0.72, 0.69, 0.675, 0.668, 0.667]
START = 4
AX, AY = W / 2, H / 2                        # scale anchor


def ui_layer(rw, rh, t):
    """Reel UI drawn in window space; t = frames since UI start."""
    im = Image.new("RGBA", (rw, rh), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    u = rw / 100

    def a(delay):  # staggered 3-frame fade
        return int(255 * clamp01((t - delay + 1) / 3))
    x = rw - 9 * u
    # heart
    al = a(0)
    if al:
        y = rh * .70
        d.polygon([(x, y + 3 * u), (x - 3 * u, y), (x - 3 * u, y - 1.2 * u), (x - 1.6 * u, y - 2.4 * u),
                   (x, y - 1.2 * u), (x + 1.6 * u, y - 2.4 * u), (x + 3 * u, y - 1.2 * u), (x + 3 * u, y)],
                  outline=(255, 255, 255, al), width=max(2, int(.55 * u)))
    al = a(1)
    if al:  # comment bubble
        y = rh * .765
        d.ellipse([x - 2.8 * u, y - 2.8 * u, x + 2.8 * u, y + 2.8 * u], outline=(255, 255, 255, al), width=max(2, int(.55 * u)))
    al = a(2)
    if al:  # send arrow
        y = rh * .83
        d.polygon([(x - 3 * u, y - 2.6 * u), (x + 3 * u, y - 2.6 * u), (x, y + 2.8 * u)], outline=(255, 255, 255, al), width=max(2, int(.55 * u)))
    al = a(3)
    if al:  # user row + follow pill + caption line + progress
        y = rh * .905
        d.ellipse([5 * u, y - 3 * u, 11 * u, y + 3 * u], fill=(200, 200, 200, al))
        d.text((13 * u, y - 2.2 * u), "tearsofsteel", font=font(FONT_BOLD, int(3.6 * u)), fill=(255, 255, 255, al))
        d.rounded_rectangle([40 * u, y - 2.4 * u, 54 * u, y + 2.4 * u], 1.2 * u, outline=(255, 255, 255, al), width=2)
        d.text((42.3 * u, y - 1.9 * u), "Follow", font=font(FONT_BOLD, int(3 * u)), fill=(255, 255, 255, al))
        d.rounded_rectangle([5 * u, y + 4.5 * u, 60 * u, y + 5.6 * u], .5 * u, fill=(255, 255, 255, al // 2))
        d.rectangle([0, rh - 1.1 * u, rw * .35, rh], fill=(255, 255, 255, al))
        d.rectangle([rw * .35, rh - 1.1 * u, rw, rh], fill=(255, 255, 255, al // 4))
    arr = np.asarray(im)[..., [2, 1, 0, 3]]
    return np.ascontiguousarray(arr)


out = Writer("02_frame_break.mp4")
for i in range(len(V)):
    src, m = V[i], M[i]
    k = i - START
    if k < 0:
        out.write(counter_pill(src.copy(), "02/05")); continue
    s = SCALE[min(k, len(SCALE) - 1)]
    p = (1 - s) / (1 - S_END)
    # background: blurred + darkened footage, olive tint like the reference
    bg = cv2.GaussianBlur(cv2.resize(src, (W // 4, H // 4)), (0, 0), 9)
    bg = cv2.resize(bg, (W, H)).astype(np.float32)
    dark = lerp(1.0, 0.28, ease_out_cubic(p * 1.6))
    frame = (bg * dark).astype(np.uint8)
    # scaled picture
    Mx = np.float32([[s, 0, AX - s * AX], [0, s, AY - s * AY]])
    pic = cv2.warpAffine(src, Mx, (W, H), flags=cv2.INTER_LINEAR)
    pm = cv2.warpAffine(m, Mx, (W, H), flags=cv2.INTER_LINEAR)
    # window = interpolated crop rect (source coords) mapped through the same transform
    wx0, wy0, wx1, wy1 = [lerp(0 if j < 2 else 1, e, p) for j, e in enumerate(WIN_END)]
    X0, Y0 = AX + (wx0 * W - AX) * s, AY + (wy0 * H - AY) * s
    X1, Y1 = AX + (wx1 * W - AX) * s, AY + (wy1 * H - AY) * s
    X0, Y0, X1, Y1 = int(round(X0)), int(round(Y0)), int(round(X1)), int(round(Y1))
    rw, rh = X1 - X0, Y1 - Y0
    win = np.zeros((H, W), np.float32)
    win[Y0:Y1, X0:X1] = rounded_mask(rw, rh, int(lerp(0, 0.06 * rw, p)))
    # soft drop shadow under the window
    sh = cv2.GaussianBlur(win, (0, 0), 30) * 0.5 * p
    frame = (frame.astype(np.float32) * (1 - sh[..., None])).astype(np.uint8)
    frame = over(frame, pic, win)
    # break-out: cut-out of the subject on top (only above the window's bottom edge)
    brk = pm.copy(); brk[Y1:] = 0
    frame = over(frame, pic, np.maximum(brk * p ** 0.5, 0) * (1 - win) + win * 0)  # outside window only
    # reel UI
    if k >= 8:
        frame = over_rgba(frame, ui_layer(rw, rh, k - 8), X0, Y0)
    out.write(counter_pill(frame, "02/05"))
out.close()
