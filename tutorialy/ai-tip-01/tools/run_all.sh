#!/bin/bash
# Celý zbytek výroby jedním příkazem (pusť na pozadí, třeba přes noc):
#   bash tools/run_all.sh [JOBS]
# Počká na doběhnutí align.py (když běží), pak: build → events → QA archy (+každé 3 s) → render → mix → events → bed → master → kompaktní 1080p.
# Hotové úseky renderu se přeskočí, takže po pádu nebo restartu kontejneru stačí spustit znovu.
set -e
cd "$(dirname "$0")/.."
JOBS=${1:-3}
export PLAYWRIGHT_BROWSERS_PATH=${PLAYWRIGHT_BROWSERS_PATH:-/opt/pw-browsers}
# pozor: pgrep -f matchne i vlastní shell, pokud je vzor v jeho příkazové řádce -> vzor je jen tady ve skriptu
while pgrep -f "tools/align.py" >/dev/null; do sleep 20; done
SLUG=$(python3 -c "import json;print(json.load(open('project.json',encoding='utf-8'))['slug'])")
(cd tools && python3 build.py | head -1)
python3 tools/events.py 2>&1 | grep -i "miss\|délka" || true
python3 tools/qa.py --every 3 >/dev/null 2>&1 || true
python3 tools/render_chunks.py --jobs "$JOBS" --chunk 125 2>&1 | tail -2
python3 tools/mix.py | tail -1
python3 tools/events.py | tail -1
python3 tools/bed.py | tail -1
python3 tools/master.py | tail -2
# do telefonu: ~10 MB/min, faststart (z chatu jde uložit jen menší soubor)
ffmpeg -v error -y -i "out/${SLUG}_MASTER.mp4" -c:v libx264 -preset slow -crf 26 -maxrate 2500k -bufsize 5000k -pix_fmt yuv420p \
  -c:a aac -b:a 160k -movflags +faststart "out/${SLUG}_1080p.mp4"
ls -la out/*.mp4
echo RUN_ALL_DONE
