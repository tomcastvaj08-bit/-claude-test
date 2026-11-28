"""Fast person matte: u2net_human_seg (0.35 s/frame) + guided-filter edge refinement."""
import sys, os, numpy as np, cv2
from rembg import new_session, remove
from PIL import Image
FR, MD = sys.argv[1], sys.argv[2]; frames = []
for r in sys.argv[3:]:
    a, b = map(int, r.split('-')); frames += list(range(a, b + 1))
os.makedirs(MD, exist_ok=True)
s = new_session('u2net_human_seg')
def guided(I, p, r, eps):
    mean = lambda x: cv2.boxFilter(x, -1, (r, r))
    mI, mp = mean(I), mean(p); a = (mean(I * p) - mI * mp) / (mean(I * I) - mI * mI + eps)
    b = mp - a * mI; return mean(a) * I + mean(b)
for i in frames:
    out = f'{MD}/m{i:03d}.png'
    if os.path.exists(out): continue
    im = Image.open(f'{FR}/f{i:03d}.png').convert('RGB')
    m = np.asarray(remove(im, session=s, only_mask=True)).astype(np.float32) / 255
    g = np.asarray(im.convert('L')).astype(np.float32) / 255
    # refine at 2x for smoother edges
    g2 = cv2.resize(g, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC); m2 = cv2.resize(m, None, fx=2, fy=2, interpolation=cv2.INTER_LINEAR)
    r = guided(g2, m2, 9, 1e-3)
    r = np.clip(r, 0, 1)
    Image.fromarray((r * 255).astype(np.uint8)).save(out)
    print(i, flush=True)
