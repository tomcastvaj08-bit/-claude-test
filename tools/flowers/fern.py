# Zubatý list z návodu Sluban M38-B1121A (kroky 9 a 16): destička 1x3 se 3 výstupky + plochý zubatý list.
# Počátek = střed destičky; list roste podél +X, výstupky nahoru (-Y).
import math, sys
OUT = sys.argv[1]
L = ["0 Plant Leaf Serrated with Plate 1 x 3 (Love Bricks, podle navodu Sluban)", "0 Name: lbfern.dat", "0 Author: Love Bricks", "0 !LDRAW_ORG Unofficial_Part", "0 BFC NOCERTIFY", ""]
def q(*p): L.append("4 16 " + " ".join(f"{v:.2f}" for pt in p for v in pt))
def t(*p): L.append("3 16 " + " ".join(f"{v:.2f}" for pt in p for v in pt))
# destička 1x3 (60 x 8 x 20) se 3 výstupky
x0, x1, z0, z1, y0, y1 = -30, 30, -10, 10, 0, 8
q((x0,y0,z0),(x1,y0,z0),(x1,y0,z1),(x0,y0,z1)); q((x0,y1,z1),(x1,y1,z1),(x1,y1,z0),(x0,y1,z0))
q((x0,y0,z0),(x0,y1,z0),(x1,y1,z0),(x1,y0,z0)); q((x0,y0,z1),(x1,y0,z1),(x1,y1,z1),(x0,y1,z1))
q((x0,y0,z0),(x0,y0,z1),(x0,y1,z1),(x0,y1,z0)); q((x1,y0,z0),(x1,y1,z0),(x1,y1,z1),(x1,y0,z1))
for sx in (-20, 0, 20): L.append(f"1 16 {sx} 0 0 1 0 0 0 1 0 0 0 1 stud.dat")
# list: od x = 20 do 230, zubatý okraj (8 zubů na stranu), mírně prohnutý dolů ke špičce
A, B, W, N = 20.0, 210.0, 40.0, 7
def half(s):  # obálka listu 0..1
    return W * (math.sin(math.pi * min(1, s * 1.15)) ** 0.6 if s < 0.87 else (1 - s) / 0.13 * 0.45)
pts = []
K = N * 2
for i in range(K + 1):
    s = i / K
    w = half(s) * (1.0 if i % 2 == 0 else 0.38)        # ostrý zub / hluboký zářez
    xs = A + (B - A) * (s + (0.045 if i % 2 == 0 else -0.01))
    pts.append((min(B, xs), w))
pts[0] = (A, 5.0)
yb = lambda x: 2 + 18 * ((x - A) / (B - A)) ** 2       # prohnutí
mid = [(A + (B - A) * i / K, 0.0) for i in range(K + 1)]
for side in (1, -1):
    for i in range(K):
        a, b = pts[i], pts[i + 1]; ma, mb = mid[i], mid[i + 1]
        P = [(ma[0], yb(ma[0]), 0), (mb[0], yb(mb[0]), 0), (b[0], yb(b[0]) - 1.5, side * b[1]), (a[0], yb(a[0]) - 1.5, side * a[1])]
        q(*P); q(*[(p[0], p[1] + 1.6, p[2]) for p in reversed(P)])
# střední žilka
for i in range(K):
    a, b = mid[i][0], mid[i + 1][0]
    q((a, yb(a) - 1.2, -1.5), (b, yb(b) - 1.2, -1.5), (b, yb(b) - 1.2, 1.5), (a, yb(a) - 1.2, 1.5))
open(f"{OUT}/lbfern.dat", "w").write("\n".join(L) + "\n")
print("ok")
