"""TTS bloky: jedna kapitola = jeden blok (rozdělený na místě vložky s původním zvukem reelu).
Zapíše build/blocks/<bid>.txt (fonetický text, odstavce oddělené prázdným řádkem) a build/blocks.json (blok -> odstavce)."""
import json, re
from pathlib import Path
from build import parse, para_struct, INSERTS, BUILD
from pron import tts_text

out = BUILD / "blocks"; out.mkdir(parents=True, exist_ok=True)
blocks = []
for ch in parse():
    cur = {"id": ch["id"], "paras": []}
    for i, raw in enumerate(ch["paras"]):
        p = para_struct(ch["id"], i, raw)
        names = [c[0] for c in p["cues"]]
        cur["paras"].append(p["id"])
        if any(INSERTS.get(n, {}).get("after") for n in names) and i < len(ch["paras"]) - 1:
            blocks.append(cur); cur = {"id": ch["id"] + "b", "paras": []}
    blocks.append(cur)
tot = 0
txt_of = {}
for ch in parse():
    for i, raw in enumerate(ch["paras"]):
        p = para_struct(ch["id"], i, raw); txt_of[p["id"]] = tts_text(p["text"])
for b in blocks:
    t = "\n\n".join(txt_of[p] for p in b["paras"])
    (out / f"{b['id']}.txt").write_text(t, encoding="utf-8"); tot += len(t)
    print(f"{b['id']:5s} {len(b['paras']):3d} odst. {len(t):5d} znaků")
(BUILD / "blocks.json").write_text(json.dumps(blocks, ensure_ascii=False, indent=1), encoding="utf-8")
print("celkem", tot)
