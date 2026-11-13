#!/usr/bin/env bash
# Full pipeline: source reel -> recreated reel (only the character is taken from the source).
# Usage: build.sh SOURCE.mp4 WORK_DIR OUT.mp4
set -euo pipefail
SRC=$1; WD=$2; OUT=$3
HERE=$(cd "$(dirname "$0")" && pwd); SK=$(dirname "$HERE")
mkdir -p "$WD"/{full,matte,work/fonts,render}
# 1. frames (source numbering f001 = t0)
[ -f "$WD/full/f001.png" ] || ffmpeg -v error -i "$SRC" "$WD/full/f%03d.png"
# 2. character mattes (shots with the character only; the "show" card F139-179 has none)
python3 -I "$HERE/segment_character.py" "$WD/full" "$WD/matte" 1-138 180-223
# 3. camera track of the footage (world = frame 60), 4. cutouts + repaired camera
python3 -I "$HERE/track_camera.py" "$WD/full" 60 "$WD/cam_raw.json" 1-138 180-223 > /dev/null
python3 -I "$HERE/prepare_plates.py" "$WD/full" "$WD/matte" "$WD/cam_raw.json" "$WD/work"
# 5. background plate, 6. sound
python3 -I "$HERE/make_background.py" "$WD/work/bg_world.png"
python3 -I "$HERE/sound_design.py" "$WD/work/sfx.wav" 223
# 7. render + encode
cp "$SK/template/composition.html" "$WD/work/"; cp "$SK/assets/fonts/"*.ttf "$SK/assets/fonts/"*.otf "$WD/work/fonts/"
node "$HERE/render_frames.mjs" "$WD/work" "$WD/render" 1 223 1
bash "$HERE/encode.sh" "$WD/render" "$WD/work/sfx.wav" "$OUT"
