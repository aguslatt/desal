#!/usr/bin/env bash
# Capturas de control: una por escena (y más) en ambos formatos
OUT=${1:-shots}; mkdir -p "$OUT"; cd "$(dirname "$0")/.."
for comp in Noticiero16x9 Noticiero9x16; do
  for f in 30 70 120 250 290 380 400 450 620 700 740 800 890; do
    npx remotion still src/index.ts $comp "$OUT/${comp}_$(printf %03d $f).jpg" --frame=$f --browser-executable=/opt/pw-browsers/chromium --log=error 2>&1 | grep -v "^$" | head -3
  done
done
