#!/bin/sh
# usage: still2.sh t1 t2 ...  (seconds) -> out/st/t_<t>.png
for t in "$@"; do
  f=$(python3 -c "print(round($t*30))")
  npx remotion still src/index.ts Taller out/st/t_$t.png --frame=$f --browser-executable=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell --log=error 2>&1 | tail -3
done
