#!/bin/sh
# uso: tools/still.sh <Composición> t1 t2 ...   (segundos) → out/st/<comp>_<t>.png
comp=$1; shift
for t in "$@"; do
  f=$(python3 -c "print(round($t*30))")
  npx remotion still src/index.ts "$comp" "out/st/${comp}_$t.png" --frame=$f --log=error 2>&1 | tail -3
done
