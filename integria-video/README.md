# Integria Salud · "Sil – Evaluaciones Neurocognitivas" (posproducción)

Entregables (carpeta `out/`):
- `Integria_Evaluaciones_Neurocognitivas_1080x1920.mp4` — H.264 1080×1920, 30 fps, AAC 48 kHz, 49,633 s (misma duración y 1.489 fotogramas que el original).
- `Integria_Evaluaciones_Neurocognitivas.srt` — 25 bloques, máx. 2 líneas.

Proyecto editable (todo en código, reproducible):
- `src/config.py` — paleta, planos, plan de cámara, transiciones, gráficos, subtítulos y audio (todos los tiempos).
- `src/render_video.py` — reencuadres, color, gráficos de marca, subtítulos y transiciones.
- `src/render_audio.py` — nivelación de voces, limpieza liviana, música instrumental propia y SFX.
- `src/subs.py` (alinea subtítulos y exporta SRT), `src/qc.py`, `src/qc_audio.py` (controles).
- `assets/` — logo original (extraído del PDF de fondo de Zoom), Montserrat, transcripciones Whisper.

Regenerar (video fuente en `work/src.mp4`):
```bash
cd src && python3 subs.py && python3 render_audio.py && python3 render_video.py full ../work/video_noaudio.mp4
ffmpeg -i ../work/video_noaudio.mp4 -i ../work/audio_final.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k ../out/final.mp4
```
Requiere: ffmpeg, Python 3 con numpy, opencv-python-headless (4.x), Pillow, scipy, soundfile (y faster-whisper sólo para los controles).

## Decisiones
- **Contenido intacto**: no hay recortes, aceleraciones ni reordenamientos. Los 12 cortes internos del montaje aprobado se resuelven con transiciones de marca que *cubren* el corte (2 fotogramas cubiertos); el audio nunca se toca en el tiempo.
- **Identidad**: paleta del manual (#3439E9, #10205A, #43C0C7, #B8CBFA, #EDF4FF), Montserrat, contenedores redondeados con doble línea, curvas de conexión como recurso principal y trama modular en una de las transiciones. Logo original sin deformar sobre contenedor claro (no se usó versión negativa: la del PDF de familias trae un artefacto de color).
- **Textos agregados**: sólo palabras dichas en el audio ("Lic. Silvina" sale de "la licenciada Silvina"). Sin apellido, matrícula, contacto ni llamados a la acción inventados. La frase "Salud integral · Vínculo · Confianza" es de la p. 4/24 del manual.
- **Música**: pieza instrumental generada en código (sin derechos de terceros), ~-33 dBFS de cama con ducking bajo la voz. SFX: whoosh en los 3 cambios de tema y una campanita al cierre.
- **Color**: los planos 1–6 estaban más oscuros y cálidos (pared ≈214 vs ≈227): se igualaron con ganancias por plano + curva suave.

## Puntos a revisar por una persona
Whisper large-v3 y medium discreparon en algunos tramos; se usó large-v3, que además coincide con los cortes y con la continuidad real del audio:
1. 3,2 s — "…Silvina, **que** nos va a contar…" (medium: "Silvina. Nos va a contar").
2. 11,4 s — "vemos **a** alguna persona".
3. 23,2–26 s — "En el caso de que yo, como hija, nieta, o vea que algún familiar…" (la frase queda entrecortada en el original; una re-transcripción del MP4 final agregó una "o" extra en algún punto).
4. 36,2 s — "**no entienden** cómo proceder" (medium: "para entender cómo proceder").
5. Ortografía del nombre "Silvina".
