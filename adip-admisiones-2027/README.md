# Equipo ADIP · Admisiones 2027 (anuncio vertical 9:16)

Edición del video *LU – Admisiones 2027* para pauta en Instagram y Facebook (objetivo: consultas por WhatsApp).
Proyecto editable en **Remotion**; el concepto, el guion con tiempos y las decisiones están en [`docs/CONCEPTO_Y_GUION.md`](docs/CONCEPTO_Y_GUION.md); cómo regenerar todo, en [`docs/RENDER.md`](docs/RENDER.md).

## Entrega (`entrega/`)
La entrevista **completa, en su orden original, sin sacar nada** (58,6 s con el cierre).

| Archivo | Qué es |
|---|---|
| `ADIP_Admisiones2027_Completa_9x16.mp4` | Versión principal: entrevista entera (58,6 s) |
| `ADIP_Admisiones2027_Completa_AperturaA_siete_terapias_9x16.mp4` | Misma pieza con un adelanto de 3 s: “siete tipos de terapias diferentes” |
| `ADIP_Admisiones2027_Completa_AperturaC_ya_es_el_momento_9x16.mp4` | Misma pieza con un adelanto de 2,5 s: “es hoy el momento de realizar las admisiones para el 2027” |
| `recortadas/` | Versiones anteriores acortadas (33 s, 15 s y aperturas B y C), por si sirven para otra cosa |

1080 × 1920 · 30 fps · H.264 BT.709 · AAC 48 kHz · –15 LUFS / –1,5 dBTP.

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
