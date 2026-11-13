# Domodelované dílky, které chybí v knihovně LDraw (tvar podle obrázků z návodů)
import math, sys
OUT = sys.argv[1]
def lathe(name, title, prof, a0, a1, seg, cx=0, cz=0, caps=True):
    L = [f"0 {title}", f"0 Name: {name}.dat", "0 Author: Love Bricks (domodelovano)", "0 !LDRAW_ORG Unofficial_Part", "0 BFC NOCERTIFY", ""]
    pts = lambda r, y, a: (cx + r * math.cos(a), y, cz - r * math.sin(a))
    for i in range(seg):
        aa, ab = a0 + (a1 - a0) * i / seg, a0 + (a1 - a0) * (i + 1) / seg
        for j in range(len(prof) - 1):
            (r1, y1), (r2, y2) = prof[j], prof[j + 1]
            p = [pts(r1, y1, aa), pts(r2, y2, aa), pts(r2, y2, ab), pts(r1, y1, ab)]
            L.append("4 16 " + " ".join(f"{v:.3f}" for q in p for v in q))
    if caps:
        for a in (a0, a1):
            for j in range(len(prof) - 1):
                (r1, y1), (r2, y2) = prof[j], prof[j + 1]
                c = (sum(r for r, _ in prof) / len(prof), sum(y for _, y in prof) / len(prof))
                p = [pts(r1, y1, a), pts(r2, y2, a), pts(c[0], c[1], a)]
                L.append("3 16 " + " ".join(f"{v:.3f}" for q in p for v in q))
    open(f"{OUT}/{name}.dat", "w").write("\n".join(L) + "\n")
# 7033: kulatý roh 5x5x1 bez výstupků, zaoblený vnější okraj, vnitřní výřez (prstenec květináče / podstavce)
import math as _m
prof = [(60, 24), (60, 0)] + [(60 + 40 * _m.sin(t * _m.pi / 24), 24 - 24 * _m.cos(t * _m.pi / 24)) for t in range(1, 13)] + [(60, 24)]
lathe("7033", "Brick Round Corner 5 x 5 x 1 Curved, No Studs", prof, 0, math.pi / 2, 32, cx=-10, cz=10)
# 5903: poupě tulipánu (vejčitý pupen na stopce s otvorem pro tyčku)
prof = [(0, -26), (4, -25), (7, -21), (8.5, -15), (8.5, -8), (7, -3), (5, 0), (3, 2), (0, 2)]
lathe("5903", "Plant Flower Tulip", prof, 0, 2 * math.pi, 16, caps=False)
print("ok")
