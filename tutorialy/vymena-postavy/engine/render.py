"""Render timeline po snímcích: Playwright (Chromium) -> raw RGB -> ffmpeg.

python engine/render.py --tl ../timeline/test.js --out out/test.mp4 [--start 0 --end 14] [--jobs 4] [--mblur]
python engine/render.py --tl ../timeline/test.js --still 6.5 --out out/still.png
"""
import argparse, asyncio, io, math, os, subprocess, sys, time
from pathlib import Path
from urllib.parse import quote

import numpy as np
from PIL import Image
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent
FPS = 30
ARGS = ["--run-all-compositor-stages-before-draw", "--use-angle=d3d11", "--enable-gpu-rasterization", "--ignore-gpu-blocklist", "--disable-web-security",
        "--allow-file-access-from-files", "--force-color-profile=srgb", "--hide-scrollbars"]


SUBS = False
VERBOSE = False


def url(tl, t=0):
    return (ROOT / "index.html").as_uri() + f"?tl={quote(tl)}&t={t}" + ("&subs=1" if SUBS else "")


async def open_page(pw, tl):
    b = await pw.chromium.launch(args=ARGS, headless=True)
    pg = await b.new_page(viewport={"width": 1920, "height": 1080}, device_scale_factor=1)
    pg.on("console", lambda m: m.type in ("error", "warning") and print("[page]", m.text, file=sys.stderr))
    pg.on("pageerror", lambda e: print("[pageerror]", e, file=sys.stderr))
    await pg.goto(url(tl))
    await pg.wait_for_function("window.__ready === true", timeout=120000)
    info = await pg.evaluate("ENGINE.ready()")
    return b, pg, info


async def grab(pg):
    buf = await pg.screenshot(type="jpeg", quality=96)
    return np.asarray(Image.open(io.BytesIO(buf)).convert("RGB"))


async def render_range(tl, f0, f1, out, mblur, label=""):
    async with async_playwright() as pw:
        b, pg, info = await open_page(pw, tl)
        ff = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", "1920x1080",
                               "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "15",
                               "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(out)], stdin=subprocess.PIPE)
        t0 = time.time()
        for f in range(f0, f1):
            t = f / FPS
            try:
                speed = await asyncio.wait_for(pg.evaluate(f"ENGINE.seekAsync({t})"), 60)
                img = await asyncio.wait_for(grab(pg), 60)
            except asyncio.TimeoutError:
                print(f"{label} TIMEOUT na snímku {f} (t={t:.2f})", flush=True); raise
            # motion blur: při rychlém pohybu kamery průměr sub-snímků (shutter 180°)
            k = min(10, int(speed / 14)) if mblur else 0
            if k >= 2:
                acc = img.astype(np.float32)
                for i in range(1, k):
                    await pg.evaluate(f"ENGINE.seekAsync({t + (i / k - .5) * 0.5 / FPS})")
                    acc += (await grab(pg)).astype(np.float32)
                img = (acc / k).clip(0, 255).astype(np.uint8)
            ff.stdin.write(img.tobytes())
            if (f - f0) % 60 == 0 or VERBOSE:
                el = time.time() - t0
                print(f"{label} frame {f}/{f1} t={t:.2f} ({(f - f0 + 1) / max(el, 1e-6):.1f} fps)", flush=True)
        ff.stdin.close(); ff.wait()
        await b.close()


async def still(tl, t, out):
    async with async_playwright() as pw:
        b, pg, _ = await open_page(pw, tl)
        await pg.evaluate("ENGINE.setSettle(true)")
        for tt in (t if isinstance(t, list) else [t]):
            await pg.evaluate(f"ENGINE.seekAsync({tt})")
            await pg.evaluate("new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))")
            o = out if not isinstance(t, list) else str(out).replace(".png", f"_{tt:07.2f}.png")
            await pg.screenshot(path=o)
            print("still", o)
        await b.close()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--tl", default="../build/tl.js", help="cesta k timeline relativně k engine/index.html")
    ap.add_argument("--subs", action="store_true", help="náhledové titulky s textem hlasu")
    ap.add_argument("--out", required=True)
    ap.add_argument("--start", type=float, default=0)
    ap.add_argument("--end", type=float, default=None)
    ap.add_argument("--jobs", type=int, default=1)
    ap.add_argument("--mblur", action="store_true")
    ap.add_argument("--verbose", action="store_true")
    ap.add_argument("--still", type=str, default=None, help="čas nebo čárkami oddělené časy")
    ap.add_argument("--audio", type=str, default=None)
    a = ap.parse_args()
    global SUBS, VERBOSE; SUBS = a.subs; VERBOSE = a.verbose
    out = Path(a.out).resolve(); out.parent.mkdir(parents=True, exist_ok=True)

    if a.still:
        ts = [float(x) for x in a.still.split(",")]
        asyncio.run(still(a.tl, ts if len(ts) > 1 else ts[0], out)); return

    end = a.end
    if end is None:
        async def dur():
            async with async_playwright() as pw:
                b, pg, info = await open_page(pw, a.tl); await b.close(); return info["duration"]
        end = asyncio.run(dur())
    f0, f1 = int(round(a.start * FPS)), int(round(end * FPS))
    t_start = time.time()
    if a.jobs <= 1:
        parts = [out if not a.audio else out.with_suffix(".noaudio.mp4")]
        asyncio.run(render_range(a.tl, f0, f1, parts[0], a.mblur))
    else:
        step = math.ceil((f1 - f0) / a.jobs)
        parts = [out.with_name(f"{out.stem}.part{i:02d}.mp4") for i in range(a.jobs)]

        async def all_jobs():
            await asyncio.gather(*[render_range(a.tl, f0 + i * step, min(f1, f0 + (i + 1) * step), parts[i], a.mblur, f"[job{i}]")
                                   for i in range(a.jobs) if f0 + i * step < f1])
        asyncio.run(all_jobs())
        lst = out.with_suffix(".txt")
        lst.write_text("".join(f"file '{p.as_posix()}'\n" for p in parts if p.exists()), encoding="utf-8")
        joined = out if not a.audio else out.with_suffix(".noaudio.mp4")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(joined)], check=True)
        for p in parts: p.unlink(missing_ok=True)
        lst.unlink(missing_ok=True)
        parts = [joined]
    if a.audio:
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(parts[0]), "-ss", str(a.start), "-t", str(end - a.start), "-i", a.audio,
                        "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", "-shortest", str(out)], check=True)
        parts[0].unlink(missing_ok=True)
    print(f"done {out} in {time.time() - t_start:.0f}s")


if __name__ == "__main__":
    main()
