#!/bin/sh
# Renderiza las cuatro versiones (video mudo con Remotion) y les suma el audio procesado.
# uso: sh tools/render.sh [Principal GanchoB GanchoC Corto15]
cd "$(dirname "$0")/.."
mkdir -p out/silent entrega
[ $# -eq 0 ] && set -- Completa AperturaA AperturaC
for comp in "$@"; do
  case $comp in
    Completa)  aud=full;  name=ADIP_Admisiones2027_Completa_9x16 ;;
    AperturaA) aud=fullA; name=ADIP_Admisiones2027_Completa_AperturaA_siete_terapias_9x16 ;;
    AperturaC) aud=fullC; name=ADIP_Admisiones2027_Completa_AperturaC_ya_es_el_momento_9x16 ;;
    Principal) aud=main;  name=ADIP_Admisiones2027_Principal_9x16 ;;
    GanchoB)   aud=hookB; name=ADIP_Admisiones2027_GanchoB_edades_9x16 ;;
    GanchoC)   aud=hookC; name=ADIP_Admisiones2027_GanchoC_ya_es_el_momento_9x16 ;;
    Corto15)   aud=cut15; name=ADIP_Admisiones2027_Corto15s_9x16 ;;
  esac
  npx remotion render src/index.ts "$comp" "out/silent/$comp.mp4" --codec=h264 --crf=18 --pixel-format=yuv420p --color-space=bt709 --concurrency=4 --log=error \
  && ffmpeg -v error -y -i "out/silent/$comp.mp4" -i "out/audio/$aud.wav" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -ar 48000 -shortest -movflags +faststart \
       -metadata title="Equipo ADIP · Admisiones 2027" "entrega/$name.mp4" \
  && echo "listo $name"
done
