# Render titulků snímek po snímku přes appku EFEKTIVE Captions (headless Chromium) – pro cloud / dávkové zpracování.
# Appka sama umí export 60 fps snímek po snímku (tlačítko „Uložit video“); tenhle skript je pro render bez UI.
#
# Použití:
#   1) v jiném terminálu: cd app && node server.js        (běží na http://localhost:3000)
#   2) python3 render_captions.py VIDEO.webm WORDS.json OUT_DIR [--fps 60] [--color "#e4202c"] [--range 0 600]
#   3) ffmpeg -framerate 60 -i OUT_DIR/f%04d.png -i ORIGINAL.mp4 -map 0:v -map 1:a \
#        -c:v libx264 -preset medium -crf 16 -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart -shortest final.mp4
#
# VIDEO.webm = zdroj převedený pro Chromium (Chromium v sandboxu neumí H.264/HEVC v <video>):
#   ffmpeg -i ORIGINAL.mp4 -vf "scale=1080:1920" -r 30 -c:v libvpx-vp9 -b:v 6M -deadline realtime -cpu-used 8 -row-mt 1 -c:a libopus src.webm
# WORDS.json = {"words":[{"word":" Slovo","start":0.36,"end":0.6}, ...]}  (časy v sekundách)
#
# Výchozí vzhled = schválená šablona v8 (definovaná v app/public/engine.js → V8).
# Per-titulek úpravy (náklon podle scény, menší velikost dlouhého titulku) se dávají do OWN níže.

import json, base64, os, argparse
from playwright.sync_api import sync_playwright

ap = argparse.ArgumentParser()
ap.add_argument('video'); ap.add_argument('words'); ap.add_argument('out')
ap.add_argument('--fps', type=int, default=60)
ap.add_argument('--color', default='#e4202c', help='barva hlavního (prostředního) řádku')
ap.add_argument('--gradA', default=None, help='přeliv od (zapne přeliv místo plné barvy)')
ap.add_argument('--gradB', default=None, help='přeliv do')
ap.add_argument('--range', nargs=2, type=int, default=None)
ap.add_argument('--frames', nargs='*', type=int, default=None, help='jen vybrané snímky (náhled)')
ap.add_argument('--url', default='http://localhost:3000/')
a = ap.parse_args()

words = json.load(open(a.words))['words']
os.makedirs(a.out, exist_ok=True)

# Jen to, čím se tohle video liší od v8 (barva podle tématu)
STYLE = {"cEm": a.color, "grad": bool(a.gradA and a.gradB)}
if STYLE["grad"]: STYLE.update({"gA": a.gradA, "gB": a.gradB, "gradDir": "v"})

# ===== ÚPRAVY JEDNOTLIVÝCH TITULKŮ (index titulku: nastavení) =====
# Příklad z vinotéky: regál = levá strana blíž, sud = střídavě; dlouhý titulek menší.
OWN = {
  # 0: {"tilt": -20, "tiltX": 6, "tiltAlt": False},
  # 12: {"size": 74},
}

with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 500, 'height': 1000})
    pg.goto(a.url); pg.wait_for_timeout(300)
    pg.evaluate('()=>{ const r=document.getElementById("res"); r.value="1080"; }')
    pg.set_input_files('#file', a.video); pg.wait_for_function('document.getElementById("vid").videoWidth>0')
    dur = pg.evaluate('document.getElementById("vid").duration')
    N = int(dur * a.fps)
    caps = pg.evaluate('([w,s,o])=>__app.load(w,s,o)', [words, STYLE, {str(k): v for k, v in OWN.items()}])
    pg.evaluate('()=>__app.fonts()'); pg.evaluate('document.fonts.ready')
    print('titulky:'); [print('  ' + c) for c in caps]
    if a.frames: only = a.frames
    elif a.range: only = range(a.range[0], min(N, a.range[1]))
    else: only = range(N)
    for i in only:
        t = i / a.fps
        if t >= dur: continue
        info, data = pg.evaluate('''async(t)=>{ const v=document.getElementById("vid");
            if (Math.abs(v.currentTime-t)>0.0001){ v.currentTime=t; await new Promise(r=>v.addEventListener("seeked",r,{once:true})); }
            const i=__app.renderAt(t); return [i?{k:i.k,cropped:i.cropped,fit:i.fit}:null, document.getElementById("cv").toDataURL("image/png")]; }''', t)
        open(os.path.join(a.out, f'f{i:04d}.png'), 'wb').write(base64.b64decode(data.split(',')[1]))
        if info and (info['cropped'] or info['fit'] < 0.999):
            print('POZOR OŘEZ snímek', i, 'titulek', info['k'], '(zmenšeno na %d %%)' % round(info['fit'] * 100))
    b.close(); print('hotovo snímků:', len(list(only)), 'z', N)
