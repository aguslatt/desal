# Dirección de arte y contrato técnico — "El mensaje que borraste" (Equipo ADIP)

Reel vertical 1080×1920 · 30 fps · 1050 f (35 s) · Día Mundial de la Salud Mental (10/10).
Brief aprobado: `docs/brief-original.txt` (fuente de verdad del guion). Manual de marca ya volcado en `src/config/brand.ts`.

## Reglas de oro
1. **Guion literal.** Todo texto visible se importa de `src/config/script.ts` (NUNCA reescribir ni retipear strings). `node scripts/check-script.mjs` debe seguir en verde. Español rioplatense, voseo. Se permite SOLO partir líneas (ya definidas ahí).
2. **Tiempos desde `src/config/timeline.ts`** (fotogramas absolutos). Nada de números mágicos de tiempo en las escenas: si hace falta un hito nuevo, agregarlo a `timeline.ts` (no cambiar los existentes sin avisar: el audio y el hilo dependen de ellos).
3. **Geometría desde `src/config/layout.ts`** (zona segura x 120–960, y 220–1580; campo de redacción; carriles del hilo). Los textos importantes y el logo SIEMPRE dentro de la zona segura.
4. **Marca desde `src/config/brand.ts`**: paleta oficial del manual (naranja #FE801C, verde #94C920, violeta #8A00B7, rosa #ED2995, amarillo #FFCB01, gris #EFEFEF, negro) + crema #FFF6E7 y verde oscuro #074434 (muestreados del manual; reemplazan la paleta provisoria del brief). Texto oscuro sobre fondo claro. El naranja se reserva para cursor, hilo, subrayados y detalles (NO para texto chico: contraste insuficiente sobre crema). **Todo texto: contraste ≥ 4,5:1 (verificarlo numéricamente)**.
5. **Tipografía: Montserrat** (archivo local variable `public/fonts/Montserrat-VF.ttf`, cargado por `src/lib/fonts.ts`; importar `fontFamily` desde ahí en cada escena). Pesos regular 400 / medium 500 / semibold 600 (bold 700 solo titulares). Tamaños orientativos: titulares 68–88 px, mensajes 54–68 px, subtítulos 48–58 px. Ningún texto principal < 48 px.
6. **Animación solo con fotogramas Remotion** (`useCurrentFrame`/`interpolate`/`Easing`); **prohibido** CSS `transition`/`animation`/keyframes y Tailwind animate. Movimientos breves, easing suave (p. ej. `Easing.bezier(0.16, 1, 0.3, 1)`), sin rebotes exagerados, sin glitch, sin transiciones que dificulten leer. Preferir `scale`/`translate`/`rotate` como propiedades CSS (no `transform:`), `interpolate` inline en `style`.
7. **Estructura editable (Remotion 4.0.533 + skills):** cada escena es un componente `Interactive.withSchema({ wrapInSequence: true })` (ver stubs en `src/scenes/*.tsx`: conservar nombre del export, `componentName`, firma `style` y el export). Dentro de la escena: `const frame = useAbsFrame(SCENES.sX.from)` (src/lib/scene.ts) para trabajar en fotogramas absolutos. Texto editable inline donde sea razonable; subcomponentes en `src/components/<escena>/`. Cargar fuentes importando `../lib/fonts.ts`. `premountFor={fps}` en medios/secuencias anidadas.
8. **Sin personas ni consultorios generados** presentados como reales de ADIP. No inventar nombres, mensajes recibidos ni datos personales. Sin fotos de stock. No usar las imágenes de `/home/user/desal/public` (son de otro proyecto).
9. **El sentido completo se entiende sin sonido.**
10. **Zona de revisión:** NO modificar archivos que no son de tu escena (ver propiedad abajo). Si necesitás un cambio de contrato, hacelo mínimo en `src/config/*` y reportalo.
11. Verificá siempre: `npx tsc --noEmit` y render de fotogramas con `scripts/shots.sh <Composición> <carpeta> <frames>` (carpeta dentro del scratchpad, no en `entrega/`); mirá los PNG con la herramienta Read. Revisá fotogramas consecutivos en las transiciones (no solo estáticos).

## Sistema visual
- **Fondo base crema #FFF6E7.** Espacio amplio, composición equilibrada, estética editorial cálida, adultos. Sombras muy suaves (rgba ink 6–10 %). Radios generosos (56 px campo, 28–40 px tarjetas).
- **Recurso conductor — cursor/hilo:** barra naranja 8×64 px titilando al final del 3.er mensaje → se estira y se vuelve una línea naranja de 6 px (extremos redondeados) que acompaña las escenas 3–5 y llega al cierre. Sutil y SIEMPRE separada de las letras (≥ `THREAD.clearance` px). Carriles (y): escena 3 = 960, escena 4 = 1240, escena 5 = 780.
- **Cursor (compartido):** `CURSOR` en layout.ts; posición final `getFinalCursorAnchor()` en `src/lib/cursorAnchor.ts`; opacidad `cursorOpacity(frame)` en `src/config/typing.ts`. Escena 2 dibuja el cursor para frame < `CURSOR_HANDOFF`; `ThreadLine` lo dibuja (idéntico: misma posición, tamaño, opacidad 1) desde `CURSOR_HANDOFF`, sin saltos.
- **Chat:** interfaz de mensajería verosímil, MUY legible, ocupa gran parte del encuadre (el protagonista es el mensaje, no un teléfono). Los mensajes se están redactando: viven en el campo de escritura y NO se envían (botón de envío inactivo siempre). Sin nombres, sin mensajes recibidos, sin datos personales (encabezado abstracto sin texto).

## Escenas y propiedad de archivos
| Escena | Ventana | Archivos propios |
|---|---|---|
| Chat (entorno) + 1 Inicio + 2 Mensajes | 0–420 | `src/scenes/ChatEnvironment.tsx`, `Scene1Hook.tsx`, `Scene2Messages.tsx`, `src/components/chat/*` |
| 3 El giro | 420–630 | `src/scenes/Scene3Turn.tsx`, `src/components/turn/*` |
| 4 El acompañamiento | 630–840 | `src/scenes/Scene4Companion.tsx`, `src/components/companion/*`, `src/components/MediaSlot.tsx` |
| 5 El cierre | 840–1050 | `src/scenes/Scene5Closing.tsx`, `src/components/closing/*` |
| Hilo gráfico | 404–1050 | `src/scenes/ThreadLine.tsx` |
| Portada | still | `src/Cover.tsx` |
| Audio | 35 s | `scripts/build-audio.ts`, `scripts/verify-audio.ts`, `public/audio/*.wav`, `docs/AUDIO.md` |

Integración (`Reel.tsx`, `Root.tsx`, `timeline.ts` hitos, mezcla de volúmenes) la hace la persona coordinadora.

## Especificación por escena
**Escena 1 · El inicio (0–3 s).** Desde el fotograma 0 ya se ve el entorno de chat y el gancho legible: «¿Cuántas veces escribiste esto… y lo borraste?» (≈80 px, 3 líneas, centrado, zona y 300–700, arriba del campo de redacción). Entrada sutil y rápida (asienta en `HOOK_TIMING.settle` f partiendo de ~55 % de opacidad/14 px, NUNCA fotograma vacío), permanece legible hasta `HOOK_TIMING.exitFrom`, sale suave. Sin logo. Ambiente discreto.

**Escena 2 · Los mensajes (3–14 s).** Campo de redacción grande en `COMPOSER` (centrado, h 352). Tipeo/borrado según `MESSAGE_TIMINGS` (visibleChars por fotograma; el texto se parte con `lines`; tipeo revela carácter a carácter respetando los cortes de línea). Mensajes 1 y 2: se escriben, se sostienen ~1 s completos y se borran (aceleración). Mensaje 3: queda, sin enviar, el cursor titila `CURSOR_BLINK`, pausa perceptible. Tamaño 62 px medium. Cursor sólido al escribir/borrar. Sin locución. El campo se desvanece suave entre ≈404 y ≈432 dejando solo el cursor (que pasa al hilo).

**Escena 3 · El giro (14–21 s).** (Versión alternativa por falta de grabación.) Fondo cálido de marca (crema → durazno/naranja suave; el texto oscuro mantiene ≥ 7:1). «Podés empezar por ahí.» sobre el carril (y 700–904) y «Por no saber cómo empezar.» bajo el carril (y 1016–1260) — la línea naranja separa ambas oraciones. Aparecen en dos momentos (`TURN_TIMING`), con pausa entre ambas. Sin sonido de voz. Dejar listo el reemplazo por la grabación: si `MEDIA.turnVideo` ≠ null, usar `<Video>` de `@remotion/media` a pantalla completa + subtítulos de la misma frase en zona baja que no tape la cara.

**Escena 4 · El acompañamiento (21–28 s).** Planos: dos o tres composiciones gráficas de marca (formas orgánicas abstractas con la paleta oficial, inspiradas en el trazo del logo; sin figuras humanas realistas) en `ZONES.s4.media`, como "planos" listos para reemplazar por video/foto real (`MediaSlot`: si `MEDIA.companionClips[i]` ≠ null muestra `<Video>`/`<CanvasImage>`; si no, la composición gráfica). Subtítulos exactos por unidades de sentido (`COMPANION_UNITS`/`COMPANION_TIMING`), máx. 2 líneas, 52–58 px semibold sobre el carril inferior (y 1296–1580), énfasis moderado en «escucharte», «acompañarte», «a tu ritmo» (subrayado/marcador naranja detrás, texto sigue siendo oscuro). Nada tapa elementos importantes.

**Escena 5 · El cierre (28–35 s).** Fondo crema. Mensaje «Si hoy te cuesta decirlo, / podés compartir este video.» (58 px semibold, interlineado 76 px, 2 renglones como en el brief; bloque y 470–636 dentro de la zona 360–724; a 58 px la cláusula más larga mide ≈ 820 px, el máximo que entra en la zona segura), carril de la línea y=780, **logo oficial** (`LOGO`, `public/brand/logo-equipo-adip.png`, sin deformar, ancho ≈ 600–680 px, nunca estirado), debajo «10 de octubre» + «Día Mundial de la Salud Mental». Hitos `CLOSING_TIMING`; la composición completa queda visible y estática hasta el último fotograma (≥ 3 s) — sin fundido a negro ni cortes abruptos.

**Portada.** «El mensaje que borraste» (título), «Día Mundial de la Salud Mental» (secundario), logo oficial, misma dirección de arte (crema, campo de redacción con «No sé por dónde empezar…» y cursor/hilo naranja). Contenido clave dentro del recorte central 4:5 (y 285–1635) para grillas de perfil; todo el texto legible en miniatura.

## Audio (stems de 35 s, 48 kHz, 16-bit, estéreo, ya alineados al reel)
`ambiente.wav` (aire/sala discreto desde el f 0), `teclado.wav` (una pulsación por `KEY_EVENTS`, en el fotograma exacto), `musica.wav` (instrumental cálida y sutil, original, sintetizada por código; entra suave en `SFX_CUES.musicIn`, cierra suave), `sfx-hilo.wav` (hitos `SFX_CUES`: nacimiento del hilo, oraciones, desplazamientos, logo). Sin samples de terceros. Sin locución (`VOICEOVER.enabled=false`).

## Definición de terminado (por pieza)
- `npx tsc --noEmit` limpio; `node scripts/check-script.mjs` OK.
- Fotogramas representativos revisados visualmente (entrada, estados estables, salida y 3–4 fotogramas consecutivos de cada transición).
- Textos sin cortes ni desbordes; contraste ≥ 4,5:1; dentro de la zona segura; sin superposición con el hilo.
- Sin `transition:`/`animation:` CSS; todo depende de `useCurrentFrame`.
