# Dirección de arte y contrato técnico v2 — «El mensaje que borraste» (Equipo ADIP)

Reel vertical 1080×1920 · 30 fps · **1140 f (38 s)** · Día Mundial de la Salud Mental (10/10).
Brief aprobado v2: `docs/brief-v2.txt` (reemplaza la dirección visual anterior; el brief original `docs/brief-original.txt` sigue valiendo para guion, marca y sonido).
La versión anterior (motion graphics) quedó en el tag git `v1-version-grafica-revision`.

## Reglas de oro
1. **Guion literal.** Todo texto visible sale de `src/config/script.ts` (NUNCA retipear). `node scripts/check-script.mjs` en verde. Español rioplatense, voseo. Textos nuevos del brief v2: contacto «Amiga», mensaje recibido «¿Cómo estás?», «No tenés que pasar por esto en soledad.»
2. **Tiempos en `src/config/timeline.ts`** (fotogramas absolutos). Sin números mágicos de tiempo en las piezas: si falta un hito, agregarlo ahí (no cambiar los existentes sin avisar: audio y cámara dependen de ellos).
3. **Marca desde `src/config/brand.ts`**: paleta oficial del manual (naranja #FE801C, verde #94C920, violeta #8A00B7, rosa #ED2995, amarillo #FFCB01, gris #EFEFEF, negro #000000) + crema #FFF6E7 y verde oscuro #074434 (muestreados del manual). **Tipografía Montserrat en TODO texto** (local, `src/lib/fonts.ts`; importar `fontFamily`). **Logo oficial** `public/brand/logo-equipo-adip.png` (734×326, relación 2,2515): nunca deformar, recolorear ni cruzar con líneas. Contraste de texto ≥ 4,5:1 (medido sobre píxeles reales).
4. **Animación solo por fotogramas** (`useCurrentFrame`/`interpolate`/`Easing`, con `useAbsFrame` de `src/lib/scene.ts` si la pieza trabaja en fotogramas absolutos). **Prohibido** CSS `transition`/`animation`/`@keyframes`. Todo reproducible y determinista (PRNG sembrado `src/lib/rng.ts`; nada de `Math.random`/`Date`). Preferir `scale`/`translate`/`rotate` como propiedades CSS. `premountFor={fps}` en medios/secuencias.
5. **Estructura editable (Remotion 4.0.533):** componentes `Interactive.withSchema({ wrapInSequence: true })` para piezas con timeline propio (ver stubs: conservar nombre del export y la firma `style`); subcomponentes en la carpeta de cada pieza; fuentes por `import "../lib/fonts.ts"`.
6. **Sin personas reales ni fotos**: todas las personas son ilustraciones propias dibujadas por código. Sin nombres de personas (el único nombre de pantalla es «Amiga»).
7. **El sentido completo se entiende sin sonido.**
8. Verificá siempre: `npx tsc --noEmit` (errores de archivos ajenos: ignorarlos) y render de fotogramas con `scripts/shots.sh <Composición> <carpeta> <frames>` (carpeta en tu scratch, no en `entrega/`); mirá los PNG con Read **a tamaño real y ampliados**. Iterá (render → mirar con ojo crítico → corregir) hasta que el dibujo se vea de ilustración editorial profesional, no de wireframe.

## Estilo de ilustración — LA REFERENCIA (imagen del cliente, descrita)
Lámina vertical 4:5, **fondo hueso muy claro (#F7F5F0) y muchísimo aire** (≈ 80 % vacío). Sobre él:
- **Personas diminutas** (≈ 10–14 % del alto del cuadro), dibujadas con un **trazo negro fino de lápiz/marcador con temblor manual**: cabezas como círculos u óvalos pequeños, cuerpos de contorno simple (abrigo/vestido como una forma alargada, piernas como dos líneas), sin rostro detallado. Algunas con **relleno de garabato negro sólido** (pantalón, saco, pelo oscuro) con borde irregular.
- **Poses naturales y cotidianas**: caminando (de frente y de perfil), una madre llevando de la mano a un niño, una **persona en silla de ruedas** (ruedas con rayos finos), una persona sentada con otra parada a su lado apoyando la mano en su espalda, una persona con rodete/pelo rizado, otra con pelo largo. La diversidad es natural, no un catálogo.
- **Grandes curvas barridas** (arcos de crayón / pastel) en **un solo color saturado** (en la referencia azul; **en ADIP: naranja #FE801C**), con **textura granulada en los bordes** y grosor irregular (≈ 1,3 % del ancho del cuadro, ~14 px en 1080), que entran por los bordes, se cruzan y rodean a las personas: **empiezan o terminan junto a cada figura sin tocarla**, conectándolas. Se leen como «líneas de conexión / caminos».
- Una palabra manuscrita al centro («everyone»): en nuestro video **todo texto es Montserrat**.
Traducción a ADIP: lenguaje de la referencia (aire, figuras mínimas, trazo manual, curvas de crayón que conectan) + **paleta y logo de ADIP**: tinta negra para las personas; **naranja como hilo conductor**; acentos puntuales con la paleta oficial (violeta, rosa, verde, amarillo) en garabatos de relleno de ropa/pelo o en alguna curva secundaria, con moderación; fondo crema #FFF6E7 con un grano de papel apenas perceptible. Tono: cálido, adulto, respetuoso, profesional, moderno (nada infantil ni caricaturesco).

## Mundo y cámara (continuidad)
Un único **mundo ilustrado** con **cámara continua** (`src/world/cameraContext.ts`: `scale`, `cx`, `cy`; pantalla = (mundo − c)·scale + (540, 960)). El chat vive DENTRO del mundo: es la pantalla del celular que sostiene la persona protagonista (UI nativa 1080×1920 escalada por `PHONE_SCALE` ≈ 0,26 y colocada en sus manos).
Movimientos de cámara (`CAMERA_TIMING`): **S1** acercamiento rápido y suave desde «persona con celular» (scale 1,22, centro (600, 855)) hasta que la pantalla del celular llena el encuadre (≈ 1/PHONE_SCALE ≈ 3,8×, llegada ≈ f96); **S2** primer plano del chat fijo; **S3** la cámara se aleja desde el chat hasta el encuadre persona + celular; **S4** se amplía de 0,85× a 0,575× (WIDE_VIEW) y hace un empuje sutil a 0,625× (HOLD_VIEW) cuando la amiga se sienta y ofrece la mano, y aparecen los demás; **S5** encuadre final (≈ 0,30×: personas de 220–280 px de alto, aire alrededor). Easing suave, sin rebotes; el zoom puede tener una leve curva de trayectoria. La cámara está estática cuando el texto necesita estabilidad (S2, S6).
El celular está sobredimensionado a propósito (≈ 2,7 cabezas de alto): convención de cuadro para que el chat sea legible en la escena 1 y el zoom a la escena 2 sea continuo; en las escenas 4–6 se achica en el regazo. Escala de mundo orientativa (a scale 1 = unidades de mundo; el encuadre de la escena 1 es scale 1,22): adulto de pie ≈ 1000–1100 u, persona sentada ≈ 800 u, niño ≈ 650 u; trazo de las personas ≈ 1,4–1,8 % de su altura (≈ 14 u).

## Capas de pantalla
1. `World` (mundo + cámara + papel + personas + celular/chat + curvas naranjas).
2. `Overlays` (textos Montserrat y logo, **en coordenadas de pantalla, estables**; animan solo entrada/salida/énfasis). Texto siempre en la franja superior (`TEXT_ZONES`) salvo logo y fecha (abajo, `FINAL`). Nada de lo ilustrado cruza texto ni logo (≥ `FINAL.clearance` px).
3. Audio (stems 38 s alineados).

## Secuencia (fotogramas absolutos, ver timeline.ts)
- **S1 (0–90)**: persona ilustrada sosteniendo el celular (pantalla con el chat: «Amiga», mensaje recibido «¿Cómo estás?», campo vacío con cursor naranja); acercamiento rápido y suave; texto HOOK arriba (legible desde el f0, sale al llegar el chat).
- **S2 (90–420)**: primer plano del chat reconocible. Cabecera «Amiga»; burbuja RECIBIDA «¿Cómo estás?» (alineada a la izquierda, blanca); campo de escritura claramente delimitado con ícono de enviar (flecha) y cursor naranja; teclado de celular completo (QWERTY español con ñ; fila inferior ?123 , 😊 espacio . ↵); **tecla de borrar** reconocible (⌫). Tipeo/borrado según `MESSAGE_TIMINGS`/`visibleChars` (typing.ts): cada letra que aparece **activa sutilmente su tecla** (resaltado breve); el borrado quita desde el final con la **tecla ⌫ resaltada/mantenida** y un pulso visible por carácter; los mensajes viven DENTRO del campo (nunca en una burbuja enviada); el botón de enviar se «arma» cuando hay texto pero **nunca se presiona**. M1 y M2: se sostienen ~1 s y se borran; M3 queda, el cursor titila (pausa sonora y visual).
- **S3 (420–600)**: el cursor naranja se estira y se vuelve un trazo que sale del encuadre del chat (`THREAD_TIMING.bornFrom`); la cámara se aleja hasta el encuadre persona + celular; el trazo sigue DENTRO del mundo dibujado (se dibuja alrededor de la persona). Frase «Podés empezar por ahí.» / «Por no saber cómo empezar.» en dos momentos. Es una metáfora del acompañamiento (no una respuesta recibida al mensaje nunca enviado: el chat NO responde).
- **S4 (600–750)**: la composición se amplía; aparecen otras personas (se dibujan) conectadas por las curvas; una figura se acerca, se sienta al lado de la protagonista y ofrece la mano (gestos sutiles; la protagonista no pasa de la tristeza a la alegría: levanta la mirada, se afloja). Texto «No tenés que pasar por esto en soledad.»
- **S5 (750–930)**: las curvas siguen recorriendo la composición y conectan al grupo con el **logo oficial** (aparece con claridad y aire; la línea lo acompaña sin atravesarlo ni modificarlo). Texto/locución de la firma por unidades (`SIGNATURE_TIMING`).
- **S6 (930–1140)**: composición final: personas conectadas, logo, «Si hoy te cuesta decirlo, / podés compartir este video.», debajo «10 de octubre / Día Mundial de la Salud Mental». Todo visible y estable ≥ 3 s; el último fotograma completo y bien compuesto.

## Hilo naranja
Una sola curva continua de crayón naranja (con textura granulada y grosor irregular, nunca «tubo rígido»), dibujada progresivamente (`progress`), que nace del cursor del chat y recorre el mundo hasta el logo. Grosor de pantalla ≈ 12–16 px (compensar la cámara). Nunca cruza texto, logo ni personas (queda cerca, sin tocar). El traspaso cursor→trazo debe ser exacto (misma posición/tamaño, sin saltos).

## Audio (stems de 38 s, 48 kHz, 16-bit, estéreo, alineados al f0; ver `docs/AUDIO.md`)
`ambiente.wav`, `teclado.wav` (una pulsación por `KEY_EVENTS`, en el fotograma exacto; distinguir letras/espacio/puntuación/borrar), `musica.wav` (cálida, original, entra tras la pausa del último mensaje), `sfx-hilo.wav` (hitos `SFX_CUES`). Locución: sin grabación ni voz autorizada → `VOICEOVER.enabled=false`, texto listo para grabar.

## Propiedad de archivos
| Pieza | Archivos |
|---|---|
| Ilustración (kit + protagonista) | `src/illustration/*` (excepto `characters/cast-*`), `Gallery.tsx` |
| Reparto (otras personas) | `src/illustration/characters/cast-*` |
| Chat de celular | `src/chat/*` |
| Textos, logo y portada | `src/world/Overlays.tsx`, `src/world/overlays/*`, `src/world/Logo.tsx`, `src/Cover.tsx`, `src/cover/*` |
| Mundo, cámara, hilo, escenas | `src/world/World.tsx`, `src/world/camera.ts`, `src/world/*` (resto), `src/world/thread/*` |
| Audio | `scripts/build-audio.ts`, `scripts/verify-audio.ts`, `public/audio/*.wav`, `docs/AUDIO.md` |
Integración (`Reel.tsx`, `Root.tsx`, `timeline.ts`, `layout.ts`) la coordina la persona coordinadora.

## Definición de terminado (por pieza)
`npx tsc --noEmit` limpio (en tus archivos) · `node scripts/check-script.mjs` OK · fotogramas representativos y consecutivos de las transiciones revisados a tamaño real · sin CSS animation · textos Montserrat con contraste ≥ 4,5:1 y dentro de zona segura · determinismo (el mismo fotograma renderiza igual).
