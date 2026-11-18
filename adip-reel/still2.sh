#!/bin/sh
# usage: still2.sh <CompositionId> <outdir> t1 t2 ...   (seconds)
c=$1; o=$2; shift 2; mkdir -p $o
for t in "$@"; do
  f=$(python3 -c "print(round($t*30))")
  npx remotion still src/index.ts $c $o/s_$t.png --frame=$f --scale=0.5 --browser-executable=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell --log=error 2>&1 | tail -3
done
