"""Estimate the per-frame camera (zoom + pan) of the source footage relative to a
reference frame, so world-space graphics (background, card, texts) follow the
footage's camera moves.  Output: JSON {frame: [s, tx, ty]} meaning
screen = s * world + (tx, ty)   (720x1280 source pixel space, world = ref frame).
Usage: python3 track_camera.py FRAMES_DIR REF_FRAME OUT.json first-last [first-last ...]
"""
import sys, json, numpy as np, cv2

def load(d, i, sc=0.5):
    im = cv2.imread(f"{d}/f{i:03d}.png", cv2.IMREAD_GRAYSCALE)
    im = cv2.resize(im, None, fx=sc, fy=sc, interpolation=cv2.INTER_AREA)
    return cv2.GaussianBlur(im.astype(np.float32) / 255.0, (0, 0), 2)

def ecc(ref, img, mask, init):
    warp = init.astype(np.float32).copy()
    crit = (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 300, 1e-6)
    try:
        cc, warp = cv2.findTransformECC(ref, img, warp, cv2.MOTION_AFFINE, crit, mask, 5)
    except cv2.error:
        return None, 0
    return warp, cc

def main():
    d, ref_i, out = sys.argv[1], int(sys.argv[2]), sys.argv[3]
    ranges = [tuple(map(int, r.split('-'))) for r in sys.argv[4:]]
    sc = 0.5
    ref = load(d, ref_i, sc)
    h, w = ref.shape
    mask = np.zeros_like(ref, dtype=np.uint8)
    mask[int(h * 0.50):, :] = 255          # lower half: legs, chair, floor pool (no graphics there)
    res = {}
    for a, b in ranges:
        # walk outward from the frame closest to the reference, reusing the previous warp
        order = list(range(b, a - 1, -1)) if ref_i > b else list(range(a, b + 1))
        if a <= ref_i <= b:
            order = list(range(ref_i, b + 1)) + list(range(ref_i - 1, a - 1, -1))
        warp = np.eye(2, 3, dtype=np.float32)
        for i in order:
            if i == ref_i - 1 and a <= ref_i <= b:
                warp = np.eye(2, 3, dtype=np.float32)
            wp, cc = ecc(ref, load(d, i, sc), mask, warp)
            if wp is not None and cc > 0.5:
                warp = wp
            # warp maps ref(world) coords -> frame coords (findTransformECC: template=ref, input=img)
            s = float(np.sqrt(abs(np.linalg.det(warp[:, :2]))))
            tx, ty = float(warp[0, 2] / sc), float(warp[1, 2] / sc)
            res[i] = [s, tx, ty, float(cc)]
            print(i, round(s, 4), round(tx, 1), round(ty, 1), round(float(cc), 3), flush=True)
    json.dump(res, open(out, 'w'), indent=0)

if __name__ == '__main__':
    main()
