#!/usr/bin/env bash
# Montaje completo de "Admisiones 2027 · EQUIPO ADIP" (vertical 9:16, 1080×1920, 30 fps).
# Requisitos: ffmpeg (con zscale), python3 con numpy scipy opencv-python-headless onnxruntime playwright, Chromium.
# Uso:  SRC=/ruta/andy1.mov ./build.sh        (cada etapa se puede repetir borrando su resultado en salida/)
set -euo pipefail
cd "$(dirname "$0")"
SRC="${SRC:?Definí SRC con la ruta del video original (andy1.mov)}"
OUT="${OUT:-salida/EquipoADIP_Admisiones2027_9x16.mp4}"
mkdir -p salida
[ -f caras.json ] || python3 herramientas/analisis_caras.py "$SRC" "${MODELO_CARAS:?Definí MODELO_CARAS (yunet.onnx)}" caras.json
python3 herramientas/plan_montaje.py "$SRC"                                  # cortes, cámara, posiciones de cara
rm -rf salida/capas && python3 render_overlay.py                             # capas gráficas (PNG con transparencia)
python3 herramientas/compositor.py --src "$SRC" --calidad final --salida salida/video_sin_audio.mp4   # imagen: HDR→SDR, reencuadre, color, capas, recorte
python3 herramientas/audio.py "$SRC" salida/audio_final.wav                  # voz + música + efectos
ffmpeg -y -v error -i salida/video_sin_audio.mp4 -i salida/audio_final.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -ar 48000 -movflags +faststart -shortest "$OUT"
echo "Listo: $OUT"
