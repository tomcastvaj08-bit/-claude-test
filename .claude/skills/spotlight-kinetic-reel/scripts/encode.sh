#!/usr/bin/env bash
# Encode rendered PNG frames + sound design into the final reel.
# Usage: encode.sh RENDER_DIR SFX_WAV OUT.mp4
set -euo pipefail
R=$1; A=$2; O=$3
ffmpeg -v error -y -framerate 30 -start_number 1 -i "$R/r%03d.png" -i "$A" \
  -vf "noise=alls=4:allf=t,format=yuv420p" -c:v libx264 -preset slow -crf 17 -profile:v high \
  -c:a aac -b:a 192k -shortest -movflags +faststart "$O"
echo "wrote $O"
