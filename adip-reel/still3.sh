#!/bin/sh
# usage: still3.sh Comp t1 t2 ... -> out/st/<Comp>_<t>.png
C=$1; shift
for t in "$@"; do
  f=$(python3 -c "print(round($t*30))")
  npx remotion still src/index.ts $C out/st/${C}_$t.png --frame=$f --browser-executable=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell --log=error 2>&1 | grep -v "^Rendered" | head -5
done
