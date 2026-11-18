#!/bin/sh
# Full render: Remotion (picture + mix) -> final H.264/AAC 1080x1920 30 fps with faststart.
set -e
EXE=$(ls -d /opt/pw-browsers/chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell 2>/dev/null | head -1)
npx remotion render src/index.ts AdipResponde out/render.mp4 --concurrency=4 --log=error ${EXE:+--browser-executable=$EXE}
ffmpeg -v error -y -i out/render.mp4 -c:v libx264 -preset slow -crf 18 -profile:v high -pix_fmt yuv420p -r 30 \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
  -af "volume=1.8dB,alimiter=limit=0.84:level=false" -c:a aac -b:a 192k -ar 48000 -movflags +faststart \
  out/ADIP_Preguntas_Frecuentes_Final.mp4
echo done
