"""Shared helpers for the transition replicas (1080x1920 @ 30 fps)."""
import os, subprocess, functools
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H, FPS = 1080, 1920, 30
HERE = os.path.dirname(os.path.abspath(__file__))
SCRATCH = os.environ.get("FX_SCRATCH", "/tmp/claude-0/-home-user--claude-test/1d1c62e0-8098-5d03-8ffc-bcf7fed02b9c/scratchpad")
STOCK = os.path.join(SCRATCH, "stock", "tos.mov")  # Tears of Steel 1080p (CC-BY Blender Foundation)
OUT = os.path.join(HERE, "out")
os.makedirs(OUT, exist_ok=True)

FONT_BOLD = "/usr/share/fonts/opentype/inter/InterDisplay-Bold.otf"
FONT_XBOLD = "/usr/share/fonts/opentype/inter/InterDisplay-ExtraBold.otf"
FONT_BLACK = "/usr/share/fonts/opentype/inter/InterDisplay-Black.otf"
FONT_MED = "/usr/share/fonts/opentype/inter/InterDisplay-Medium.otf"
FONT_SERIF_IT = os.path.join(SCRATCH, "fonts", "PlayfairDisplay-Italic.ttf")


# ---------------------------------------------------------------- footage
def load_clip(t0, dur, cx, src=STOCK):
    """9:16 crop (450x800 from the 1920x800 film) centred on x=cx, resampled to 30 fps.
    Returns (frames_full[N,H,W,3] uint8 BGR, frames_small[N,800,450,3])."""
    cw, ch = 450, 800
    x = int(np.clip(cx - cw // 2, 0, 1920 - cw))
    cmd = ["ffmpeg", "-loglevel", "error", "-ss", str(t0), "-t", str(dur), "-i", src,
           "-vf", f"crop={cw}:{ch}:{x}:0,fps={FPS}", "-f", "rawvideo", "-pix_fmt", "bgr24", "-"]
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    small = np.frombuffer(raw, np.uint8).reshape(-1, ch, cw, 3)
    full = np.stack([cv2.resize(f, (W, H), interpolation=cv2.INTER_LANCZOS4) for f in small])
    return full, small


@functools.lru_cache(1)
def _segmenter():
    from mediapipe.tasks.python import vision, BaseOptions
    return vision.ImageSegmenter.create_from_options(vision.ImageSegmenterOptions(
        base_options=BaseOptions(model_asset_path=os.path.join(SCRATCH, "models", "seg.tflite")),
        output_confidence_masks=True))


def person_masks(small, smooth=0.5):
    """Float person mask [N,H,W] in 0..1 at full res, temporally smoothed."""
    import mediapipe as mp
    seg = _segmenter()
    out, prev = [], None
    for f in small:
        rgb = np.ascontiguousarray(cv2.cvtColor(f, cv2.COLOR_BGR2RGB))
        r = seg.segment(mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb))
        m = 1.0 - r.confidence_masks[0].numpy_view().reshape(f.shape[:2])
        m = m if prev is None else smooth * prev + (1 - smooth) * m
        prev = m
        out.append(m)
    full = []
    for m in out:
        m = cv2.resize(m.astype(np.float32), (W, H), interpolation=cv2.INTER_CUBIC)
        m = np.clip((m - 0.5) * 6 + 0.5, 0, 1)  # tighten edge
        full.append(cv2.GaussianBlur(m, (0, 0), 1.5))
    return np.stack(full)


# ---------------------------------------------------------------- writer
class Writer:
    def __init__(self, name, audio=None):
        self.path = os.path.join(OUT, name)
        self.p = subprocess.Popen(
            ["ffmpeg", "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24",
             "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "medium",
             "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart", self.path],
            stdin=subprocess.PIPE)
        self.n = 0

    def write(self, frame):
        self.p.stdin.write(np.ascontiguousarray(frame, dtype=np.uint8).tobytes())
        self.n += 1

    def close(self):
        self.p.stdin.close(); self.p.wait()
        print(f"wrote {self.path} ({self.n} frames, {self.n / FPS:.2f}s)")


# ---------------------------------------------------------------- easing
def clamp01(x): return max(0.0, min(1.0, x))
def ease_out_cubic(t): t = clamp01(t); return 1 - (1 - t) ** 3
def ease_in_cubic(t): t = clamp01(t); return t ** 3
def ease_in_out_cubic(t):
    t = clamp01(t); return 4 * t ** 3 if t < .5 else 1 - (-2 * t + 2) ** 3 / 2
def ease_out_back(t, s=1.70158):
    t = clamp01(t) - 1; return 1 + (s + 1) * t ** 3 + s * t ** 2
def lerp(a, b, t): return a + (b - a) * t


# ---------------------------------------------------------------- geometry
def scale_about(img, s, cx, cy, border=cv2.BORDER_REFLECT):
    M = np.float32([[s, 0, cx - s * cx], [0, s, cy - s * cy]])
    return cv2.warpAffine(img, M, (img.shape[1], img.shape[0]), flags=cv2.INTER_LINEAR, borderMode=border)


def zoom_blur(img, s, cx, cy, strength, samples=14):
    """Radial (zoom) motion blur: average of copies scaled from s to s*(1+strength)."""
    if strength < 0.004:
        return scale_about(img, s, cx, cy)
    acc = np.zeros(img.shape, np.float32)
    for i in range(samples):
        k = s * (1 + strength * i / (samples - 1))
        acc += scale_about(img, k, cx, cy)
    return (acc / samples).astype(np.uint8)


def rounded_mask(w, h, r, ss=4):
    m = Image.new("L", (w * ss, h * ss), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, w * ss - 1, h * ss - 1], r * ss, fill=255)
    return np.asarray(m.resize((w, h), Image.LANCZOS), np.float32) / 255


def over(dst, src_rgb, alpha):
    """alpha-composite src over dst (float alpha HxW)."""
    a = alpha[..., None]
    return (src_rgb.astype(np.float32) * a + dst.astype(np.float32) * (1 - a)).astype(np.uint8)


def over_rgba(dst, rgba, x=0, y=0):
    """Composite a BGRA uint8 layer onto dst at (x, y)."""
    h, w = rgba.shape[:2]
    x0, y0, x1, y1 = max(x, 0), max(y, 0), min(x + w, dst.shape[1]), min(y + h, dst.shape[0])
    if x1 <= x0 or y1 <= y0:
        return dst
    sub = rgba[y0 - y:y1 - y, x0 - x:x1 - x]
    a = sub[..., 3:4].astype(np.float32) / 255
    region = dst[y0:y1, x0:x1].astype(np.float32)
    dst[y0:y1, x0:x1] = (sub[..., :3] * a + region * (1 - a)).astype(np.uint8)
    return dst


# ---------------------------------------------------------------- text
def font(path, size): return ImageFont.truetype(path, size)


def text_layer(text, fnt, fill=(255, 255, 255), shadow=True, tracking=0, pad=40):
    """BGRA layer with a soft drop shadow (the reel's captions use a subtle dark shadow)."""
    if tracking:
        widths = [fnt.getlength(c) + tracking for c in text]
        tw = int(sum(widths) - tracking)
    else:
        tw = int(fnt.getlength(text))
    asc, desc = fnt.getmetrics()
    w, h = tw + 2 * pad, asc + desc + 2 * pad
    txt = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(txt)
    if tracking:
        x = pad
        for c, cw in zip(text, widths):
            d.text((x, pad), c, font=fnt, fill=fill + (255,)); x += cw
    else:
        d.text((pad, pad), text, font=fnt, fill=fill + (255,))
    if shadow:
        a = txt.split()[3].filter(ImageFilter.GaussianBlur(10))
        sh = Image.new("RGBA", (w, h), (0, 0, 0, 0)); sh.putalpha(a.point(lambda v: int(v * .55)))
        base = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        base.alpha_composite(sh, (0, 4)); base.alpha_composite(txt)
        txt = base
    arr = np.asarray(txt)
    return np.ascontiguousarray(arr[..., [2, 1, 0, 3]])  # RGBA->BGRA


def transform_layer(layer, scale=1.0, blur=0.0, opacity=1.0, angle=0.0):
    out = layer
    if scale != 1.0 or angle:
        h, w = out.shape[:2]
        M = cv2.getRotationMatrix2D((w / 2, h / 2), angle, scale)
        out = cv2.warpAffine(out, M, (w, h), flags=cv2.INTER_LINEAR, borderValue=(0, 0, 0, 0))
    if blur > 0.3:
        out = cv2.GaussianBlur(out, (0, 0), blur)
    if opacity < 1:
        out = out.copy(); out[..., 3] = (out[..., 3] * opacity).astype(np.uint8)
    return out


def place_center(dst, layer, cx, cy):
    h, w = layer.shape[:2]
    return over_rgba(dst, layer, int(cx - w / 2), int(cy - h / 2))


def blur_in(k, frames=3):
    """The reel's caption entrance: blur 14px->0, opacity 0->1, scale 1.12->1 over ~3 frames.
    k = frame index since start (0-based). Returns (scale, blur, opacity)."""
    t = clamp01((k + 1) / frames)
    e = ease_out_cubic(t)
    return lerp(1.12, 1.0, e), lerp(14, 0, e), lerp(0.15, 1, e)


def blur_out(k, frames=2):
    t = clamp01((k + 1) / frames)
    return 1.0, lerp(0, 14, t), lerp(1, 0, t)


def counter_pill(frame, label):
    """Small dark pill top-left like the reel's '09/17' counter."""
    f = font(FONT_BOLD, 44)
    tw = int(f.getlength(label))
    pill = Image.new("RGBA", (tw + 56, 84), (0, 0, 0, 0))
    d = ImageDraw.Draw(pill)
    d.rounded_rectangle([0, 0, tw + 55, 83], 42, fill=(25, 25, 25, 170))
    d.text((28, 14), label, font=f, fill=(255, 255, 255, 235))
    arr = np.asarray(pill)[..., [2, 1, 0, 3]]
    return over_rgba(frame, np.ascontiguousarray(arr), 60, 70)
