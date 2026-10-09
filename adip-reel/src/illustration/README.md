# Kit de ilustración liviano — «El mensaje que borraste» (Equipo ADIP, v3)

Reemplaza al kit pesado de la v2 (trazo grueso, ropa rayada, hachurado, texturas). Lenguaje de la referencia del cliente: **personas
de trazo negro fino de marcador**, caras en blanco, **una prenda con relleno plano** de la paleta por persona (violeta la de A, verde la de B;
los pantalones van solo con contorno), pelo y zapatos en negro, mucho aire y **grandes curvas de crayón naranja** abiertas que conectan. Todo se calcula con el fotograma (determinista, sin filtros SVG,
sin CSS animation, sin `Math.random`/`Date`). Se importa desde el barrel `src/illustration/index.ts`.

```tsx
import { Listening, ListeningScene, OpenCurve, settledAnchors, connectionPoints, extendCurve } from "../illustration";
```

## La pieza: `<Listening />` — escena de escucha entre dos personas

Situación: **A** (protagonista) sentada en un banco simple, algo encorvada, con el celular (tamaño real) en las manos, mirando a la
derecha. Su dibujo empieza en `drawFrom` (1100) y dura `drawFrames` (50 f). **B** (amiga, en silla de ruedas, ruedas con rayos finos)
**entra rodando desde la derecha** (`friendEnterFrom` 1104 → `friendArriveAt` 1154), frena con las manos en el aro, se detiene frente a A,
**gira el torso y la cabeza hacia ella y le ofrece la mano abierta** (`gestureAt` 1172; queda sostenida con respiración suave hasta el final).
A **levanta la mirada**, **baja el celular al regazo** y se afloja (hombros caídos, sin alegría); la pareja queda estática desde ≈ f1210.
Los dos quedan **a la misma altura de ojos**. Nada se sustituye de golpe y ningún hueso cambia de largo.

```tsx
<AbsoluteFill style={{ backgroundColor: ROLE.paper }}>
  <Listening frame={frame /* ABSOLUTO del reel */} x={540} y={1560} scale={1} drawProgress={p /* opcional */} />
</AbsoluteFill>
```

| prop | por defecto | descripción |
|---|---|---|
| `frame` | — | fotograma **absoluto** del reel (usa `COMPANION_TIMING` de `timeline.ts`) |
| `x` | `540` | x de pantalla del centro de la pareja (origen de la escena) |
| `y` | `FLOOR_Y` = `1560` | y de pantalla del **suelo** |
| `scale` | `1` | escala uniforme = «cámara». **A `scale 1` la pareja sentada mide ≈ 440 px de alto y ≈ 770 px de ancho** (x 152–921, banda y 1120–1560). El trazo escala con ella (≈ 1 % de la altura: 4,4 px a `scale 1`). Nunca cambia proporciones |
| `drawProgress` | por frame | 0..1 dibujo progresivo de entrada del banco y de A (B se dibuja antes, ya fuera de cuadro). Si se omite: `drawFrom` (1100) → +`drawFrames` (50 f) |
| `enterFromDx` | `640` | px de escena que recorre la silla desde fuera de cuadro. **Constante: no depende de la cámara**, así `x`/`scale` pueden animarse. Para colocaciones extremas usá `autoEnterDx(place)` una sola vez y pasá el valor fijo |
| `paper` | `ROLE.paper` | color del papel (la piel y las caras quedan en blanco = papel; tapa lo que queda detrás) |
| `topA`, `topB` | violeta `#8A00B7`, verde `#94C920` | prenda plana de cada persona (paleta oficial; verde = guiño a la figura en silla del logo) |
| `style` | — | se reenvía al `<svg>` raíz (1080×1920, `overflow: visible`) |

Antes de `drawFrom` no dibuja nada. Con `x`/`y`/`scale` se mueve la cámara de forma **uniforme y continua** (podés animarlos entre S4 y S5).

`ListeningScene` es lo mismo como **pieza con timeline propio** (`Interactive.withSchema({ wrapInSequence: true })`): el fotograma de la escena
es `useCurrentFrame() + sceneFrom` (`sceneFrom` = el `from` absoluto de la secuencia):
`<ListeningScene from={1100} sceneFrom={1100} durationInFrames={490} x={540} y={1560} scale={1} />`.

### Anclas en coordenadas de pantalla

```ts
const a = listeningAnchors(frame, { x, y, scale });   // en cualquier fotograma (B se mueve)
const s = settledAnchors({ x, y, scale });            // escena asentada (B quieta con la mano ofrecida): para curvas estáticas
```
`ListeningAnchors`: `headA`, `headB` (centros de las cabezas), `handB` (punta de los dedos de la mano ofrecida), `wristB`, `phone`
(centro del celular), `hipA`, `hipB`, `axleB`, `curveBirth` (donde conviene que nazca la curva: sobre la mano de B, con aire), `gap`
(punto entre las dos cabezas), `box` (caja de la pareja ya asentada → pasala a `avoid`), `floorY`, `scale` (= `scale × SCENE_K`: factor
escena→pantalla), `toScreen(p)` (punto de escena → pantalla).

### Constantes (px)

| constante | valor | |
|---|---|---|
| `FIGURE_HEIGHT` | 440 | alto de la pareja sentada a `scale 1` |
| `FLOOR_Y` | 1560 | suelo |
| `BAND` | `{ y0: 1120, y1: 1560 }` | banda que ocupa a `scale 1` |
| `INK_SCREEN` | 4,4 | grosor de tinta a `scale 1` |
| `SCENE_K` | 1,25 | las figuras se dibujan en «unidades de escena» (adulto de pie = 440 u) y se amplían 1,25 |
| `A_HIP_X` / `B_AXLE_FINAL` | −218 / +224 | posiciones (escena) de la cadera de A y del eje de la rueda de B al detenerse: la punta del zapato de A queda a ≈ 85 px del apoyapiés de B y las patas de adelante del banco a ≈ 65 px |
| `DEFAULT_ENTER_DX` | 640 | recorrido de entrada de la silla |
| `PHONE` | `{ len: 46, wid: 20 }` | celular real (≈ 18 × 8 cm): **1/7,3 de la altura sentada** de A (335,5 u), constante en todo el video |
| `LISTENING_TIMING` | `drawFrom, friendEnterFrom, friendArriveAt, gestureAt` (de `COMPANION_TIMING`) + `drawFrames` 44, `gestureFrames` 34 | |

Ancho de la pareja a `scale 1` ≈ 770 px (extremos dentro de x 120–960); entra por la derecha fuera de cuadro si `x = 540` y `scale ≥ 0,75`.
En el reel la colocación es fija: `PAIR_PLACE` (`src/story/geometry.ts`) = `{ x: 540, y: 1560, scale: 1 }` en S4, S5 y S6 (en S6 sube con todo el conjunto: cámara vertical).

## `OpenCurve` — la curva de crayón

```tsx
<svg width={1080} height={1920} style={{ position: "absolute", overflow: "visible" }}>
  <OpenCurve points={pts} progress={p} width={14} />                         {/* hilo principal: naranja, 14 px */}
  <OpenCurve points={sec} progress={q} width={5} color={COLORS.purple} seed={3} />   {/* secundaria fina */}
</svg>
```
(o `<OpenCurveSvg … />`, que trae su `<svg>` de 1080×1920).

Props: `points` (puntos de control: la curva pasa por ellos con Catmull-Rom centrípeta, sin lazos), `progress` 0..1 (la punta redonda avanza),
`from` 0..1 (desde dónde se ve: «borra» la cola), `width` (px del contenedor; 14 por defecto; 4–6 para secundarias), `color`
(paleta; naranja `ROLE.thread` por defecto), `paper` (color que asoma por el grano; `ROLE.paper`), `seed`, `grain` 0..1, `opacity`.
Grosor irregular (±15 %), extremos redondeados, borde granulado y motas del diente del papel con un puñado de `<path>` (≈ 4), anclado
a la longitud de arco (el grano no «nada» al dibujarse). Si la ponés dentro del grupo escalado de la escena, el grosor escala con él;
poniéndola en pantalla el grosor es exactamente `width` px.

```ts
const g = makeOpenCurve(points);   // geometría memoizada
g.length                           // longitud (px)
g.pointAt(0.4)                     // { x, y, tx, ty, angle(°), length }  ← punta cuando progress = 0,4 (anclar cosas a la punta)
g.at(300)                          // lo mismo por longitud absoluta
```

## Ayudantes de la curva de conexión (puros, en pantalla) — `connect.ts`

```ts
const place = { x: 540, y: 1560, scale: 1 };
const a = settledAnchors(place);
const base = connectionPoints(a);                         // nace sobre la mano de B, sube por el hueco entre las cabezas
const base2 = connectionPoints(a, { shape: "sweep" });    // gran curva barrida: rodea por arriba a A y sale por la izquierda
const toLogo = extendCurve(base, [x, y] /* destino */, {
  avoid: [logoBox, textBox, a.box],   // cajas prohibidas { x0, y0, x1, y1 }
  clearance: 40,                      // aire entre el BORDE del trazo y cada caja
  halfWidth: 7,                       // mitad del grosor (14 px)
  arrive: [0, -1],                    // dirección con que llega al destino (opcional)
});
curveClearance(toLogo, [logoBox, textBox], 7);   // holgura medida (≥ 40 si cumplió)
<OpenCurve points={toLogo} progress={p} />
```
- `connectionPoints(anchors, { shape: "rise" | "sweep", endY, drift })`: recorrido **abierto**, nunca un lazo (curva C¹ por Hermite).
  `rise` (por defecto) = S suave que termina por encima de las cabezas (`endY` = y de pantalla donde termina; `0` sale del cuadro por arriba).
  Se dibuja de la mano de B hacia arriba; **invertí el arreglo** (`[...pts].reverse()`) si querés que nazca del otro extremo (p. ej. del borde del naranja que se retira) y termine junto a B.
- `extendCurve(base, target, opts)`: continúa la curva hasta `target` esquivando cajas con `clearance + halfWidth`. Si la base ya entra en una caja,
  la corta con «pista» (≥ 140 px) y la rodea; los giros se redondean; empalma con la tangente de la base; verifica la holgura sobre la curva ya
  suavizada y ensancha el rodeo hasta cumplirla. Un destino a menos de `clearance` de una caja se corre hacia afuera.
- `hermite(keys)`, `inflate(box, m)`, `distToBox(p, box)`, `curveClearance(points, boxes, halfWidth)`.

## Cómo está hecho (para tocar el dibujo)

| archivo | contenido |
|---|---|
| `geom.ts` | vectores, IK de 2 huesos (`ik2`, tope al 99 % del alcance), Catmull-Rom, `Curve` (longitud de arco), paths SVG, `clipPoly`/`sweepPoly` (recorte de un relleno por un barrido: el color avanza con el trazo) |
| `ink.tsx` | trazo de tinta fino de ancho variable (`InkStroke`, `inkOutline`): presión, temblor, afinado al apoyar/levantar, `progress`; `Flat` (relleno plano, opcionalmente corrido); círculos a mano |
| `noise.ts` | ruido 1D determinista (temblor, presión, grosor del crayón) |
| `rig.ts` | rig de persona **sentada de perfil**: columna en 3 tramos + cuello + cabeza por cinemática directa; brazos y piernas por IK. `BODY` (huesos), `makePose`, `lerpPose`, `solveSeated` → `Skeleton` |
| `figure.tsx` | `Figure`: dibuja un `Skeleton` con `FigureStyle` (prenda, mangas, pantalón contorno/sólido, pelo largo/rizos, tinta). Manos que se abren (agarre → relajada → palma abierta). `WIN` = orden y ventanas de dibujo; `PHONE_WIN` = cuándo entra el celular |
| `dims.ts` | cotas puras de banco, silla (`WHEELCHAIR`), celular (`PHONE`), `rimPoint` (aro de empuje) |
| `props.tsx` | `Bench` (dos pares de patas a la vista), `WheelchairFrame` + `WheelchairWheel` (disco de papel opaco, 12 rayos finos + válvula que hace evidente el giro), `Phone` (marco negro, pantalla clara, burbuja naranja), `Shadow` |
| `motion.ts` | **coreografía** pura `sceneAt(frame)`: poses, giro de ruedas, celular. Ahí se ajustan tiempos y gestos |
| `Listening.tsx` | la escena, las anclas y `ListeningScene` (Interactive) |
| `curve.tsx` | `OpenCurve`, `makeOpenCurve`, `crayonRibbon` |
| `connect.ts` | ayudantes de la curva de conexión |

Convenciones: unidades de escena (px a escala 1, adulto de pie = 440 u), y hacia abajo, origen en el suelo, la figura mira a +x (B se espeja con
`scale(-1, 1)`). Ángulos de la columna «desde la vertical, + hacia adelante». Las semillas (`seed`) cambian la «mano» (temblor, presión).

### Detalles que importan
- **Ruedas**: giro = recorrido / radio (sin patinar; verificado); el ciclo de empuje (hombros y manos pegadas al aro) se deduce del giro de la rueda,
  así el torso hace un leve vaivén (adelante al empujar, atrás al recobrar) y se calma al frenar. Máx. 14,2° por fotograma (< 15° = sin efecto «rueda de carreta» con 12 rayos).
- **Continuidad**: A y B solo cambian de postura por interpolación de parámetros del rig (los huesos mantienen su largo: desvío máx. 6·10⁻¹⁴ px).
- **Color**: la prenda se imprime corrida 3 px respecto del contorno (registro de impresión). Una prenda con color por persona (camisa violeta de A,
  remera verde de B); pantalones solo con contorno; pelo y zapatos negros. Paleta: negro, violeta, verde (prendas), naranja (curva y burbuja del
  celular), gris (papel). Sin crema ni verde oscuro.
- **Dibujo progresivo (sin opacidad)**: el orden está en `WIN` (figure.tsx): banco (tablón y patas) → piernas y zapato → torso (del dobladillo al cuello) →
  cuello y cabeza → pelo → brazos → manos → celular (solo cuando la mano que lo sostiene ya está trazada, `PHONE_WIN`). El relleno de cada parte
  (papel opaco, color de la prenda, negro del pelo y del zapato) la ACOMPAÑA recortado por un barrido (`limbReveal`, `sweepPoly`): avanza con la línea y nunca la
  pasa, así no hay transparencias fantasma ni parches pálidos. La sombra del suelo se abre desde el centro.
- **Oclusión de la silla**: la rueda trasera lleva un disco de papel opaco que tapa la cadera, el asiento y el respaldo que quedan detrás (la camisa verde
  termina en el borde superior de la rueda); la mano apoya sobre el aro.
- **Celular**: al sujetarlo (pecho) las manos abrazan su mitad inferior; al bajarlo al regazo (`PHONE_LAP`) queda plano sobre el antebrazo, a lo largo del muslo,
  con la mano suelta más allá de su extremo (`GRIP` → `REST` en motion.ts).
- **Rendimiento**: ≈ 100 `<path>` por fotograma; < 0,1 s por fotograma en el render.

### Pruebas privadas (no se versionan)
`dev/illus/entry.tsx` (composiciones `Scene`, `Lamina*`, `Zoom*`, `LS`), `dev/illus/measure.ts` (huesos, ruedas, continuidad:
`node dev/illus/measure.ts`) y `dev/illus/pix.py` (alturas y ancho de línea sobre píxeles). Render:
`ENTRY=dev/illus/entry.tsx scripts/shots.sh Scene <carpeta> 1100,1140,1300`.
