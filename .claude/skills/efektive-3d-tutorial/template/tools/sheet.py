"""Kontaktní arch z náhledových snímků: python tools/sheet.py out/prev [cols]"""
import glob, sys
from pathlib import Path
from PIL import Image

d = Path(sys.argv[1]); cols = int(sys.argv[2]) if len(sys.argv) > 2 else 3
fs = sorted(glob.glob(str(d / "s_*.png")))
W, H = 640, 360
rows = (len(fs) + cols - 1) // cols
sheet = Image.new("RGB", (cols * (W + 6), rows * (H + 6)), "white")
for i, f in enumerate(fs):
    sheet.paste(Image.open(f).convert("RGB").resize((W, H)), ((i % cols) * (W + 6), (i // cols) * (H + 6)))
sheet.save(d / "sheet.jpg", quality=88)
print(len(fs), "->", d / "sheet.jpg")
