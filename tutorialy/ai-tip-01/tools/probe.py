"""Ladění: python tools/probe.py <t> "<js výraz>" – vyhodnotí výraz po seek(t)."""
import asyncio, json, sys
sys.path.insert(0, str(__import__("pathlib").Path(__file__).resolve().parent.parent / "engine"))
from playwright.async_api import async_playwright
import render


async def main(t, expr):
    async with async_playwright() as pw:
        b, pg, _ = await render.open_page(pw, "../build/tl.js")
        await pg.evaluate(f"ENGINE.seekAsync({t})")
        print(json.dumps(await pg.evaluate(expr), ensure_ascii=False, indent=1)[:6000])
        await b.close()

asyncio.run(main(float(sys.argv[1]), sys.argv[2]))
