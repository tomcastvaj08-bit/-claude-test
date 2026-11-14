# Domodelované dílky pro kytice ve vázách (podle produktových fotek): kulová lesklá váza, otevřená růže, poupě růže,
# dlouhý list, okvětní lístek slunečnice. Spuštění: python3 slparts.py <složka parts>
# Souřadnice LDraw: Y dolů; květ roste k -Y (nahoru) z počátku = místo, kde nasedá na stonek.
import math, sys
OUT = sys.argv[1]
TH = 2.4

def write(name, title, quads):
    L = [f"0 {title}", f"0 Name: {name}.dat", "0 Author: Love Bricks (domodelovano podle fotek)", "0 !LDRAW_ORG Unofficial_Part", "0 BFC NOCERTIFY", ""]
    for q in quads:
        L.append("4 16 " + " ".join(f"{v:.3f}" for p in q for v in p))
    open(f"{OUT}/{name}.dat", "w").write("\n".join(L) + "\n")

def shell(P, NU, NV, N, th=TH):
    out = [[P(i / NU, j / NV) for j in range(NV + 1)] for i in range(NU + 1)]
    inn = [[tuple(out[i][j][k] - N(i / NU, j / NV)[k] * th for k in range(3)) for j in range(NV + 1)] for i in range(NU + 1)]
    Q = []
    for i in range(NU):
        for j in range(NV):
            Q.append([out[i][j], out[i + 1][j], out[i + 1][j + 1], out[i][j + 1]])
            Q.append([inn[i][j + 1], inn[i + 1][j + 1], inn[i + 1][j], inn[i][j]])
    for j in range(NV):
        for i in (0, NU): Q.append([out[i][j], out[i][j + 1], inn[i][j + 1], inn[i][j]])
    for i in range(NU):
        for j in (0, NV): Q.append([out[i][j], out[i + 1][j], inn[i + 1][j], inn[i][j]])
    return Q

def norm(v):
    l = math.sqrt(sum(c * c for c in v)) or 1
    return tuple(c / l for c in v)

# okvětní lístek jako výseč rotační plochy: phi0 střed, span šířka, r(v) poloměr, y0 začátek, h výška, curl = ohnutí horního okraje ven
def petal(phi0, span, rb, rt, y0, h, flare=0.0, curl=0.0, nu=10, nv=8, pinch=0.12):
    def r(v): return rb + (rt - rb) * (v ** 0.8) + flare * v ** 3
    def vmax(u): return 1 - pinch * (abs(u - 0.5) * 2) ** 2
    def P(u, v):
        vv = v * vmax(u); phi = phi0 + (u - 0.5) * span
        rr = r(vv) + curl * max(0, vv - 0.7) ** 2 * 10
        return (rr * math.sin(phi), y0 - h * vv, -rr * math.cos(phi))
    def N(u, v):
        phi = phi0 + (u - 0.5) * span
        return norm((math.sin(phi), -0.25, -math.cos(phi)))
    return shell(P, nu, nv, N)

G = 2 * math.pi
# ---------- otevřená růže (spirála lístků, vnější se rozvírají) ----------
Q = []
rings = [  # (počet, span°, rb, rt, y0, h, flare, curl, fáze°)
    (1, 320, 2, 6, -16, 26, 0, 0, 0),
    (3, 170, 5, 12, -10, 30, 0, 0, 40),
    (4, 150, 10, 20, -5, 32, 2, 0.4, 10),
    (5, 125, 16, 27, -1, 30, 3, 0.5, 30),
    (5, 110, 21, 34, 3, 26, 5, 0.7, 0),
]
for n, span, rb, rt, y0, h, fl, cu, ph in rings:
    for k in range(n):
        Q += petal(math.radians(ph) + k * G / n, math.radians(span), rb, rt, y0, h, fl, cu)
# zelený kalich pod květem
def cal(u, v):
    a = u * G; rr = 6 + 16 * math.sin(v * math.pi / 2); return (rr * math.sin(a), 6 - 10 * v, -rr * math.cos(a))
Q += shell(cal, 16, 4, lambda u, v: norm((math.sin(u * G), 0.3, -math.cos(u * G))))
write("lbrose", "Plant Flower Rose Open (Love Bricks)", Q[: len(Q)])
open(f"{OUT}/lbrosec.dat", "w").write("0 Rose calyx\n0 Name: lbrosec.dat\n0 BFC NOCERTIFY\n")  # rezerva

# ---------- poupě růže: vejčitý uzavřený květ ze tří lístků se spárami + dva odchlípnuté ----------
PROF = lambda v: 4 + 24 * math.sin(math.pi * (0.08 + 0.78 * v)) ** 0.9
Q = []
for k in range(3):
    phi0 = k * G / 3
    def P(u, v, phi0=phi0):
        phi = phi0 + (u - 0.5) * math.radians(200); r = PROF(v) + 1.5 * k
        return (r * math.sin(phi), 2 - 56 * v * (1 - 0.06 * abs(u - 0.5)), -r * math.cos(phi))
    Q += shell(P, 12, 10, lambda u, v, phi0=phi0: norm((math.sin(phi0 + (u - 0.5) * 3.5), -0.2, -math.cos(phi0 + (u - 0.5) * 3.5))))
for k in range(2):
    Q += petal(k * math.pi + 0.6, math.radians(120), 18, 30, 4, 34, 6, 1.2)
def capP(u, v):
    a = u * G; r = 9 * math.cos(v * math.pi / 2); return (r * math.sin(a), -50 - 7 * math.sin(v * math.pi / 2), -r * math.cos(a))
Q += shell(capP, 16, 5, lambda u, v: norm((math.sin(u * G), -1, -math.cos(u * G))))
write("lbroseb", "Plant Flower Rose Bud (Love Bricks)", Q)

# ---------- dlouhý špičatý list (podélně prohnutý, se středovým žebrem) ----------
def leafP(u, v, L=120, W=15):
    w = W * (math.sin(min(1, v / 0.35) * math.pi / 2) * (1 - max(0, v - 0.35) / 0.65) ** 0.9 + 0.08)
    x = (u - 0.5) * 2 * w
    fold = 3.5 * abs(u - 0.5) * 2 * min(1, w / W)          # mírné V podél žebra
    bend = 26 * v * v                                         # konec se ohýbá ven (k -Z)
    return (x, -L * v, -fold - bend)
write("lbleaf", "Plant Leaf Long Pointed (Love Bricks)", shell(leafP, 8, 18, lambda u, v: (0, 0, 1)))

# ---------- okvětní lístek slunečnice / kopretiny (plochý, mírně miskovitý, zaoblená špička) ----------
def sunP(u, v, L=38, W=7.5):
    w = W * math.sin(math.pi * (0.12 + 0.88 * v) ) ** 0.6 + 1.2
    x = (u - 0.5) * 2 * w
    return (x, -2.5 * (1 - ((u - 0.5) * 2) ** 2) + 3 * v * v, -L * v)
write("lbsunp", "Plant Flower Petal Long (Love Bricks)", shell(sunP, 6, 10, lambda u, v: (0, -1, 0), 2.0))

# ---------- kulová lesklá váza s úzkým hrdlem ----------
R, rb, ro = 110.0, 40.0, 44.0
yc = -math.sqrt(R * R - rb * rb)
ytop = yc - math.sqrt(R * R - ro * ro)
prof = [(0.01, 0.0), (rb - 6, 0.0)]
prof += [(rb - 6 + 6 * math.sin(t * math.pi / 12), -6 + 6 * math.cos(t * math.pi / 12)) for t in range(1, 7)]
a0 = math.asin(-yc / R) if False else math.atan2(rb, -yc)       # úhel od spodního pólu
a1 = math.pi - math.atan2(ro, -(ytop - yc))
for i in range(1, 41):
    a = a0 + (a1 - a0) * i / 40
    prof.append((R * math.sin(a), yc + R * math.cos(a)))
prof += [(ro + 3 * math.sin(t * math.pi / 8), ytop - 3 + 3 * math.cos(t * math.pi / 8) * -1) for t in range(0, 9)]
prof += [(ro - 6, ytop + 1), (ro - 6, ytop + 30)]
L = ["0 Vase Sphere Glossy (Love Bricks)", "0 Name: lbvase.dat", "0 Author: Love Bricks (domodelovano podle fotek)", "0 !LDRAW_ORG Unofficial_Part", "0 BFC NOCERTIFY", ""]
SEG = 72
for i in range(SEG):
    aa, ab = G * i / SEG, G * (i + 1) / SEG
    for j in range(len(prof) - 1):
        (r1, y1), (r2, y2) = prof[j], prof[j + 1]
        p = [(r1 * math.cos(aa), y1, -r1 * math.sin(aa)), (r2 * math.cos(aa), y2, -r2 * math.sin(aa)), (r2 * math.cos(ab), y2, -r2 * math.sin(ab)), (r1 * math.cos(ab), y1, -r1 * math.sin(ab))]
        L.append("4 16 " + " ".join(f"{v:.3f}" for q in p for v in q))
open(f"{OUT}/lbvase.dat", "w").write("\n".join(L) + "\n")
print("ok vase top", round(ytop, 1), "neck r", ro)
