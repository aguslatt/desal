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
A **levanta la mirada**, **baja el celular al regazo** y se afloja (hombros caídos, sin alegría); la pareja queda estática desde ≈ f1230 y esa pose
dura ≈ 12 s. Los dos quedan **a la misma altura de ojos**. Nada se sustituye de golpe y ningún hueso cambia de largo.

### Ensamblado de la protagonista (f1100–1150, `drawFrames` 50)
Es lo primero que se ve de la escena de escucha, así que en CADA fotograma tiene que leerse una persona sentada que se va completando y **todo trazo nace
anclado a algo ya dibujado** (nunca una rayita en el aire, nunca un bloque negro que «brota»; todo sin opacidad). Orden: el banco (tablón → patas que cuelgan
de un borde ya trazado → sombra); la **silueta sentada** (el torso sube desde el asiento con sus dos contornos naciendo sobre el tablón y el color pisándoles
los talones; apenas el violeta pasó la altura de la cadera, el muslo se desliza hacia adelante *dentro* del torso ya pintado y baja por la pierna); el cuello
y la cabeza enseguida; el zapato crece desde el tobillo; y **después los detalles** (pelo, brazos, manos, celular, que sube desde la mano). Ventanas (progreso
0..1 = `(f − 1100) / 50`; `WIN` en `figure.tsx`, el banco y la sombra en `props.tsx`):

| parte | progreso | fotogramas |
|---|---|---|
| tablón del banco | 0 – 0,14 | 1100 – 1107 |
| patas del banco: par de la derecha · par de la izquierda | 0,072 – 0,16 · 0,118 – 0,21 | 1103,6 – 1108 · 1105,9 – 1110,5 |
| sombra del suelo (se abre desde el centro, con las patas ya en el suelo) | 0,19 – 0,35 | 1109,5 – 1117,5 |
| dobladillo (base del torso) | 0,08 – 0,13 | 1104 – 1106,5 |
| torso (el color lo sigue con +0,015 de progreso: ≈ 0,75 f de retraso) | 0,08 – 0,17 | 1104 – 1108,5 |
| pierna (arco de la cadera → muslo → pantorrilla; el contorno de abajo arranca cuando el arco ya llegó al tablón; el papel sigue a las líneas) | 0,125 – 0,27 | 1106,25 – 1113,5 |
| cuello | 0,18 – 0,22 | 1109 – 1111 |
| cabeza (el trazo nace en la punta del cuello) | 0,215 – 0,315 | 1110,75 – 1115,75 |
| zapato (cuña negra que nace donde terminan las líneas de la pierna y se abre hacia la suela y la punta; sin «semilla») | 0,26 – 0,36 | 1113 – 1118 |
| pelo | 0,33 – 0,47 | 1116,5 – 1123,5 |
| brazo lejano · brazo cercano | 0,41 – 0,62 · 0,44 – 0,66 | 1120,5 – 1131 · 1122 – 1133 |
| manos (lejana · cercana; arrancan con el brazo ya casi completo) | 0,62 – 0,78 · 0,66 – 0,84 | 1131 – 1139 · 1133 – 1142 |
| celular (`PHONE_WIN`: **sube desde la mano**; su pie queda tapado por los dedos) | 0,81 – 1 | 1140,5 – 1150 (se ve ≈ 1143 – 1148) |

Medido sobre los fotogramas renderizados (misma escena, antes → ahora; medición privada, no versionada: componentes de tinta/color que no tocan lo ya dibujado y
masas negras nuevas por fotograma):

| | antes | ahora |
|---|---|---|
| primer violeta del torso · torso ≥ 50 % · completo | f1107 · f1112 · f1116 | f1105 · f1107 · f1109 |
| primer trazo del cuello · primer trazo de la cabeza | f1116 · f1117 | f1110 · f1111 |
| **torso reconocible (≥ 50 % de violeta) sin cabeza** | 6 f (f1112–1117); ≈ 11 f desde el primer violeta | **4 f (f1107–1110)**; 6 f desde el primer violeta |
| trazos en el aire (hueco > 3 px respecto de lo ya dibujado) | f1104–1106 patas del banco; f1107–1108 rayitas del muslo a 15–20 px del torso | ninguno; solo en f1108–1109 una rayita a 6 px (el contorno de abajo del muslo, que sigue al arco de la cadera dentro del tablón) |
| negro nuevo «gordo» en un fotograma (zapato) | f1118: bloque de ≈ 30 × 40 px (≈ 1200 px) de golpe | ≤ 390 px por fotograma, cuña que crece en f1114–1118 |
| pierna ya completa con la punta abierta y sin zapato | f1114–1117 (4 f) | ninguno: el zapato nace en f1114, cuando las líneas llegan al tobillo (en f1112–1113 la punta abierta es la que se está dibujando) |

La pose final, la entrada de B (f1104–1154), el gesto (f1172+), el pelo, los brazos, las manos y el celular al terminar (f ≥ 1150) y la portada
(`<Listening frame={1000000} />`) **no cambian**: se comprobaron píxel a píxel (0 píxeles distintos en f1150–1160, 1172, 1200, 1240, 1300, 1400, 1589 y en la portada).
B se dibuja en el primer cuarto (`pB = 4 × progreso`, completa en f1112,5), ya fuera de cuadro a la derecha: no se ve ninguna de sus ventanas.

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
| `scale` | `1` | escala uniforme = «cámara». **A `scale 1` la pareja sentada mide ≈ 440 px de alto y ≈ 820 px de ancho** (x 126–946, banda y 1123–1562). El trazo escala con ella (≈ 1 % de la altura: 4,4 px a `scale 1`). Nunca cambia proporciones |
| `drawProgress` | por frame | 0..1 dibujo progresivo de entrada del banco y de A (B se dibuja antes, ya fuera de cuadro). Si se omite: `drawFrom` (1100) → +`drawFrames` (50 f; ver la tabla de ensamblado) |
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
| `A_HIP_X` / `B_AXLE_FINAL` | −238 / +244 | posiciones (escena) de la cadera de A y del eje de la rueda de B al detenerse. Separan las bases de las dos figuras: **banco ↔ apoyapiés ≈ 100 px de pantalla** (a 360×640 ≈ 33 px; con −218 / 224 eran 47 px y parecían en contacto) y zapato de A ↔ apoyapiés ≈ 137 px |
| `DEFAULT_ENTER_DX` | 640 | recorrido de entrada de la silla |
| `PHONE` | `{ len: 46, wid: 20 }` | celular real (≈ 18 × 8 cm): **1/7,3 de la altura sentada** de A (335,5 u), constante en todo el video |
| `LISTENING_TIMING` | `drawFrom, friendEnterFrom, friendArriveAt, gestureAt` (de `COMPANION_TIMING`) + `drawFrames` 50, `gestureFrames` 34 | |

Ancho de la pareja a `scale 1` ≈ 820 px (extremos en x 126–946, dentro de 120–960); entra por la derecha fuera de cuadro si `x = 540` y `scale ≥ 0,75`.
En el reel la colocación es fija: `PAIR_PLACE` (`src/story/geometry.ts`) = `{ x: 540, y: 1560, scale: 1 }` en S4, S5 y S6 (en S6 sube con todo el conjunto: cámara vertical).
El hilo naranja del reel (y de la portada) es `THREAD_POINTS` en `src/story/geometry.ts`: pasa por el pasillo entre el logo y la cabeza de B (≈ 42 px de aire a cada lado: el pasillo mide 100 px
y no da para más), cae hacia el hueco y **termina en el aire entre las dos personas** (x ≈ 555, a ≈ 187 px del celular de A y ≈ 59 px de la mano abierta de B) con la punta casi vertical:
no apunta al celular ni a ningún objeto de A (el cliente pidió retirar «la línea que sale del teléfono»). Si se mueve la pareja, hay que volver a medir esas holguras.

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
| `props.tsx` | `Bench` (dos pares de patas a la vista; cada par arranca cuando el borde del tablón del que cuelga ya está trazado), `WheelchairFrame` + `WheelchairWheel` (disco de papel opaco, 12 rayos finos + válvula que hace evidente el giro), `Phone` (marco negro, pantalla clara, burbuja naranja; se revela de la mano hacia arriba), `Shadow` |
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
- **Dibujo progresivo (sin opacidad)**: el orden está en `WIN` (figure.tsx; tabla de ensamblado arriba): banco (tablón y patas) → torso (sube desde el asiento) y, ya sobre el
  violeta, muslo y pierna (silueta sentada) → cuello y cabeza → zapato → pelo → brazos → manos → celular (`PHONE_WIN`: sube desde la mano que lo sostiene, con el mismo barrido en el
  marco, la pantalla, las burbujas y el contorno). El relleno de cada parte (papel opaco, color de la prenda, negro del pelo y del zapato) la ACOMPAÑA recortado por un barrido
  (`limbReveal`, `sweepPoly`): avanza con la línea y nunca la pasa (el papel del muslo arranca con el 10 % del trazo, para que no haya un disco blanco sin contorno sobre el
  violeta), así no hay transparencias fantasma ni parches pálidos. El zapato crece desde el tobillo en diagonal (`SHOE_SWEEP`) y parte de cero. La sombra del suelo se abre desde
  el centro, después de las patas del banco (no hay sombra sin objeto). Todo trazo arranca sobre algo ya dibujado: los contornos del torso, sobre el tablón; el arco de la cadera,
  dentro del violeta; el cuello, en el cuello de la prenda; el círculo de la cabeza, en la punta del cuello; las patas del banco, en el borde del tablón que ya existe.
- **Oclusión de la silla**: la rueda trasera lleva un disco de papel opaco que tapa la cadera, el asiento y el respaldo que quedan detrás (la camisa verde
  termina en el borde superior de la rueda); la mano apoya sobre el aro.
- **Celular**: al sujetarlo (pecho) las manos abrazan su mitad inferior; al bajarlo al regazo (`PHONE_LAP`: centro (114, −171), −20°) queda casi vertical,
  apoyado en la palma sobre el muslo y con los dedos recogidos por debajo (`GRIP` → `REST` en motion.ts, manos con `open` ≈ −0,55): el antebrazo y el puño
  del buzo quedan a la vista y la silueta se reconoce como celular (≈ 14 × 21 px a 360×640). Antes estaba a −74°, tendido sobre la muñeca, y se leía como una
  pulsera o un clip. Tamaño real constante en todo el video (`PHONE`).
- **Rendimiento**: ≈ 100 `<path>` por fotograma; < 0,1 s por fotograma en el render.

### Pruebas privadas (no se versionan)
`dev/` está en `.gitignore`: ahí quien dibujó dejó pruebas privadas (composiciones de contacto, mediciones de huesos y de holguras). **No vienen en el repo ni hacen
falta** para renderizar. Para revisar el dibujo alcanza con `scripts/shots.sh Reel <carpeta> <fotogramas absolutos>` (p. ej. `1100,1104,…,1150` para el ensamblado
y `1240,1300,1589` para la pose final) y mirar los PNG a tamaño real; la portada se renderiza con `npx remotion still src/index.ts Cover <png>`.
