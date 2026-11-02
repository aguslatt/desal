#!/bin/sh
# usage: tools/still.sh <seconds...>   -> out/portal_st/p_<t>.png
mkdir -p out/portal_st
for t in "$@"; do
  f=$(python3 -c "print(round($t*30))")
  npx remotion still src/index.ts Portal out/portal_st/p_$t.png --frame=$f --browser-executable=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell --log=error 2>&1 | tail -3
done
