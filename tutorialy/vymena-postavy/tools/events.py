"""Export událostí z enginu (kdy naskočí uzly, pohyby kamery, čáry) -> build/events.json pro zvukové efekty (bed.py).
Vypíše i varování „AT miss“ (slovo z AT() nenalezené v hlase) – ty je potřeba opravit v timeline.

python tools/events.py
"""
import asyncio, json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "engine"))


async def run():
    from playwright.async_api import async_playwright
    import render
    async with async_playwright() as pw:
        b, pg, info = await render.open_page(pw, "../build/tl.js")
        d = await pg.evaluate("""({nodes: ENGINE.S.nodes.map(n => ({id: n.id || '', t: n.in, w: n.w || 0, anim: n.anim || '', dof: n.dof})),
            shots: ENGINE.S.shots.map(s => ({t: s.t, dur: s.dur, ease: s.ease, d: s.d})), links: ENGINE.S.links.map(l => ({t: l.in, dur: l.dur}))})""")
        await b.close()
    (ROOT / "build/events.json").write_text(json.dumps(d, ensure_ascii=False), encoding="utf-8")
    print(f"délka {info['duration'] / 60:.1f} min, uzlů {len(d['nodes'])}, záběrů {len(d['shots'])}, čar {len(d['links'])}")


if __name__ == "__main__":
    asyncio.run(run())
