# Build the 2D cut-out puppet parts from the character sheet (run once; output in assets/mascot/).
import numpy as np, json, sys
from PIL import Image
sys.path.insert(0, "scripts")
from importlib import import_module
mc = import_module("mascot-cut")
UP = 3  # upscale so the puppet stays crisp at ~650 px tall on screen
full = mc.matte((40, 25, 200, 535))
A = np.array(full)
H, W = A.shape[:2]
def part(name, mask):
    a = A.copy(); a[..., 3] = np.where(mask, a[..., 3], 0)
    ys, xs = np.nonzero(a[..., 3])
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    img = Image.fromarray(a[y0:y1, x0:x1], "RGBA").resize(((x1 - x0) * UP, (y1 - y0) * UP), Image.LANCZOS)
    img.save(f"assets/mascot/{name}.png")
    return {"x": int(x0) * UP, "y": int(y0) * UP, "w": int(x1 - x0) * UP, "h": int(y1 - y0) * UP}
yy, xx = np.mgrid[0:H, 0:W]
R_, G_, B_ = (A[..., i].astype(int) for i in range(3))
blue = (B_ > R_ + 25) & (B_ > G_ + 5)                     # jeans
skin_or_shirt = ((R_ > G_ + 30) & (B_ > G_ - 10)) | ((G_ > R_ + 15) & (G_ > B_ + 5))
brown = (R_ > G_ + 15) & (G_ > B_ - 5) & ~((R_ > G_ + 30) & (B_ > G_ - 10))   # pink hands / green sleeves
meta = {}
meta["head"] = part("head", yy < 112)
meta["torso"] = part("torso", (yy >= 92) & (yy < 215) & (xx >= 38) & (xx < 124))
meta["armL"] = part("armL", (yy >= 100) & (yy < 370) & (xx < 58) & ~((yy > 185) & blue) & ~((yy > 175) & (yy < 215) & brown))
meta["armR"] = part("armR", (yy >= 100) & (yy < 370) & (xx >= 103) & ~((yy > 185) & blue) & ~((yy > 175) & (yy < 215) & brown))
white = (A[..., :3].min(2) > 200) | ((yy > 470) & (A[..., :3].min(2) > 110) & ((A[..., :3].max(2).astype(int) - A[..., :3].min(2)) < 30))
meta["legL"] = part("legL", (yy >= 195) & (xx < 81) & (xx >= 56) & ~white & ~((yy < 365) & skin_or_shirt & ~blue))
meta["legR"] = part("legR", (yy >= 195) & (xx >= 81) & (xx < 121) & ~white & ~((yy < 365) & skin_or_shirt & ~blue))
# alternative heads (expressions) from the head sheet, scaled to the body's head
hw = meta["head"]["w"]
for name, box in {"head_grin": (1050, 35, 1205, 200), "head_shock": (1210, 35, 1370, 200), "head_wow": (1048, 205, 1208, 372), "head_point": (1440, 552, 1512, 652)}.items():
    p = mc.matte(box)
    bb = p.getbbox(); p = p.crop(bb)
    if name == "head_point":
        p = p.resize((int(p.width * 1.1 * UP / 1.0 * 0.62), int(p.height * 1.1 * UP * 0.62)), Image.LANCZOS); p.save("assets/mascot/hand_point.png"); continue
    # sheet heads include the collar; match glasses width ≈ head width
    s = hw / p.width * 1.04
    p = p.resize((int(p.width * s), int(p.height * s)), Image.LANCZOS)
    p.save(f"assets/mascot/{name}.png")
    meta[name] = {"w": p.width, "h": p.height}
json.dump(meta, open("assets/mascot/parts.json", "w"), indent=1)
print(json.dumps(meta))
