"""Generátor polepu stolu 120 × 70 cm (+3 mm spadávka).
Rozvržení: vedle (logo vlevo, text vpravo) / nad (logo nad textem)
Text: A = jen název, B = + VAŠE ÚČETNÍ A DAŇOVÁ KANCELÁŘ, C = + SINCE 2008 (písmo jako na stole)
Spuštění: python3 build.py && node polep.js
"""
import os
D = os.path.dirname(os.path.abspath(__file__))
A = os.path.join(D, '..', 'assets')

def svg(name, color, wmm):
    s = open(os.path.join(A, name)).read()
    return (s.replace('<svg ', f'<svg style="width:{wmm:.1f}mm;height:auto;display:block" ')
             .replace('<path ', f'<path fill="{color}" '))

TITLE_RATIO = 3728 / 470      # šířka / výška nápisu BEST ACCOUNT
SUB_W = 3723 / 3728

def page(layout, variant):
    if layout == 'vedle':
        I = 300                    # ikona (mm)
        cap = I * 0.30             # výška nápisu BEST ACCOUNT
        gap = I * 0.13
    else:
        I = 330
        cap = I * 0.20
        gap = I * 0.16
    W = cap * TITLE_RATIO
    sub = ''
    css = ''
    if variant == 'B':
        sub = f'<div id="t2" style="margin-top:{cap*0.23:.1f}mm">{svg("logotyp_podtitul.svg", "#707070", W*SUB_W)}</div>'
    elif variant == 'C':
        ls = 0.2; fs = 0.4 * cap / 0.57
        css = ('@font-face{font-family:"CP";font-weight:400;src:url(../assets/fonts/courier-prime-400-latin.woff2) format("woff2")}\n'
               f'#t2{{font-family:"CP",monospace;font-size:{fs:.1f}mm;line-height:1;letter-spacing:{ls}em;margin-right:-{ls}em;'
               f'text-align:right;color:#2b2b2b;-webkit-text-stroke:{fs*0.028:.2f}mm #2b2b2b;margin-top:{cap*0.3:.1f}mm;white-space:nowrap}}')
        sub = '<div id="t2">SINCE 2008</div>'
    direction = 'row' if layout == 'vedle' else 'column'
    txt_margin = f'margin-left:{gap:.1f}mm' if layout == 'vedle' else f'margin-top:{gap:.1f}mm'
    return f'''<!doctype html>
<html lang="cs"><head><meta charset="utf-8"><title>Best Account – polep stolu ({layout}, {variant})</title>
<style>
@page{{size:1206mm 706mm;margin:0}}
*{{margin:0;padding:0;box-sizing:border-box}}
html,body{{width:1206mm;height:706mm;background:#fff}}
#p{{position:relative;width:1206mm;height:706mm;background:#fff;overflow:hidden;-webkit-print-color-adjust:exact;print-color-adjust:exact}}
#g{{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);display:flex;flex-direction:{direction};align-items:center}}
#icon{{width:{I}mm;height:auto;display:block}}
#txt{{{txt_margin};display:flex;flex-direction:column;align-items:stretch}}
{css}
</style></head><body>
<div id="p"><div id="g">
  <img id="icon" src="../assets/logo_icon_hd_3000px.png" alt="">
  <div id="txt"><div id="t1">{svg("logotyp_best_account.svg", "#111111", W)}</div>{sub}</div>
</div></div>
<script>window.layout=()=>{{}};</script>
</body></html>'''

NAMES = {'A': 'A-jen-nazev', 'B': 'B-ucetni-a-danova-kancelar', 'C': 'C-since-2008'}
jobs = []
for layout in ('vedle', 'nad'):
    for v in 'ABC':
        html = f'polep-{layout}-{NAMES[v]}.html'
        open(os.path.join(D, html), 'w').write(page(layout, v))
        jobs.append([html, f'Best-Account-polep-stolu-120x70cm-{layout}-{NAMES[v]}.pdf'])
import json
open(os.path.join(D, 'jobs.json'), 'w').write(json.dumps(jobs, indent=1))
print(len(jobs), 'stránek')
