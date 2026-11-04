#!/usr/bin/env bash
# Sting de noticiero: tres tonos (sol-do-mi) con armónico y decaimiento. Sale en public/sting.wav
set -e
cd "$(dirname "$0")/.."
n() { echo "aevalsrc='0.45*sin(2*PI*$1*t)*exp(-$3*t)+0.18*sin(4*PI*$1*t)*exp(-$3*1.4*t)+0.08*sin(6*PI*$1*t)*exp(-$3*2*t)':d=$2:s=44100"; }
ffmpeg -y -loglevel error \
  -f lavfi -i "$(n 392.00 0.5 3)" \
  -f lavfi -i "$(n 523.25 0.5 3)" \
  -f lavfi -i "$(n 659.25 1.8 1.8)" \
  -filter_complex "[0]adelay=0|0[a];[1]adelay=200|200[b];[2]adelay=400|400[c];[a][b][c]amix=inputs=3:normalize=0,afade=t=out:st=1.8:d=0.4,alimiter=limit=0.9" \
  -ac 2 public/sting.wav
