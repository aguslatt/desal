# Equipo ADIP responde · Preguntas frecuentes (reel 1080 × 1920, 30 fps)

Proyecto editable del reel. Entregable: `out/ADIP_Preguntas_Frecuentes_Final.mp4` (H.264 + AAC).

## Rehacer desde cero

```bash
npm install
# 1. Poner el original de cámara en source/video.mp4 (no se versiona: pesa 149 MB)
# 2. Video base (HDR→SDR, color, reloj borrado) y audio (voz + música + efectos)
npm run prep
# 3. Render final
npm run render
```

`npm run studio` abre Remotion Studio para ajustar con vista previa. `node scripts/stills.mjs 7.5 19.5` saca fotogramas sueltos a `out/st/`.

## Dónde se toca cada cosa

| Qué | Archivo |
|---|---|
| Cortes, encuadres por plano, subtítulos | `src/timeline.ts` |
| Preguntas, titulares y tiempos de cada bloque | `src/blocks.tsx` |
| Apertura, cierre (CTA + logo), subtítulos | `src/Main.tsx` |
| Tarjeta → etiqueta → subrayado → marco, encabezado de sección | `src/kit.tsx`, `src/anim.ts` |
| Paleta y trazo del manual v2 | `src/theme.ts` |
| Tiempos de los efectos de sonido | `src/sfx.json` (después `npm run prep`) |
| Música (sintetizada, original), limpieza de voz | `scripts/make_audio.py` |
| Color y borrado del reloj (`--keep-clock` lo conserva) | `scripts/prep_video.py` |
| Transcripción con tiempos por palabra | `scripts/transcribe.py`, `docs/transcripcion.md` |

Logo y Montserrat: archivos oficiales en `public/brand` y `public/fonts`.
