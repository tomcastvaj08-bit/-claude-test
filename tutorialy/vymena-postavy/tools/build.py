"""Scénář -> plán časů -> timeline.

1) Načte scenar.md (kapitoly, odstavce, cue značky {#name}).
2) Časy: když existuje build/vo/<pid>.json (přepis s časy slov), použije skutečné časy, jinak odhad podle počtu znaků.
3) Zapíše build/plan.json, build/tts/<pid>.txt (fonetický text pro hlas) a build/tl.js = cues + všechny timeline/*.js.

python tools/build.py [--cps 14.6]
Nastavení projektu (vložky, mezery, značka, HUD) je v project.json v kořeni projektu.
"""
import argparse, difflib, json, re, unicodedata
from pathlib import Path

from pron import tts_text

ROOT = Path(__file__).resolve().parent.parent
BUILD = ROOT / "build"

CFG = json.loads((ROOT / "project.json").read_text(encoding="utf-8"))
PARA_GAP = CFG.get("para_gap", .35)     # pauza mezi odstavci (dynamičtější tempo)
CH_LEAD = CFG.get("ch_lead", 2.0)       # přelet kamery na začátku kapitoly, než začne hlas
# vložky, kdy hraje původní zvuk zdrojového videa (hlas mlčí): "kXX.cue": {before|after, src, a, b, pad}
INSERTS = CFG.get("inserts", {})


def norm(w):
    w = unicodedata.normalize("NFD", w.lower())
    return "".join(c for c in w if unicodedata.category(c) != "Mn" and c.isalnum())


def align_times(src, ref, ref_t):
    """Časy pro slova `src` podle zarovnání na `ref` (se známými časy). Neshodná slova se interpolují."""
    sm = difflib.SequenceMatcher(a=[norm(w) for w in src], b=[norm(w) for w in ref], autojunk=False)
    out = [None] * len(src)
    for blk in sm.get_matching_blocks():
        for k in range(blk.size):
            out[blk.a + k] = ref_t[blk.b + k]
    known = [i for i, v in enumerate(out) if v is not None]
    if not known:
        return [ref_t[0] if ref_t else 0.0] * len(src)
    for i in range(len(src)):
        if out[i] is None:
            lo = max([k for k in known if k < i], default=None); hi = min([k for k in known if k > i], default=None)
            if lo is None: out[i] = out[hi]
            elif hi is None: out[i] = out[lo] + .25 * (i - lo)
            else: out[i] = out[lo] + (out[hi] - out[lo]) * (i - lo) / (hi - lo)
    return out


def parse():
    s = (ROOT / "scenar.md").read_text(encoding="utf-8")
    chapters = []
    for block in s.split("\n## ")[1:]:
        head, *lines = block.split("\n")
        cid = head.split(" ")[0].lower()
        title = head.split("·", 1)[1].strip() if "·" in head else head
        title = re.sub(r"\s*\(~[^)]*\)\s*$", "", title)
        paras = []
        for ln in lines:
            ln = ln.strip()
            if not ln or ln.startswith(">") or ln.startswith("---") or ln.startswith("#"):
                continue
            paras.append(ln)
        chapters.append(dict(id=cid, title=title, paras=paras))
    return chapters


def para_struct(cid, i, raw):
    """Rozloží odstavec na čistý text + pozice cue značek (offset ve znacích)."""
    cues, out, pos = [], "", 0
    for m in re.finditer(r"\{#([\w-]+)\}\s*", raw):
        out += raw[pos:m.start()]
        cues.append((f"{cid}.{m.group(1)}", len(out)))
        pos = m.end()
    out += raw[pos:]
    return dict(id=f"{cid}.p{i:02d}", text=out.strip(), cues=cues)


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--cps", type=float, default=14.6); a = ap.parse_args()
    BUILD.mkdir(exist_ok=True); (BUILD / "tts").mkdir(exist_ok=True)
    chapters = parse()
    t = 0.0
    plan = dict(chapters=[], paras=[], cues={}, words=[], inserts=[])
    for ch in chapters:
        plan["chapters"].append(dict(id=ch["id"], title=ch["title"], t=t))
        plan["cues"][ch["id"]] = t
        t += CH_LEAD
        for i, raw in enumerate(ch["paras"]):
            p = para_struct(ch["id"], i, raw)
            names = [c[0] for c in p["cues"]]
            for nm in names:
                ins = INSERTS.get(nm)
                if ins and ins.get("before"):
                    plan["inserts"].append(dict(cue=nm, t=t, dur=ins["b"] - ins["a"], src=ins["src"], a=ins["a"], b=ins["b"]))
                    t += ins["b"] - ins["a"] + ins["pad"]
            (BUILD / "tts" / f"{p['id']}.txt").write_text(tts_text(p["text"]), encoding="utf-8")
            vo = BUILD / "vo" / f"{p['id']}.json"
            words = []
            if vo.exists():                      # skutečné časy z přepisu
                # přepis odpovídá fonetickému textu -> zarovnat na něj, pak zpátky na slova scénáře
                d = json.loads(vo.read_text(encoding="utf-8"))
                dur = d["duration"]
                rw = [w["text"] for w in d["words"]]; rt = [w["start"] for w in d["words"]]
                tw = re.findall(r"\S+", tts_text(p["text"]))
                tt = align_times(tw, rw, rt)
                dw = re.findall(r"\S+", p["text"])
                words = [(t + s, w) for s, w in zip(align_times(dw, tw, tt), dw)]
                real = True
            else:                                # odhad podle znaků
                dur = len(p["text"]) / a.cps
                off = 0
                for m in re.finditer(r"\S+", p["text"]):
                    words.append((t + m.start() / a.cps, m.group(0)))
                real = False
            # cue = čas slova, které po značce následuje
            pwords_start = len(plan["words"])
            for (tw, w) in words:
                plan["words"].append([round(tw, 3), norm(w)])
            for nm, off in p["cues"]:
                k = len(re.findall(r"\S+", p["text"][:off]))
                k = min(k, len(words) - 1)
                plan["cues"][nm] = round(words[k][0], 3) if words else t
                plan.setdefault("cueIdx", {})[nm] = pwords_start + k
            plan["paras"].append(dict(id=p["id"], ch=ch["id"], t=round(t, 3), dur=round(dur, 3), text=p["text"], real=real))
            t += dur + PARA_GAP
            for nm in names:
                ins = INSERTS.get(nm)
                if ins and ins.get("after"):
                    plan["inserts"].append(dict(cue=nm, t=t, dur=ins["b"] - ins["a"], src=ins["src"], a=ins["a"], b=ins["b"]))
                    plan["cues"][nm + ".ins"] = round(t, 3)
                    t += ins["b"] - ins["a"] + ins["pad"]
    plan["duration"] = round(t + 3.0, 3)
    (BUILD / "plan.json").write_text(json.dumps(plan, ensure_ascii=False, indent=1), encoding="utf-8")

    # timeline bundle
    media = ROOT / "assets/media.json"
    js = "window.CFG = " + json.dumps(CFG, ensure_ascii=False) + ";\n"
    js += "window.MEDIA = " + (media.read_text(encoding="utf-8") if media.exists() else "{}") + ";\n"
    js += "ENGINE.loadPlan(" + json.dumps(dict(cues=plan["cues"], cueIdx=plan.get("cueIdx", {}), words=plan["words"],
                                              chapters=plan["chapters"], paras=[dict(id=p["id"], t=p["t"], dur=p["dur"], text=p["text"]) for p in plan["paras"]],
                                              inserts=plan["inserts"], duration=plan["duration"]), ensure_ascii=False) + ");\n"
    for f in sorted((ROOT / "timeline").glob("k*.js")):
        js += f"\n// ===== {f.name} =====\n" + f.read_text(encoding="utf-8")
    (BUILD / "tl.js").write_text(js, encoding="utf-8")
    est = sum(1 for p in plan["paras"] if not p["real"])
    print(f"kapitol {len(chapters)}, odstavců {len(plan['paras'])} (odhad {est}), cue {len(plan['cues'])}, délka {plan['duration']/60:.1f} min")
    for c in plan["chapters"]:
        print(f"  {c['id']}  {c['t']/60:5.1f} min  {c['title']}")


if __name__ == "__main__":
    main()
