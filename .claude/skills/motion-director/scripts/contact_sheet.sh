#!/usr/bin/env bash
# QA strip: every frame of a time range with frame numbers.
# usage: contact_sheet.sh video.mp4 [start_s=0] [dur_s=1] [out.png] [cols=10]
set -euo pipefail
IN=$1; SS=${2:-0}; DUR=${3:-1}; OUT=${4:-${IN%.*}_sheet_${SS}.png}; COLS=${5:-10}
N=$(python3 -c "import math;print(math.ceil($DUR*30))")
ROWS=$(( (N + COLS - 1) / COLS ))
ffmpeg -hide_banner -loglevel error -y -ss "$SS" -t "$DUR" -i "$IN" \
  -vf "scale=240:-1,drawtext=text='%{n}':x=4:y=4:fontsize=16:fontcolor=yellow:box=1:boxcolor=black,tile=${COLS}x${ROWS}" \
  -frames:v 1 "$OUT"
echo "$OUT"
