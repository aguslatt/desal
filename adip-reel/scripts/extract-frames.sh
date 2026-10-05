#!/usr/bin/env bash
# Extrae fotogramas EXACTOS (decodificados del MP4 final) como PNG.
# Uso: scripts/extract-frames.sh <video.mp4> <carpetaSalida> <frame,frame,...>
set -euo pipefail
VID="$1"; OUT="$2"; FRAMES="$3"
mkdir -p "$OUT"
IFS=',' read -ra FS <<< "$FRAMES"
for f in "${FS[@]}"; do
  ffmpeg -loglevel error -y -i "$VID" -vf "select=eq(n\,${f})" -vframes 1 "$OUT/f$(printf %04d "$f").png"
done
