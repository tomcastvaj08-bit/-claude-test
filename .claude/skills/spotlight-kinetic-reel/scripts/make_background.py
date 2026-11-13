"""Procedurally paint the dark spotlight studio (world space = 720x1280 reference
frame).  Written at 2x with a 120px world margin so camera moves never show an edge.
Usage: python3 make_background.py OUT.png"""
import sys, numpy as np
from PIL import Image

SC, M = 2, 120
W, H = (720 + 2 * M) * SC, (1280 + 2 * M) * SC
ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
X = xs / SC - M; Y = ys / SC - M          # world coords

def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)

HORIZON = 925.0
img = np.full((H, W), 6.0, np.float32)
# wall: very dark, a touch lighter toward centre; floor slightly lighter than wall
img += 5.0 * np.exp(-((X - 360) / 300) ** 2) * (Y < HORIZON)
img = np.where(Y >= HORIZON, 9.0 + 6.0 * smooth(HORIZON, 1280, Y), img)
# faint vertical acoustic-panel stripes on the wall
img += (0.8 * np.sin(X / 720 * 2 * np.pi * 9) + 0.5 * np.sin(X / 720 * 2 * np.pi * 23 + 1)) * (Y < HORIZON) * smooth(-100, 400, Y)

# spotlight cone from the lamp at the top centre: width grows with depth, brightness falls off
half = 34 + (Y.clip(0, None)) * 0.20
core = np.exp(-((X - 360) / half) ** 2 * 1.6)
inten = 120 * np.exp(-Y.clip(0, None) / 260) + 22 * np.exp(-Y.clip(0, None) / 900)
img += core * inten * (Y < HORIZON + 40)
# lamp hotspot
img += 45 * np.exp(-(((X - 360) / 45) ** 2 + ((Y + 10) / 35) ** 2))

# floor light pool (ellipse), bright with a soft edge
d = np.sqrt(((X - 360) / 420) ** 2 + ((Y - 1012) / 72) ** 2)
pool = (1 - smooth(0.4, 1.12, d)) * (0.8 + 0.2 * smooth(1080, 970, Y))
img += 112 * pool * (Y > HORIZON - 30)
# soft halo around the pool
img += 12 * np.exp(-np.maximum(d - 0.9, 0) ** 2 / 0.2) * (Y > HORIZON - 30)

# vignette
v = np.sqrt(((X - 360) / 520) ** 2 + ((Y - 640) / 900) ** 2)
img *= 1 - 0.35 * smooth(0.6, 1.4, v)
rgb = np.clip(np.stack([img, img * 0.995, img * 1.01], -1), 0, 255)   # very slightly cool
Image.fromarray(rgb.astype(np.uint8)).save(sys.argv[1])
print('bg', W, H)
