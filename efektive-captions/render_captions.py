# Render titulků snímek po snímku přes appku EFEKTIVE Captions (headless Chromium) – pro cloud / dávkové zpracování.
# Appka sama umí export 60 fps (Export → Celé video / Jen titulky); tenhle skript je pro render bez UI.
#
# Použití:
#   1) v jiném terminálu: cd app && node server.js        (běží na http://localhost:3000)
#   2) python3 render_captions.py VIDEO.webm WORDS.json OUT_DIR [--template base] [--fps 60] [--range 0 600]
#   3) ffmpeg -framerate 60 -i OUT_DIR/f%04d.png -i ORIGINAL.mp4 -map 0:v -map 1:a \
#        -c:v libx264 -preset medium -crf 16 -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart -shortest final.mp4
#
# VIDEO.webm = zdroj převedený pro Chromium (Chromium v sandboxu neumí H.264/HEVC v <video>):
#   ffmpeg -i ORIGINAL.mp4 -vf "scale=1080:1920" -r 30 -c:v libvpx-vp9 -b:v 6M -deadline realtime -cpu-used 8 -row-mt 1 -c:a libopus src.webm
# WORDS.json = {"words":[{"word":" Slovo","start":0.36,"end":0.6}, ...]}  (časy v sekundách)
#
# Šablony jsou v app/public/engine.js (E.TEMPLATES): base (výchozí, NAVOD_BASE.md), vinoteka (v8, NAVOD_TITULKY.md),
# bestaccount, negativ, luxus, zlato, efektive, neon, bold, klasik.

import json, base64, os, argparse
from playwright.sync_api import sync_playwright

ap = argparse.ArgumentParser()
ap.add_argument('video'); ap.add_argument('words'); ap.add_argument('out')
ap.add_argument('--template', default='base', help='šablona (base, vinoteka, bestaccount, …)')
ap.add_argument('--fps', type=int, default=60)
ap.add_argument('--width', type=int, default=1080, help='šířka výstupu (výška podle videa)')
ap.add_argument('--color', default=None, help='plná barva hlavního řádku, např. "#e4202c"')
ap.add_argument('--gradA', default=None, help='přeliv hlavního řádku od')
ap.add_argument('--gradB', default=None, help='přeliv hlavního řádku do')
ap.add_argument('--range', nargs=2, type=int, default=None)
ap.add_argument('--frames', nargs='*', type=int, default=None, help='jen vybrané snímky (náhled)')
ap.add_argument('--url', default='http://localhost:3000/')
a = ap.parse_args()

words = json.load(open(a.words))
os.makedirs(a.out, exist_ok=True)

STYLE = {}
if a.color: STYLE.update({"c1": a.color, "c2": a.color, "c3": a.color, "c4": a.color, "grad": False})
if a.gradA and a.gradB: STYLE.update({"gA": a.gradA, "gB": a.gradB, "gradDir": "v", "grad": True})

# ===== ÚPRAVY JEDNOTLIVÝCH TITULKŮ (index titulku: nastavení) =====
OWN = {
  # 0: {"tilt": -20, "tiltX": 6, "tiltAlt": False},
  # 12: {"size": 74},
}

with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 430, 'height': 932})
    pg.route('**/api/transcribe*', lambda r: r.fulfill(status=200, content_type='application/json', body=json.dumps(words)))
    pg.goto(a.url); pg.evaluate('localStorage.clear()')
    pg.set_input_files('#fileIn', a.video); pg.wait_for_timeout(1200)
    pg.click('#genBtn'); pg.wait_for_function('E.pages && E.pages.length>0', timeout=60000)
    pg.evaluate('document.fonts.ready')
    dur = pg.evaluate('document.getElementById("vid").duration')
    N = int(dur * a.fps)
    caps = pg.evaluate('''([tpl, style, own, width]) => {
        const v = document.getElementById('vid'), cv = document.createElement('canvas');
        cv.width = width; cv.height = Math.round(width * v.videoHeight / v.videoWidth / 2) * 2;
        window.__cv = cv; E.attach(cv, v);
        Object.assign(E.G, E.TEMPLATES[tpl].set, style, {style: tpl});
        E.buildPages();
        for (const [k, o] of Object.entries(own)) { const pg = E.pages[+k]; if (pg) { const m = E.meta[E.keyOf(pg)] = E.meta[E.keyOf(pg)] || {}; m.own = Object.assign(m.own || {}, o); } }
        return E.pages.map((p, i) => i + ': ' + (p.lines ? p.lines.map(l => l.map(j => E.words[j].t).join(' ')).join(' / ') : E.words.slice(p.a, p.b + 1).map(w => w.t).join(' ')));
    }''', [a.template, STYLE, {str(k): v for k, v in OWN.items()}, a.width])
    print('titulky:'); [print('  ' + c) for c in caps]
    if a.frames: only = a.frames
    elif a.range: only = range(a.range[0], min(N, a.range[1]))
    else: only = range(N)
    for i in only:
        t = i / a.fps
        if t >= dur: continue
        data = pg.evaluate('''async(t)=>{ const v=document.getElementById("vid"); v.pause();
            if (Math.abs(v.currentTime-t)>0.0001){ v.currentTime=t; await new Promise(r=>v.addEventListener("seeked",r,{once:true})); }
            E.render(t); return window.__cv.toDataURL("image/png"); }''', t)
        open(os.path.join(a.out, f'f{i:04d}.png'), 'wb').write(base64.b64decode(data.split(',')[1]))
    b.close(); print('hotovo snímků:', len(list(only)), 'z', N)
