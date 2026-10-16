"""Joins the five replicas with the reel's own item-switch: hard cut + scale pop
(first frame of the new item 1.04x, second 1.02x, then 1.0 - measured on the card swaps)."""
import subprocess, numpy as np
from fxlib import *

POP = [1.04, 1.02]
CLIPS = ["01_zoom_through_cut.mp4", "02_frame_break.mp4", "03_digital_zoom.mp4",
         "04_paper_cut.mp4", "05_doodle_boil.mp4"]

out = Writer("00_showreel.mp4")
for ci, name in enumerate(CLIPS):
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", os.path.join(OUT, name),
                          "-f", "rawvideo", "-pix_fmt", "bgr24", "-"], capture_output=True, check=True).stdout
    frames = np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3)
    for i, f in enumerate(frames):
        if ci and i < len(POP):
            f = scale_about(f, POP[i], W / 2, H / 2)
        out.write(f)
out.close()
