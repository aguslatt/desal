# Cómo regenerar todo

Requisitos: Node 22, ffmpeg (con `zscale`), Python 3.13 (`numpy`, `faster-whisper` sólo para re-transcribir) y Chromium headless (la ruta está en `remotion.config.ts`).

```sh
cd adip-admisiones-2027 && npm install
mkdir -p tools/_cache public/media

# 1) Fuente: HLG/HDR → SDR BT.709 (2160×3840, intra-frecuente para buscar cuadros rápido)
ffmpeg -i "LU - Admisiones 2027.mp4" -an \
  -vf "zscale=t=linear:npl=203,format=gbrpf32le,zscale=p=bt709,tonemap=tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p" \
  -c:v libx264 -preset fast -crf 14 -g 6 -r 30 -colorspace bt709 -color_primaries bt709 -color_trc bt709 -movflags +faststart public/media/sdr4k.mp4
# 2) Audio original
ffmpeg -i "LU - Admisiones 2027.mp4" -vn -ac 2 -ar 48000 -c:a pcm_s16le tools/_cache/a48.wav

# 3) Montaje: cortes, audio procesado y timelines (src/timelines/*.json, out/audio/*.wav, docs/EDL.md)
python3 -I tools/build.py

# 4) Edición en vivo
npm run studio

# 5) Render final (video con Remotion + mezcla de audio) → entrega/*.mp4
sh tools/render.sh            # o: sh tools/render.sh Principal
```

Herramientas de control: `node tools/stills.mjs <Composición> t1 t2 …` (cuadros sueltos) · `python3 -I tools/sheet.py` (hoja de contactos) · `python3 -I tools/qa_sync.py main`.
