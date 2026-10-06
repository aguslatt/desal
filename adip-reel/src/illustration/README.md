# Kit de ilustración — API (Equipo ADIP · «El mensaje que borraste»)

Todo se importa de `src/illustration/index.ts` (barrel). Ver la **Galería** (`Still` id `Personajes`) para el
resultado visual de cada pieza. Estilo: persona mínima de trazo negro fino con temblor, rellenos de garabato,
curvas de crayón naranja que conectan, papel crema con grano. Sin filtros SVG, sin CSS animation: todo se
calcula con el fotograma (determinista).

## Convenciones

- **Unidades de mundo (u)**: 1 u = 1 px de pantalla con la cámara en `scale = 1`. Pantalla = (mundo − (cx, cy))·scale + (540, 960)
  (ver `src/world/cameraContext.ts`; el kit lee `useCamera()` solo en `CrayonCurve`).
- **y hacia abajo.** Los componentes (`Person`, `Bench`, `Wheelchair`, `Protagonist`, `CrayonCurve`) son elementos
  **absolutos en coordenadas de mundo**: ponelos dentro del contenedor que aplica la cámara (div con
  `translate(540px,960px) scale(s) translate(-cx,-cy)`), cada uno es un `<svg>` 1×1 con `overflow: visible`
  (la `Protagonist` es un `<div>`). Las **primitivas** (`InkStroke`, `ScribbleFill`, `InkEllipse`, `Blob`) son
  fragmentos SVG: van dentro de un `<svg>`; usá `<InkSvg x y>` si necesitás un lienzo suelto en el mundo.
- Todo texto y tiempo sale de `src/config`. El kit lee `timeline.ts`/`typing.ts` solo en la protagonista, `cast-friend` y `cast-others`, y `brand.ts` para los colores.
- **Animar = pasar el fotograma**: `frame` absoluto del reel. Nada usa `Math.random`/`Date`.
- Las semillas (`seed`) cambian la «mano» (temblor, presión): usá una fija por elemento.
- **Naranja `#FE801C` = solo el hilo** (CrayonCurve y su origen en el cursor). No se usa en ropa ni pelo.

## Escala de referencia

| | altura | notas |
|---|---|---|
| adulto de pie | 1050 u (`kind: "adult"`) | grosor de tinta 1,25 % ≈ 13 u |
| mayor | 990 u | |
| niño | 650 u | cabeza más grande |
| sentado en el banco | ≈ 800 u | asiento a `SEAT_H` = 296 u del suelo |

A cámara `scale 0,3`: persona ≈ 315 px (de pie) / 240 px (sentada), trazo ≈ 4 px. A `scale 1`: el trazo se ve de 13 u.

## Trazo de tinta — `ink.tsx`

```tsx
<InkSvg x={0} y={0}>                       // lienzo SVG en el mundo (opcional)
  <InkStroke points={[[0,0],[120,-40],[260,10]]} width={14} progress={0.6} seed={3} color={COLORS.black} />
  <InkEllipse cx={0} cy={0} rx={50} ry={60} rotate={8} width={14} progress={1} seed={4} />   // círculo a mano (se pasa al cerrar)
</InkSvg>
```
`InkOptions`: `width` (u; ≈14), `progress` 0..1 (la punta avanza redonda y se afina al llegar a 1), `seed`, `smooth`
(true = curva por los puntos; false = esquinas), `taperStart/taperEnd` (u), `startWidth/endWidth` (0..1),
`pressure` (0.3), `wobble` (0.3), `tremor` (0.08), `step`. Funciones puras: `inkPath(points, opts)` → `d`,
`inkOutline(points, opts)` → polígono, `handEllipsePoints(cx, cy, rx, ry, opts)`.
Un trazo = UN `<path>` relleno (polígono de ancho variable): nunca es un tubo.

## Garabato — `scribble.tsx`

```tsx
<ScribbleFill polygon={[[0,0],[120,0],[120,200],[0,200]]} color={COLORS.black} weight={9} density={1} angle={62} progress={1} seed={2} />
<Blob polygon={pts} color={skinHex} seed={1} rough={2} grain={grainId} reveal={0.5} />   // mancha plana de borde irregular
```
`ScribbleFill`: `weight` (grosor del marcador), `density` (0.3 hachurado suelto … 1 sólido … 1.2 relleno),
`angle` (dirección del hachurado), `jitter` (borde irregular), `progress` (rellena en el orden del zigzag),
`grain` (id de un `<GrainDefs>`: grano de papel sobre el lavado liso), `lod` (false = sin nivel de detalle), `edge`.
`scribblePath(polygon, opts)` devuelve el `d` (stroke = color, strokeWidth = weight).

**Nivel de detalle del hachurado (anti-moiré).** Un hachurado fino (líneas de ≈ 5 u cada ≈ 8,5 u) a escala de cámara 0,3–0,45 son
líneas de 1,5 px con huecos de 1 px: batallan con la grilla de píxeles y centellean cuando la cámara se mueve (y el códec las
destroza). `ScribbleFill` (densidad < 0,9) calcula la separación de las líneas EN PANTALLA con la escala real
(`cámara × escala del dibujo`) y dibuja un «mipmap» de pasadas: nivel 0 = hachurado fino tal como se diseñó (escala ≥ ≈ 0,6);
nivel n = separación × 2ⁿ y línea × (1 + 0,5 n) más un **lavado liso del color con grano**, de modo que la cobertura (el color
medio) es la misma. Los dos niveles vecinos se funden por opacidad (continuo: las pasadas quedan fijas al mundo, solo cambian las
opacidades, nada «se desliza»). En cada nivel la separación en pantalla queda entre ≈ 4 y 8 px. Medido (pan de cámara a 0,3 con
compensación de movimiento): el residuo temporal relativo bajó de 0,65 a 0,22 en los vestidos y de 0,37 a 0,21 en la ropa de la
protagonista (0,18–0,20 = piso de una textura estable). Constantes: `PERIOD_TARGET` (5,2 px), `hatchLevel(scale, weight, density)`.
La escala del dibujo la provee `<ScaleBy k={…}>` (contexto `UnitScale`): `Person`, `Protagonist`, `Friend`, `Bench` y los grupos del
reparto (`GroupSvg`, `buildMember`) ya lo hacen; si armás un `<svg>` propio con una figura escalada, envolvé el contenido con `ScaleBy`.
`HATCH_LOD.enabled = false` apaga todo (solo para pruebas A/B privadas).

## CrayonCurve — el hilo naranja — `crayon.tsx`

```tsx
const d = "M 540 1500 C 700 1300, 900 1700, 1400 1200";
<CrayonCurve d={d} progress={p} width={14} seed={7} />          // naranja por defecto, grosor EN PANTALLA 14 px
<CrayonCurve points={[[0,0],[400,-200],[900,0]]} progress={1} color={COLORS.purple} width={9} />
<CrayonCurve d={d} from={0.3} progress={0.8} />                   // visible solo entre 0,3 y 0,8 (borra la cola)
```
Props: `d` | `points`, `progress` (0..1), `from`, `width` (px de pantalla, compensado con `useCamera()`),
`color`, `shade` (motas de pigmento), `seed`, `texture` 0..1, `camera` (anula el contexto), `startWidth`/`endWidth`,
`opacity`. Se dibuja SOLO lo visible (culling por cámara), así que funciona con curvas largas a cualquier zoom.
El grano queda fijo a la pantalla (diente del papel): no «nada» con el zoom.

**Anclar cosas a la punta / medir** (función pura, memoizada por definición):
```ts
const c = makeCurve({ d });          // o { points }
c.length                              // longitud en u de mundo
const t = c.tip(progress);            // { x, y, tx, ty, angle(°), length }  → punta del trazo (centro)
c.at(lengthInU)                       // lo mismo por longitud absoluta
c.curve.pointAt(s) / tangentAt(s)     // Curve de geom.ts
```
`CrayonStroke` es el mismo trazo como fragmento SVG (si ya tenés tu `<svg>`). `crayonPolys(data, opts)` devuelve los
contornos para quien quiera dibujarlos por su cuenta. La línea se desvía del eje ≤ ~0,2 × ancho (≈ 3 px): dejá ≥ 20 px de aire a personas/texto.

## Papel — `paper.tsx`

`<Paper grain={1} parallax={0.1} />` fondo crema `#FFF6E7` + grano apenas perceptible (patrón barato). Va DEBAJO del mundo,
fijo a la pantalla (con `parallax` > 0 se desliza un poco con `useCamera()`).

## Rig y poses — `rig.ts`

Una pose = `PoseParams` (cadera, inclinación, encorvado, giro, cabeza, objetivos de manos y pies). Las articulaciones
se resuelven con IK de 2 huesos (los huesos conservan su largo al interpolar). Unidades **RU** (rig units): adulto de pie
= 1000 RU; `Person` escala por `height/1000`. Origen = suelo bajo la figura; x hacia donde mira; `L`/`R` = lados de pantalla.

```ts
makePose({ hip:[0,-545], turn:1, handR:[150,-430], head:{tilt:-3, nod:0.2, look:0.5} })
standFront(), standSide(), walkSide(phase 0..1), walkFront(phase), seated({ seat, hipX, knee, turn, ...overrides })
// caminata: avanzá x += 520 · (height/1000) por cada ciclo de phase (0→1) para que el pie no patine; walkFront es de frente
lerpPose(a, b, t)   poseAt([{f:600,pose:a},{f:700,pose:b, ease?}], frame)   // keyframes con easing (por defecto in-out suave)
applyIdle(pose, frame, seed, amount)    // respiración y leve cambio de peso
blinkAt(frame, seed)                    // 0..1 parpadeo (5 f cada ≈ 3–4 s)
ik2(root, target, l1, l2, pole)  resolvePose(pose, bodyDims(kind, build)) → Joints
```
Campos: `hip`, `lean` (°, + hacia adelante), `curl` (−1..1 encorvado), `turn` (0 perfil … 1 frente), `shoulderTilt`,
`head: {tilt °, nod −1 arriba…+1 abajo, look −1…+1 hacia donde mira}`, `handL/handR` (objetivos IK de muñeca),
`footL/footR` (tobillos), `elbowL/…/kneeR` (anulan la IK: vistas escorzadas), `elbowOut`, `footAngleL/R`, `far`
(«L»/«R»: miembro que queda detrás en perfil), `breath`, `shoulderDrop` (RU que caen los dos hombros: hombros aflojados).
Con la mirada baja (`nod` > 0,3) los dos puntos del rostro se vuelven párpados: la emoción se cuenta con la postura.
Sentarse: interpolá `standFront()` → `seated(...)` (hip baja, rodillas por override). Para sentar en el banco con una
persona de altura H: `seated({ seat: (SEAT_H + 4) / (H/1000) - 8, ... })`.
**Mundo ↔ rig**: `rigToWorld(p, placement)`, `worldToRig(w, placement)` (placement = `{spec, x, y, scale, facing, anchor, pose}`) y
`jointWorld({...placement, pose}, "wristR")` para que una mano llegue a un punto del mundo (p. ej. a la espalda de la protagonista).

## Person y el renderizador de figuras — `person.tsx`, `figure.tsx`, `hand.tsx`

**Un solo renderizador** para todas las personas: `buildFigure` (`figure.tsx`). `Person` / `buildPerson` (la API pública del kit) delegan en él,
y lo usan también la protagonista, la amiga y el reparto (`cast-others/figure.tsx` es un atajo de re-exportación). Dibuja una figura
con proporciones naturales de perfil y ¾ (espalda y pecho distintos, cintura, cadera), y lleva el nivel de dibujo de una ilustración editorial:
· **mangas** con hombro redondeado (tapa semicircular + costura), deltoides, afinado hacia el codo, antebrazo apenas más lleno, puño, y dos arcos de
tela en el hueco del codo cuando el brazo se dobla; · **manos** con dedos (`hand.tsx`, `FriendHand`: 34 vértices que se mezclan de «relajada» a
«abierta, palma arriba»; pulgares hacia el cuerpo de frente y hacia adelante de perfil); · **cuello** con relleno de piel (ya no se ve el fondo a
través) y escote por encima; · hombros que se aflojan con `shoulderDrop`; · pliegues en la cintura al estar sentada; · rellenos con el nivel de detalle de arriba.

```tsx
const spec: PersonSpec = {            // (FigureSpec = PersonSpec + hair "cropped|waves", prendas "cardigan", accesorios "beanie|satchel", headScale, neckDrop, sleeves "skin|short")
  kind: "adult" | "child" | "elder", build: "slim" | "regular" | "broad", height?: u,
  skin: "porcelain|light|olive|tan|brown|deep|dark" | "#hex",
  hair: { style: "short|long|bob|bun|curly|ponytail|bald", color: "black|darkBrown|brown|auburn|grey|silver|blonde|violet" | "#hex" },
  top: { type: "top|jacket|coat|dress", color: "ink|violet|pink|green|yellow|grey|inkGreen"|"#hex", fill: "hatch|solid|outline", sleeves?: "line|filled" },
  legs: { type: "lines|trousers", color, fill: "solid|hatch" },
  shoes: "ink" | color | "none", face: "dots" | "none",
  accessories: [{ type: "backpack|bag|scarf|glasses|cane", color?, hand?: "L"|"R" }], ink?: 1, seed: 3,
};
<Person spec={spec} pose={walkSide((frame%36)/36)} x={..} y={..} scale={1} facing={1|-1} anchor="ground|hip"
        frame={frame} idle={1} drawProgress={0..1} seed={0} />
```
`x, y` = punto del suelo entre los pies (`anchor="ground"`) o la cadera (`"hip"`). `drawProgress` dibuja la figura en orden:
cabeza → cuello → contornos del torso → brazos → piernas → manos/zapatos → pelo y rellenos. Con `idle > 0` respira, se
balancea y parpadea (usa `frame`). Para armar capas a mano (`behind` / `body` / `hands`, p. ej. con un objeto entre el
cuerpo y las manos): `buildPerson(spec, pose, { progress, hideHands, blink, grainId, hands })` → `{behind, body, hands, joints}`
(fragmentos SVG en RU; envolvelos en `<g transform="scale(k) …">` con `k = personScale(spec)` y en `<ScaleBy k={k}>` para el nivel de detalle).
`hands: { L?: HandSpec, R?: HandSpec }` con `HandSpec = { open?: 0..1, angle?: grados, flip?: boolean }` fija la mano (por defecto relajada, siguiendo el
antebrazo). `<FriendHand wrist angle open len skin ink seed progress grainId flip />` dibuja una mano suelta (la protagonista la usa libre sobre el muslo).
Colores de ropa: acentos de la paleta con moderación (1–2 por persona); pantalón negro sólido y pelo negro = la referencia.

## Props — `props.tsx`

```tsx
<Bench x={bx} y={by} scale={1} drawProgress={1} color="grey" />       // (x,y) = suelo bajo el centro; largo 800 u
const seat = benchSeat({ x: bx, y: by }, BENCH_SLOTS.protagonist);    // → { x, y } de la CADERA sentada (slot −1 izq … +1 der)
BENCH_SLOTS = { protagonist: -1, friend: 0.92 }                       // la amiga se sienta a su derecha
<Wheelchair x y roll={deg} />  +  <Person pose={wheelchairPose(1.05)} x y facing />   // misma (x, y) y facing que la silla
<Cane x y height facing />                                             // suelto; con <Person accessories=[cane]> sale de la mano
```
`SEAT_H = 296`, `BENCH`, `WHEELCHAIR` (cotas: rueda 190 u de radio con 14 rayos finos; `roll` = giro en grados:
`roll = distancia / 190 · 180/π`).

## La protagonista — `characters/protagonist.tsx` (+ `protagonist-motion.ts`)

Sentada (3/4, mira hacia **+x**), sostiene el celular con las dos manos. **Ancla = la cadera, apoyada en el asiento.**
El movimiento y la geometría son funciones PURAS en `protagonist-motion.ts` (`protagonistRig(frame, controls, idle)` → controles, celular, pulgares y la pose final
con los brazos); `protagonist.tsx` solo dibuja y re-exporta la API de siempre. Así se pueden probar en node con una sonda privada (velocidad de cada articulación por fotograma).

```tsx
const seat = benchSeat({ x: bx, y: by }, BENCH_SLOTS.protagonist);
<Protagonist frame={absFrame} x={seat.x} y={seat.y} phone={<PhoneChat />} drawProgress={1} />
```
Props: `frame`, `x`, `y`, `scale` (dejalo en 1: PHONE_SCALE está calculado para 1), `phone` (ReactNode, el chat nativo
1080×1920; se dibuja ENTRE el cuerpo y los pulgares), `drawProgress`, `idle`, `controls` (parcial, ver abajo), `style`.
Capas: cuerpo → palmas → bisel negro del celular → pantalla → pulgares.

**Constantes (locales a la cadera, u, scale = 1)**: `PHONE_SCALE = 0.26`, `PHONE_NATIVE = {w:1080,h:1920}`,
`PHONE_SIZE = {w:280.8,h:499.2}`, `PHONE_CENTER = {x:44, y:-14}`, `PHONE_RECT = {x,y,w,h}` (pantalla en reposo),
`PROTAGONIST_HEAD_TOP = -494`, `PROTAGONIST_HEIGHT = 1100` (sentada ≈ 800 u), `S1_HIP_Y = 1192`.
Encuadre de la escena 1 (cámara scale 1, centro 540/960): cadera en (540 − 44, `S1_HIP_Y`) → cabeza desde y ≈ 698,
celular centrado en x = 540 (y ≈ 1178), banco con el suelo en `S1_HIP_Y + 300`.

**Chat ↔ mundo**:
```ts
phoneToWorld(nx, ny, { x, y, scale?, frame? })   // coordenada NATIVA del chat → mundo (cursor, esquinas, etc.)
phoneCenterWorld({ x, y })                        // centro de la pantalla en el mundo = objetivo de la cámara de la escena 1→2
phoneNativeToLocal(nx, ny, phoneState(controls))  // local a la cadera
```
Para que el chat llene el encuadre: `camera.scale = 1 / (PHONE_SCALE · scale)` ≈ 3,846, centrada en `phoneCenterWorld`.
Con `frame` en `phoneToWorld` se incluye la bajada/inclinación del celular de ese instante (la inclinación vale 0 entre
f96 y f436: **el chat está derecho mientras la cámara lo encuadra**).

**Animación** (todo en fotogramas absolutos; `defaultControls(frame)` la deriva de `timeline.ts`; cualquier campo se pisa con `controls`):
| control | default | qué hace |
|---|---|---|
| `sigh` | pulso a `THREAD_TIMING.bornFrom + 24` | suspiro al nacer el hilo (hombros) |
| `posture` | 548 → 604 | cambio de postura de fin de escena 3: se endereza, el pie se retrae |
| `attention` | `friendEnterFrom − 14` → `friendSitFrom` | levanta la mirada hacia +x (la amiga), gira la cabeza, los párpados vuelven a ser puntos |
| `relax` | `friendSitFrom` → `friendGestureAt + 24` | afloja los hombros (`shoulderDrop` + giro), sin pasar a la alegría |
| `phoneLower` | `friendEnterFrom + 8` → `friendGestureAt` | baja el celular **a un costado de la cadera** (más chico: `LOWER.scale` 0,6; la mano izquierda lo toma por la mitad) y deja libre todo el hueco del lado de la amiga; los brazos pasan a una curva relajada (codo escorzado) |
| `handFree` | `friendGestureAt − 24` → `+12` | la mano derecha suelta el celular (sale de detrás del bisel) y descansa sobre el muslo, con dedos |
| `reach` | `friendGestureAt + 34` → `+80` | la mano libre se adelanta apenas (≈ 16 u) hacia la mano ofrecida y se abre un poco: «un milímetro de duda», se percibe la escucha |
| `phoneScale` | 1 | tamaño del celular (si lo achicás, hacelo con el hilo ya fuera del chat) |
| `phoneTilt` | −4° → 0 (f 10–96), → −2,5° (f 436–532) | inclinación suelta (0° mientras el chat llena el encuadre) |
| `thumbsOpacity` | visible en S1, oculto con el chat lleno (f 46–102 ↓, vuelve en f 420–462) | pulgares |
`thumbsAt(frame)` → `{L,R}: {reach, press, wander}`: los pulgares **tocan con cada tecla de `KEY_EVENTS`** (izquierdo para
q-w-e-r-t-a-s-d-f-g-z-x-c-v-b, derecho para el resto, espacio y ⌫), **dudan** (se acercan y se retiran despacio) en las pausas
y se van al borde después del último mensaje. `blinkAt(frame, 41)` parpadea la cara; respira con `idle`.
`protagonistPose(controls, frame, wrists)` devuelve la `PoseParams` por si querés interpolar a mano.

## La amiga — `characters/cast-friend.tsx` (+ `cast-friend/motion.ts`, `gait.ts`)

```tsx
const seat = benchSeat(BENCH_AT, BENCH_SLOTS.friend);               // FRIEND_SEAT de src/world/stage.ts
<Friend frame={absFrame} x={seat.x} y={seat.y} />                    // ancla = cadera sentada; mira hacia −x (espejada)
friendAnchors(frame, { x, y })  // cabeza, pecho, muñeca y punta de la mano ofrecida, caderas, suelo y caja (para que el hilo pase cerca sin tocar)
```
`friendMotion(frame)` es una función pura (pose + manos + anclas). **Coreografía** (`friendTimes()` deriva de `COMPANION_TIMING`; fotogramas absolutos):
camina de perfil desde la derecha con pasos reales (los pies apoyados quedan QUIETOS; `gait.ts` planifica cada apoyo y deduce la cadera de los pies),
frena con un paso de cierre, gira a ¾ (`PIVOT_TURN` 0,86), **se sienta** (descenso suave `sitFrom = friendSitFrom − 26` → contacto en `friendSitFrom`, inclinándose hacia
adelante y con los brazos que acompañan en vez de empujar el tablón), **se gira hacia la protagonista** (`SWIVEL_TURN` 0,5: torso y cabeza; los pies se reacomodan con un
pequeño paso, `swivelFrom = friendSitFrom − 2`) y **ofrece la mano** en `friendGestureAt` durante 56 f (`offerProgress`: se adelanta, DUDA un instante y recién entonces abre la
mano, palma arriba). La mano queda RELATIVA AL HOMBRO (`OFFER_REACH` = 80 u adelante, 86 abajo en RU): el brazo recogido con el antebrazo que sube, tendida a media distancia
(≈ 70–90 u de la protagonista a cámara 0,6: disponible, sin invadir ni tocar). `offerTarget` (muñeca en el mundo) la pisa. `FRIEND_HELD_FROM` = `offerTo` = f 778.
Brazos con alcance suave (nunca del todo estirados: evita que el codo «salte» al pasar de recto a doblado).

## Reparto — `characters/cast-others.tsx` (+ `cast-others/*`)

`WalkingParentChild`, `WheelchairUser`, `ElderWithCane`, `SeatedAndStanding` (y `Walker`, sin uso) usan el mismo `buildFigure`. Al caminar, **el pie apoyado no patina**:
la pose de reposo es coherente con el ciclo (el pie izquierdo apoya SIEMPRE bajo la cadera, el derecho sale desde atrás y cierra adelante; con nº impar de pasos el
derecho queda bajo la cadera y el izquierdo cierra), de modo que al mezclar «de pie» ↔ «caminando» ningún pie apoyado se desplaza. Verificación: sonda privada de marcha, no versionada.

## Papel y grano — `texture.tsx`

`<GrainDefs id="g1" />` define un patrón de motas de papel; `Blob grain="g1"` lo superpone a rellenos planos. `Person` y
`Protagonist` ya lo usan.

## Rendimiento

Sin filtros SVG. Cada figura ≈ 60–90 `<path>` pequeños. `CrayonCurve` genera solo la parte visible (≤ 2400 puntos) y usa
2 patrones de puntos. Medido (render PNG 1080×1920, concurrencia 1, con el chat dentro del celular): escena 1 ≈ 0,15 s por
fotograma; encuadre final (2 personas + banco + curva + chat) ≈ 0,18 s. `Personajes` (galería completa) < 2 s.
