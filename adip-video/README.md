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

## Versión 2

- El logo oficial de Equipo ADIP queda fijo arriba todo el video, junto a la barra de progreso de las cinco preguntas.
- Cada pregunta ocupa la pantalla completa (sin imagen de fondo) y se pliega en la etiqueta cuando empieza la respuesta.
- Apertura con las preguntas como burbujas de chat que cargan la barra una por una.
- Datos de contacto tomados de equipoadip.com.ar: WhatsApp 11 2781-5279, info@equipoadip.com.ar y el fijo de cada sede (`VIAS` en `src/blocks.tsx`).

## Pausas de lectura

Después de las respuestas sobre prestaciones y contacto, la información queda sola a pantalla completa unos segundos (`src/holds.tsx`). La duración de cada pausa se cambia en `HOLDS` (`src/timeline.ts`); el audio las toma solo al correr `npm run prep`.
