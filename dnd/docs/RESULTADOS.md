# Resultados de las pruebas

Medidos el 28/10/2026 sobre el build de producción (`next build` + `next start`), Chromium 1243, Node 22.

## Tests automáticos

| Suite | Herramienta | Resultado |
|---|---|---|
| Lógica, datos, validación, contraseña, métricas, contraste | Vitest | **82 de 82** |
| Accesibilidad (axe-core, WCAG 2.0/2.1/2.2 A y AA + buenas prácticas) en 20 pantallas × 7 modos de visualización | Playwright + @axe-core/playwright | **0 violaciones** |
| Recorrido de demo completo solo con teclado | Playwright | pasa |
| Formularios, diálogo, mapa, recorrido, PWA offline, 404, reflow, tamaño de elementos tocables, pictogramas | Playwright | pasan |
| **Total e2e** | Playwright | **182 de 182** |

Modos de visualización auditados con axe: claro, oscuro, alto contraste, alto contraste oscuro, texto enorme (200 %), lectura fácil y con necesidades marcadas.
Pantallas: inicio, sistema de diseño, necesidades, listado, mapa, 3 fichas (completa, con discrepancia y casi vacía), reporte (visita y dato), recorrido (con y sin datos), comercios, panel Pro, relevamientos y accesibilidad. Más cada paso del asistente de reporte, el diálogo abierto con y sin errores y `/metricas`.

Otras verificaciones automáticas:
- Sin scroll horizontal a 320 px (equivale a 400 % de zoom) y a 360 px con texto al 200 %, en las 14 rutas principales.
- Todos los elementos interactivos de 44 × 44 px como mínimo en móvil (incluidos marcadores y controles del mapa).
- Contraste ≥ 7:1 en texto principal y secundario, y en los tres estados, en los 4 temas (`tests/unit/contraste.test.ts`).

## Lighthouse

Móvil (emulación por defecto de Lighthouse, con red y CPU limitadas):

| Página | Accesibilidad | Rendimiento | Buenas prácticas | SEO |
|---|---|---|---|---|
| / | 100 | 94 | 100 | 100 |
| /necesidades | 100 | 96 | 100 | 100 |
| /lugares | 100 | 93 | 100 | 100 |
| /lugares?vista=mapa | 100 | 93 | 100 | 100 |
| Ficha de un lugar | 100 | 96 | 100 | 100 |
| Reporte | 100 | 97 | 100 | 100 |
| Recorrido | 100 | 98 | 100 | 100 |
| /comercios | 100 | 99 | 100 | 100 |
| /comercios/panel | 100 | 98 | 100 | 100 |
| /relevamientos | 100 | 98 | 100 | 100 |
| /accesibilidad | 100 | 98 | 100 | 100 |

Escritorio: Accesibilidad 100, Buenas prácticas 100 y SEO 100 en las 11 páginas; Rendimiento 100 en 10 y 91 en el mapa (el mapa carga teselas de OpenStreetMap).

El rendimiento varía unos puntos entre corridas. Para repetirlo: `npm run build && npm start` y, en otra terminal, `npm run lighthouse`.

## Lo que NO se probó (todavía)

- Lectores de pantalla reales (VoiceOver, TalkBack, NVDA): ver `CHECKLIST-MANUAL.md`.
- Pruebas con personas con discapacidad usando la app.
- Safari y Firefox: los tests automáticos corren en Chromium.
