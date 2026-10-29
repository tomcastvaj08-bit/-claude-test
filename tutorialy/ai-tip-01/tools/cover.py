"""Thumbnail / Instagram cover / storka / pozadí z HTML šablony -> PNG (Playwright, fonty a barvy z engine/style.css).

python tools/cover.py covers/thumb_16x9.html                                  # 1920x1080 -> covers/thumb_16x9.png
python tools/cover.py covers/cover_9x16.html --size 1080x1920                 # IG cover, podstatné ve středu 3:4
python tools/cover.py covers/story_9x16.html --size 1080x1920 --slides 1,2,3 --story   # storky -> story_9x16_1..3.png
python tools/cover.py covers/pozadi_9x16.html --size 1080x1920                # pozadí bez textu
--story = kontrola bezpečné zóny storky (text v y 260–1600, x 90–990) a překryvů karet.
"""
import argparse
from pathlib import Path

from playwright.sync_api import sync_playwright

CHECK_STORY = """() => {
  const on = document.querySelector('.slide.on') || document.body, bad = [];
  const els = [...on.querySelectorAll('*')].filter(e => {
    const r = e.getBoundingClientRect(); if (!r.width || !r.height) return false;
    return [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) || e.tagName === 'IMG';
  });
  for (const e of els) { const r = e.getBoundingClientRect();
    if (r.top < 260 || r.bottom > 1600 || r.left < 90 || r.right > 990) bad.push('MIMO ZÓNU: ' + (e.textContent || e.src).trim().slice(0, 40) + ` [${r.left|0},${r.top|0} → ${r.right|0},${r.bottom|0}]`); }
  const cards = [...on.querySelectorAll('.card,.pad,.brand')].map(e => [e, e.getBoundingClientRect()]);
  for (let i = 0; i < cards.length; i++) for (let j = i + 1; j < cards.length; j++) {
    const [a, A] = cards[i], [b, B] = cards[j]; if (a.contains(b) || b.contains(a)) continue;
    const ox = Math.min(A.right, B.right) - Math.max(A.left, B.left), oy = Math.min(A.bottom, B.bottom) - Math.max(A.top, B.top);
    if (ox > 4 && oy > 4) bad.push('PŘEKRYV: ' + a.textContent.trim().slice(0, 25) + ' × ' + b.textContent.trim().slice(0, 25)); }
  return bad; }"""


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("html"); ap.add_argument("--size", default="1920x1080"); ap.add_argument("--out")
    ap.add_argument("--slides", help="např. 1,2,3 -> otevře html?s=N a uloží <jméno>_N.png"); ap.add_argument("--story", action="store_true")
    a = ap.parse_args()
    w, h = map(int, a.size.lower().split("x"))
    src = Path(a.html).resolve(); out = Path(a.out) if a.out else src.with_suffix(".png")
    jobs = [(src.as_uri() + f"?s={s}", out.with_name(f"{out.stem}_{s}.png")) for s in a.slides.split(",")] if a.slides else [(src.as_uri(), out)]
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={"width": w, "height": h})
        for url, dst in jobs:
            pg.goto(url); pg.wait_for_timeout(900)
            # přetečení nadpisu = zalomí se a překryje zbytek -> varuj
            over = pg.evaluate("[...document.querySelectorAll('.t1,.t2')].filter(e => e.scrollWidth > e.clientWidth + 2 || e.getBoundingClientRect().height > 1.6 * parseFloat(getComputedStyle(e).fontSize) * 1.2).map(e => e.textContent)")
            if over: print("POZOR, nadpis se zalamuje/přetéká:", over, "-> zmenši font nebo white-space:nowrap")
            if a.story:
                for msg in pg.evaluate(CHECK_STORY): print("POZOR", dst.name, msg)
            pg.screenshot(path=str(dst)); print(dst)
        b.close()


if __name__ == "__main__":
    main()
