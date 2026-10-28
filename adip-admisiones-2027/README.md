# Equipo ADIP · Admisiones 2027 (anuncio vertical 9:16)

Edición del video *LU – Admisiones 2027* para pauta en Instagram y Facebook (objetivo: consultas por WhatsApp).
Proyecto editable en **Remotion**; el concepto, el guion con tiempos y las decisiones están en [`docs/CONCEPTO_Y_GUION.md`](docs/CONCEPTO_Y_GUION.md); cómo regenerar todo, en [`docs/RENDER.md`](docs/RENDER.md).

## Entrega (`entrega/`)
| Archivo | Qué es |
|---|---|
| `ADIP_Admisiones2027_Principal_9x16.mp4` | Versión principal (≈33 s) · gancho “siete terapias” |
| `ADIP_Admisiones2027_Corto15s_9x16.mp4` | Versión breve (≈15 s) |
| `ADIP_Admisiones2027_GanchoB_edades_9x16.mp4` | Misma pieza, apertura B: “desde el nacimiento hasta aproximadamente 100 años” |
| `ADIP_Admisiones2027_GanchoC_ya_es_el_momento_9x16.mp4` | Misma pieza, apertura C: “es hoy el momento de realizar las admisiones para el 2027” |
| `portada_*.png` | Cuadros sugeridos como portada |

1080 × 1920 · 30 fps · H.264 BT.709 · AAC 48 kHz · –15 LUFS.

## Estructura
```
src/
  Ad.tsx          composición: planos de video (reencuadres, arco del cierre) + capas gráficas
  scenes.tsx      escenas: gancho, intro, lista, edades, individual, cierre/CTA, subtítulos
  camera.ts       reencuadres sobre el original 2160×3840 y marco en arco
  kit.tsx         texto con máscara, cabezas, trazo (hilo), etiqueta, logo, ajuste de texto
  tokens.ts       paleta ADIP, tipografía, easings, zona segura
  timelines/      generado por tools/build.py (cortes a cuadro, palabras, subtítulos, marcas)
tools/            build.py (montaje + audio) · transcribe.py · render.sh · stills.mjs · qa_*.py
public/brand/     logos OFICIALES del manual v2
public/fonts/     Montserrat 300–900
```
`public/media/sdr4k.mp4` (390 MB, HDR→SDR) no se versiona: ver `docs/RENDER.md`.
