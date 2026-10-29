"""Thumbnail / Instagram cover z HTML šablony -> PNG (Playwright, fonty a barvy z engine/style.css).

python tools/cover.py covers/thumb_16x9.html                     # 1920x1080 -> covers/thumb_16x9.png
python tools/cover.py covers/cover_9x16.html --size 1080x1920    # Instagram cover, podstatné ve středu 3:4
"""
import argparse
from pathlib import Path

from playwright.sync_api import sync_playwright


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("html"); ap.add_argument("--size", default="1920x1080"); ap.add_argument("--out")
    a = ap.parse_args()
    w, h = map(int, a.size.lower().split("x"))
    src = Path(a.html).resolve(); out = Path(a.out) if a.out else src.with_suffix(".png")
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={"width": w, "height": h})
        pg.goto(src.as_uri()); pg.wait_for_timeout(900)
        # přetečení nadpisu = zalomí se a překryje zbytek -> varuj
        over = pg.evaluate("[...document.querySelectorAll('.t1,.t2')].filter(e => e.scrollWidth > e.clientWidth + 2 || e.getBoundingClientRect().height > 1.6 * parseFloat(getComputedStyle(e).fontSize) * 1.2).map(e => e.textContent)")
        if over: print("POZOR, nadpis se zalamuje/přetéká:", over, "-> zmenši font nebo white-space:nowrap")
        pg.screenshot(path=str(out)); b.close()
    print(out)


if __name__ == "__main__":
    main()
