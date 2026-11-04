#!/usr/bin/env bash
cd "$(dirname "$0")/.."
BR=${BROWSER:-/opt/pw-browsers/chromium}
for pair in "Noticiero16x9 noticiero_romance_16x9" "Noticiero9x16 noticiero_romance_9x16"; do
  set -- $pair
  npx remotion render src/index.ts $1 out/$2.mp4 --browser-executable=$BR --log=error
done
