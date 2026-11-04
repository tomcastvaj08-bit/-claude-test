# Cut the character sheet into a 2D cut-out puppet (transparent PNG parts).
import sys, numpy as np
from PIL import Image
from scipy import ndimage
SRC = "assets/coldopen/character_sheet.png"; OUT = "assets/mascot/"
im = np.array(Image.open(SRC).convert("RGB")).astype(np.int16)
def matte(box):
    x0,y0,x1,y1 = box
    a = im[y0:y1, x0:x1]
    mx, mn = a.max(2), a.min(2)
    bg = (mx > 150) & ((mx - mn) < 40)          # light and unsaturated = paper / sketch grid
    lab, n = ndimage.label(bg)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    out = np.isin(lab, list(border))
    alpha = (~out).astype(np.uint8) * 255
    # keep the largest blob (drop stray sketch marks)
    l2, n2 = ndimage.label(alpha > 0)
    if n2 > 1:
        sizes = ndimage.sum(alpha > 0, l2, range(1, n2 + 1))
        keep = 1 + int(np.argmax(sizes))
        alpha = np.where(l2 == keep, 255, 0).astype(np.uint8)
    alpha = ndimage.binary_closing(alpha > 0, iterations=1).astype(np.uint8) * 255
    rgba = np.dstack([a.astype(np.uint8), alpha])
    return Image.fromarray(rgba, "RGBA")
if __name__ == "__main__":
    name, *b = sys.argv[1:]
    matte(tuple(map(int, b))).save(OUT + name + ".png")
