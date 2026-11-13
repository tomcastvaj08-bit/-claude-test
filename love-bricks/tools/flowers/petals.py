# Hladké okvětní lístky tulipánů (tvar podle produktových fotek sady 11501), jako LDraw díly.
# Spuštění: python3 petals.py <výstupní složka parts>
# lbtul  – lístek zavřeného tulipánu: výseč vajíčka 150°, dole u stonku zúžený, nahoře zoubkovaný okraj.
#          Počátek = osa květu v úrovni dna lístku, nahoru = -Y, střed výseče míří k -Z.
# lbtulo – dlouhý špičatý lístek oranžového tulipánu: miskovitě prohnutý, podélně zahnutý ven.
#          Počátek = báze lístku, lístek roste k -Y (nahoru), líc k -Z.
import math, sys
OUT = sys.argv[1]
TH = 2.6  # tloušťka lístku (LDU)

def write(name, title, quads):
    L = [f"0 {title}", f"0 Name: {name}.dat", "0 Author: Love Bricks (domodelovano podle fotek)", "0 !LDRAW_ORG Unofficial_Part", "0 BFC NOCERTIFY", ""]
    for q in quads:
        L.append("4 16 " + " ".join(f"{v:.3f}" for p in q for v in p))
    open(f"{OUT}/{name}.dat", "w").write("\n".join(L) + "\n")

def shell(P, NU, NV, normal_out):
    """P(u,v) -> bod na vnější ploše, u∈[0,1] příčně, v∈[0,1] podélně. Vytvoří vnější i vnitřní plochu a hrany."""
    out = [[P(i / NU, j / NV) for j in range(NV + 1)] for i in range(NU + 1)]
    def inner(i, j):
        p = out[i][j]; n = normal_out(i / NU, j / NV, p)
        return tuple(p[k] - n[k] * TH for k in range(3))
    inn = [[inner(i, j) for j in range(NV + 1)] for i in range(NU + 1)]
    Q = []
    for i in range(NU):
        for j in range(NV):
            Q.append([out[i][j], out[i + 1][j], out[i + 1][j + 1], out[i][j + 1]])
            Q.append([inn[i][j + 1], inn[i + 1][j + 1], inn[i + 1][j], inn[i][j]])
    for j in range(NV):  # boční hrany
        for i in (0, NU):
            Q.append([out[i][j], out[i][j + 1], inn[i][j + 1], inn[i][j]])
    for i in range(NU):  # horní a dolní hrana
        for j in (0, NV):
            Q.append([out[i][j], out[i + 1][j], inn[i + 1][j], inn[i][j]])
    return Q

# ---------- tulipánový lístek ----------
H = 128.0
PROF = [(0, 5), (0.07, 24), (0.18, 38), (0.34, 47), (0.5, 48.5), (0.65, 45.5), (0.78, 39), (0.89, 31), (0.96, 26), (1.0, 24)]
def rad(t):  # hladká křivka (Catmull-Rom) přes body obrysu vajíčka
    t = max(0.0, min(1.0, t))
    for k in range(1, len(PROF)):
        if t <= PROF[k][0]: break
    i0, i1 = k - 1, k
    P = [PROF[max(0, i0 - 1)], PROF[i0], PROF[i1], PROF[min(len(PROF) - 1, i1 + 1)]]
    t0, t1 = P[1][0], P[2][0]; u = (t - t0) / (t1 - t0)
    def tang(a, b, c):
        return (c[1] - a[1]) / (c[0] - a[0]) * (t1 - t0) if c[0] != a[0] else 0
    m1, m2 = tang(P[0], P[1], P[2]), tang(P[1], P[2], P[3])
    h00, h10, h01, h11 = 2*u**3-3*u**2+1, u**3-2*u**2+u, -2*u**3+3*u**2, u**3-u**2
    return h00 * P[1][1] + h10 * m1 + h01 * P[2][1] + h11 * m2
SPAN = math.radians(150)
def tmax(u):
    # horní okraj: uprostřed vyšší jazýček se dvěma zoubky, k bokům klesá (lístky se překrývají)
    x = abs(u - 0.5) * 2               # 0 střed .. 1 kraj
    top = 1.0 - 0.10 * x ** 1.8
    if 0.18 < x < 0.30: top -= 0.025  # zoubky
    if 0.55 < x < 0.64: top -= 0.02
    return top
def tul(u, v):
    phi = (u - 0.5) * SPAN; t = v * tmax(u); r = rad(t)
    return (r * math.sin(phi), -H * t, -r * math.cos(phi))
def tul_n(u, v, p):
    phi = (u - 0.5) * SPAN; t = v * tmax(u)
    dt = 0.01; dr = (rad(min(1, t + dt)) - rad(max(0, t - dt))) / (2 * dt) / H
    n = (math.sin(phi), dr, -math.cos(phi)); l = math.sqrt(sum(c * c for c in n))
    return tuple(c / l for c in n)
# jako skutečný díl: horní zakřivený štít + dole dva čtvrtkruhy – mezi nimi viditelné spáry (svislá a vodorovná)
def part(u0, u1, v0, v1, nu, nv):
    P = lambda u, v: tul(u0 + (u1 - u0) * u, v0 + (v1 - v0) * v)
    N = lambda u, v, p: tul_n(u0 + (u1 - u0) * u, v0 + (v1 - v0) * v, p)
    return shell(P, nu, nv, N)
G = 0.012; VS = 0.30
write("lbtul", "Tulip Petal Shell (Love Bricks)", part(0, 1, VS + G, 1, 26, 22) + part(0, 0.5 - G, 0, VS - G, 13, 9) + part(0.5 + G, 1, 0, VS - G, 13, 9))

# ---------- dlouhý špičatý lístek (oranžový tulipán) ----------
LO, WO = 112.0, 40.0
def wid(v):  # polovina šířky: úzká báze, nejširší ve 40 %, ostrá špička
    if v < 0.4: s = v / 0.4; return WO * (0.32 + 0.68 * math.sin(s * math.pi / 2))
    s = (v - 0.4) / 0.6; return WO * (1 - s) ** 0.8 * (1 + 0.25 * math.sin(s * math.pi)) + 0.3
def oro(u, v):
    w = wid(v); x = (u - 0.5) * 2 * w
    cup = 13.0 * (1 - ((u - 0.5) * 2) ** 2) * min(1, wid(v) / WO)   # miskovité prohnutí: střed vzadu, okraje dopředu
    bend = 12.0 * v * v                                               # podélné zahnutí ven (líc -Z)
    return (x, -LO * v, cup + bend)
def oro_n(u, v, p):
    return (0, 0, -1)
write("lbtulo", "Tulip Petal Pointed (Love Bricks)", shell(oro, 12, 28, oro_n))
print("ok")
