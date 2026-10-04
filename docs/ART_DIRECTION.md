# DE SAL studio — Dirección de arte

> ## v2 (vigente) — alineada al manual de identidad visual
> La v1 (abajo, histórica) partía de un beige "editorial/serif" que **no** es la marca. Cambios de la v2:
>
> - **Sin "objetos"**: en DE SAL hay *joyas*. Copy, navegación y categorías lo reflejan (New in · Joyas · Anillos / Collares / Aros / Pulseras / Broches).
> - **Paleta del manual**: rojo `#9b2219` (principal), hueso `#e4dfc1` y negro `#000` (secundarios). Derivados para ritmo: marfil `#f0ecd6`, rojo hondo `#6a150f`, oro `#c9a24a`. Las secciones alternan **tema** (`theme-red / bone / black / gold / marfil`) y los bloques de color cortan la página con la línea de sal.
> - **Tipografía**: wordmark en grotesca **Black** MAYÚSCULAS con tracking cerrado + "studio" en ultra-light itálica (como el logo). Fuente actual: Inter Tight (libre). El manual usa Neue Haas Grotesk (licencia comercial): si se compra, cambiar `--font-display` en `globals.css`.
> - **Marca**: la gota de oro de 7 brazos se reconstruyó en 3D (marching cubes) y aparece en loader, transición y footer.
> - **3D más real**: estudio fotográfico procedural (RoomEnvironment + rebotes de color de marca), oro PBR con mapa de rugosidad y normal micro, geometría de metal fundido (sin "arrugas"), piedras con coat.
> - Cursor, nav y barra mobile se leen sobre cualquier fondo (la tinta del header cambia según la sección).

# v1 (histórico)

> Orden de trabajo: **1. análisis → 2. conceptos → 3. elección → 4. sistema → 5. código.**
> Este documento es 1–4. El código (`/src`) implementa 5 y no introduce nada que no esté acá.

---

## 1. Qué funciona en la referencia (y qué NO se copia)

| Qué hace la referencia | Por qué funciona | Cómo lo traduce DE SAL (sin copiar) |
|---|---|---|
| Fondo off-white cálido, casi papel | El metal brilla más contra algo mate y cálido | Hueso/crema **con grano de sal real** (ruido fino, no degradé) |
| Joya recortada gigante, sin caja | Se lee como escultura, no como SKU | Las piezas **cruzan** la composición, se salen del cuadro, pisan el texto |
| Una carta (♥ / A) como elemento inesperado | Un solo gesto "ajeno" da personalidad | Un único gesto ajeno: **marca de lápiz graso bermellón** (círculos, flechas, tachados) sobre las contact sheets y fichas |
| Collage con fotografía de fondo desvaído + objeto encima | Capas: textura / foto / objeto / tipo | Sistema de **4 planos** con parallax mínimo (ver §4.5) |
| Ficha técnica tipo museo (Material / Size / Stock) | Información como objeto de diseño | PDP como **ficha de especimen** con líneas de llamada a la pieza |
| Lista de valores con ícono-pieza al costado | Ritmo asimétrico texto/objeto | "Made by hand" con palabras gigantes en esquinas distintas |
| Tipografía serif editorial + sans pequeña | Contraste de escala = jerarquía sin cajas | Serif variable con ejes "blandos" (imperfecta) + sans técnica diminuta |

**Qué NO se toma:** su paleta con rojo, sus textos, sus claims (reciclado, 180 min, etc.), su layout de dos columnas, el ojo/carta.
**Qué falta en la referencia y DE SAL agrega:** profundidad real (WebGL), movimiento, y una idea de *materia* (sal) en vez de solo *objeto*.

## 2. Qué dice el nombre

*DE SAL* = "hecho de sal / de la sal". Tres lecturas útiles:

1. **Origen** — mar, costa, lo que queda cuando el agua se retira (cristal, costra, marca de marea).
2. **Materia** — mineral, rugoso, blanco-gris, brillo puntual (cada grano refleja).
3. **Tono** — "de sal" también es gracia/picardía: sobriedad con un guiño. Por eso el gesto bermellón de lápiz graso.

Palabras guía: SCULPTURAL · RAW · TACTILE · IMPERFECT · FASHION · ART OBJECT.

## 3. Tres conceptos

### A — EMERGEN *(objetos que emergen de la sal)*
- **Concepto:** la joya sale de una costra de sal. La web es un afloramiento: se empieza semienterrado y se sube.
- **Dirección visual:** hueso con grano, costras irregulares de sal como "línea de agua" que parte la página; oro/plata muy reflectantes contra mate absoluto.
- **Navegación:** vertical, una sola caída. Cada escena es un nivel del afloramiento: enterrado → emergido → expuesto → taller → colección → huella.
- **Producto:** escultura recortada, tamaño de elemento arquitectónico, cruza la línea de sal.
- **3D:** superficie de sal + joya central real en WebGL; al scrollear la joya sale de la costra y cae sal.
- **Motion:** masks que se abren como grietas, inercia, gravedad (granos que caen).
- **Tipografía:** serif gigante partida (DE / SAL) que se separa para dejar pasar la pieza.
- **Reconocible por:** la línea de sal y la pieza saliendo de ella.

### B — ESPECIMEN *(gabinete de mineralogía)*
- **Concepto:** DE SAL como colección de especímenes catalogados: cada joya es una muestra.
- **Dirección visual:** fichas, etiquetas, alfileres, cinta, papel de archivo; mucho texto técnico diminuto.
- **Navegación:** lateral, cajones/bandejas.
- **Producto:** fotografía plana, sobre papel, con etiqueta.
- **3D:** casi ninguno (objeto en vitrina que rota con el cursor).
- **Motion:** deslizamientos secos, "sellos" que caen.
- **Tipografía:** mono + serif clásica.
- **Reconocible por:** el sistema de etiquetas. *Riesgo:* se parece a cualquier marca "archivo/museo"; el 3D queda sin rol.

### C — MAREA *(la costa que se retira)*
- **Concepto:** el scroll es la marea bajando; la página pasa de mojada a seca y las piezas "quedan" en la arena.
- **Dirección visual:** transición tonal arena húmeda → hueso seco, horizonte, reflejos de agua.
- **Navegación:** horizontal / playa, scroll lateral.
- **Producto:** objetos encontrados, dispersos, a escala natural.
- **3D:** agua con shader y reflejo de la joya.
- **Motion:** olas, retiro, espuma.
- **Tipografía:** serif fluida que se "estira".
- **Reconocible por:** el color mojado/seco. *Riesgo:* roza lo gradiente-tecnológico que querés evitar, y el scroll horizontal castiga la usabilidad y el ecommerce.

## 4. Elección: **A — EMERGEN**, con el lenguaje de etiquetas de B como capa de información

**Por qué A:** es la única donde el 3D *es* la dirección de arte (la pieza literalmente sale de la materia) y no un adorno; es la más defendible en una frase ("objetos que emergen de la sal"), y funciona igual si se saca el logo porque la **línea de sal** y la **pieza cruzando el texto** son identidad. B aporta el sistema de fichas (PDP y labels); C se descarta por riesgo estético y de usabilidad.

### 4.1 Paleta (tokens en `globals.css`)
| Token | Hex | Uso |
|---|---|---|
| `hueso` | `#EFEAE0` | fondo base |
| `crema` | `#E6DECD` | planos secundarios |
| `arena` | `#CDBFA4` | paneles, texturas |
| `mineral` | `#6F716C` | escena final, textos secundarios |
| `plata` | `#B9BBBA` | detalles, bordes |
| `oro` | `#B8892E` | acento metálico (tipo/detalles) |
| `tinta` | `#14130F` | texto, detalles pequeños |
| `bermellon` | `#D2431E` | **único** gesto ajeno: lápiz graso, stock, sellos. Máx. 1 por vista |

Prohibido: degradés de UI, glass, sombras difusas, esquinas redondeadas de botón.

### 4.2 Tipografía
- **Serif:** Fraunces variable (ejes `SOFT` y `WONK` → forma blanda, levemente "chueca", manual). Titulares, nombres, frases. Escala de 0.9rem → 38vw.
- **Sans:** Hanken Grotesk. Navegación, precios, fichas, UI. Siempre pequeña (10–13px) y en mayúsculas con tracking, salvo lectura.
- Regla de escala: **nunca** hay un tamaño intermedio de relleno; o es diminuto o es monumental.

### 4.3 Elementos gráficos propios (el "lenguaje")
1. **Línea de sal** — borde irregular (clip-path poligonal generado) que separa escenas.
2. **Grano** — ruido fino fijo sobre todo el sitio, + partículas de sal en 3D/2D.
3. **Cortes de papel** — paneles con borde recortado a mano, nunca rectángulos perfectos.
4. **Ficha** — línea de llamada + micro-label (`MATERIAL — [por definir]`).
5. **Lápiz graso bermellón** — SVG trazado a mano: círculo, flecha, tachón.
6. **Numeración** — `Nº01`, `01/06`, coordenadas vivas `x.42 y.18` en hover.
7. **Cursor** — cristal (rombo 7px) → etiqueta con contexto (`VER →`, `Nº03`, `ARRASTRAR`).

### 4.4 Sistema de movimiento
- Ease por defecto: `power3.out` entrada, `expo.inOut` transiciones de página. Duraciones 0.5–0.9s. **Nada** > 1.2s.
- Reveal = **máscara** (clip-path), no fade. Fade solo en micro-texto.
- Inercia en todo lo manipulable (cursor, tilt, drag, scroll con Lenis `lerp 0.1`).
- Parallax: `data-depth` ±(8–40px); en mouse máximo 14px.
- `prefers-reduced-motion`: sin Lenis, sin scrub, sin partículas, estados finales directos, hero 3D → imagen estática.

### 4.5 Planos de profundidad
`0` grano/textura · `1` fotografía/textura mineral · `2` tipografía gigante · `3` joya · `4` micro-textos y marcas de lápiz.

### 4.6 Reglas del 3D (cuándo sí / cuándo no)
- **Sí:** hero (joya + superficie de sal + sal flotante) y PDP (pieza en pantalla completa, orbitable con inercia).
- **No:** listados, colecciones, collage → se usan renders estáticos de la misma escena (mismo material, misma luz = coherencia, 0 costo de GPU).
- Un solo `<Canvas>` activo por vista; `frameloop` se pausa fuera de viewport; DPR ≤ 1.75.
- Fallback 2D de alta calidad (render PNG/WebP + parallax CSS) si: sin WebGL, `prefers-reduced-motion`, ≤ 2 núcleos o `saveData`.

### 4.7 Política de placeholders
- Joyas: **modelos procedurales** (no son piezas reales de DE SAL). Se reemplazan por fotografía real: ver `README.md`.
- Nombres de producto = categoría + número (`ANILLO Nº01`). Sin nombres inventados.
- Precio, material, peso, medidas, stock, talles: renderizan `[por definir]` / `$ [—]` con estilo `ph` (subrayado punteado). Nada parece información oficial.
- Textos de marca (frases) son **propuesta de copy**, listados en `src/content/copy.ts` para editar en un solo lugar.

### 4.8 Test por sección: *"¿esto podría ser de cualquier joyería?"*
| Sección | Respuesta | Qué lo hace DE SAL |
|---|---|---|
| 01 Intro | No | La pieza emerge de la costra; DE / SAL se abren para dejarla salir |
| 02 New Objects | No | 6 composiciones distintas; el nombre sigue al cursor; sin grilla |
| 03 Hover | No | Tilt físico + destello recortado a la silueta + coordenadas vivas |
| 04 World | No | Collage arrastrable en 4 planos; palabras-material |
| 05 Made by hand | No | MADE / BY / HAND en tres esquinas con macro a escala monumental |
| 06 Colecciones | No | Lista tipográfica; pieza gigante persigue el cursor |
| 07 Seen on you | No | Fotos físicas + lápiz graso bermellón |
| 08 Footer | No | La sal se acumula y reacciona al mouse |
| PDP | No | Ficha de especimen, ruler de talle, objeto vuela al carrito |

### 4.9 Mobile (diseño propio, no reducción)
- Barra inferior fija (alcanza con el pulgar): `MENÚ · DE SAL · BOLSA`.
- New Objects = **carrusel horizontal por swipe**, una pieza por pantalla, nombre gigante.
- Colecciones = acordeón táctil. Collage = apilado con rotaciones (sin drag). Contact sheet = scroll lateral.
- PDP: pieza ocupa el viewport; gesto horizontal rota; ficha en bandas.
