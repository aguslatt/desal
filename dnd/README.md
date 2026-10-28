# Umbral

Umbral es una app web para elegir **cafés de CABA y planes para el finde** con información de accesibilidad **concreta, verificada y fechada**, para personas con cualquier tipo de discapacidad y sus acompañantes. La idea: poder elegir con información suficiente, sin descubrir las barreras cuando ya llegaste.

**Alcance actual: solo cafés.** Por ahora la app se enfoca en cafés (de barrio, de especialidad, con jardín, café-librería, culturales, café-bar y panaderías con salón) y en los planes que organizan. El modelo de datos admite otros rubros: se suman en `src/lib/types.ts` y `src/lib/catalogo.ts`.

Es el MVP del proyecto integrador de Desarrollo de Negocios Digitales (UADE). El diferencial no es el mapa: es la calidad y la honestidad del dato, la personalización según necesidades concretas y que la app misma sea accesible.

> Los 15 lugares son **ficticios** y los datos son **de demostración**. La app lo avisa con un banner. Cualquier parecido con un comercio real es casualidad.

## Cómo correrla

Requisitos: Node 20.9 o más.

```bash
cd dnd
npm install
cp .env.example .env.local   # y completá METRICAS_PASSWORD
npm run dev                  # http://localhost:3000
```

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` y `npm start` | Build y servidor de producción |
| `npm test` | Tests unitarios (Vitest) |
| `npm run validar-datos` | Valida `src/data/lugares.json` contra el catálogo |
| `npm run test:e2e` | Build + tests de Playwright (accesibilidad con axe, recorrido de demo con teclado, etc.) |
| `npm run lighthouse` | Lighthouse en las páginas principales (con la app corriendo en producción) |

Para Playwright con un Chromium ya instalado: `PW_CHROMIUM=/ruta/a/chrome npm run test:e2e`.

### Variables de entorno (`.env.example`)

| Variable | Para qué |
|---|---|
| `METRICAS_PASSWORD` | Contraseña de `/metricas` (usuario: cualquiera). **Sin ella, `/metricas` queda cerrada para todos.** |
| `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` | Guardar reportes, leads y eventos en Supabase. Sin ellas, se usan archivos locales (`.data/`) o memoria. |
| `NEXT_PUBLIC_DATOS_DEMO=0` | Oculta el banner "Datos de demostración" (usalo con datos reales). |
| `NEXT_PUBLIC_FECHA_REFERENCIA` | Fecha fija que usa la demo para decir "último mes" y calcular discrepancias (por defecto `2026-10-28`). Dejala vacía (`""`) con datos reales: se usa la fecha actual. |

## Qué hay

| Ruta | Qué es |
|---|---|
| `/` | Inicio y explicación de los tres estados |
| `/necesidades` | "Mis necesidades": una pregunta, condiciones por dimensión, opcional, con los modos de visualización |
| `/lugares` | Cafés: listado (vista principal) y mapa con la misma información; filtros por condición, estilo de café y barrio |
| `/planes` | Planes adaptados para el finde (música, taller, charla, cata, juegos, lectura, cine, feria, paseo, brunch), con filtros por día, tipo y condiciones |
| `/planes/[id]` | Plan: cuándo, dónde, precio, reserva y "Tus condiciones" con fuente y fecha |
| `/lugares/[slug]` | Ficha del café, con sus planes: "Tus condiciones", todas las dimensiones desplegables con fuente y fecha, discrepancias, fotos, momentos tranquilos |
| `/lugares/[slug]/recorrido` | Recorrido visual paso a paso, con versión en texto |
| `/lugares/[slug]/reporte` | "Contar cómo te fue" (una pregunta por pantalla) y "Reportar un dato incorrecto" (`?tipo=dato`) |
| `/comercios`, `/comercios/panel`, `/relevamientos` | Lado B2B ("Para cafés"): plan gratuito y Pro, fake door, panel de ejemplo y relevamientos profesionales |
| `/metricas` | Totales de eventos anónimos, con contraseña |
| `/accesibilidad` | Decisiones de accesibilidad y lo que falta |
| `/creditos` | Autor y licencia de cada foto |
| `/diseno` | Referencia interna del sistema de diseño |

Stack: Next.js 16 (App Router), TypeScript, Tailwind 4, Radix UI (acordeón y diálogo), Leaflet + OpenStreetMap (sin API key), Atkinson Hyperlegible + Lexend, Supabase opcional por adaptador. PWA instalable con service worker propio.

```
src/
  app/            rutas y API (reportes, leads, eventos), proxy.ts (contraseña de /metricas)
  components/     ui, a11y, necesidades, lugares, ficha, reporte, comercios
  data/           catalogo.json, lugares.json (cafés), planes.json, fotos.json (créditos), reportes-demo.json, panel-demo.json
  lib/            match.ts (coincidencia y orden), planes.ts (planes y herencia de condiciones), discrepancia.ts, store/ (archivo | Supabase), entrada.ts (validación)
public/picto/     pictogramas ARASAAC (lectura fácil), manifest e íconos, sw.js
supabase/         schema.sql
tests/            unit/ (Vitest) y e2e/ (Playwright + axe)
docs/             CHECKLIST-MANUAL.md, RESULTADOS.md
```

## Cómo reemplazar los datos de demostración por relevamientos reales

Todo lo que se ve sale de archivos JSON en `src/data/`: no hay que tocar código.

1. **`lugares.json`**: un objeto por lugar. Reemplazalo con tus relevamientos. Campos:
   - `id` (slug, sin espacios: es la URL), `nombre`, `rubro` (`cafe`), `estilo` (uno de `ESTILOS` en `catalogo.ts`), `barrio`, `direccion`, `lat`, `lng`, `descripcion`, `horarios`, `contacto`, `patrocinado`.
   - `fotos`: `{ tipo, alt, src, srcSet? }`. Poné el archivo en `public/` (por ejemplo `/lugares/mi-lugar/frente.jpg`) y su ruta en `src`; con `srcSet` (varios anchos) el navegador elige el más liviano. Sin `src` se muestra una ilustración de reemplazo. El `alt` es obligatorio y tiene que describir lo que se ve. Las fotos propias no necesitan `credito`; las de `src/data/fotos.json` sí (se listan en `/creditos`). Cuando uses fotos reales de cada local, sacá "Foto ilustrativa" cambiando el rótulo en `src/components/ui/Foto.tsx`.
   - `recorrido`: lista de pasos `{ tipo, titulo, alt, descripcion, src? }`. Si queda vacía, la ficha no ofrece recorrido.
   - `momentos`: franjas con `ruido` y `concurrencia` de 1 (bajo) a 3 (alto).
   - `datos`: `{ "<id de condición>": { estado, valor?, fuente: { tipo, fecha, cantidad? } } }`.
     - `estado`: `confirmado` o `no_disponible`. **Lo que no figura se muestra como "Sin información"**, nunca como "sí".
     - `fuente.tipo`: `equipo` (relevamiento), `comercio` o `visitantes` (con `cantidad`). `fecha` en formato `AAAA-MM-DD`.
     - `valor`: para condiciones que lo llevan (ancho de puerta en cm, horarios de LSA, etc.).
2. **`planes.json`**: un objeto por plan: `id`, `titulo`, `tipo`, `lugarId` (el `id` del café), `fecha` (`AAAA-MM-DD`), `desde`, `hasta`, `precio` (`Gratis` o `Con consumición`), `reserva`, `descripcion` y `datos` (mismas condiciones y estados que un café). **Las condiciones físicas del café se heredan** (escalones, baño, ascensor), pero **lo que depende del momento no**: intérprete de LSA, ruido, concurrencia, luz y tiempos de espera (`dependeDelMomento` en el catálogo) solo valen si el plan lo declara. Así no se da por buena una condición de otro horario. Los planes con fecha pasada dejan de mostrarse solos.
3. **`catalogo.json`**: las dimensiones y condiciones (los `id` que usa `datos`). Cada condición tiene su etiqueta, su versión de lectura fácil (`facil`), su pictograma (`picto`) y, si corresponde, su pregunta del reporte.
4. **`reportes-demo.json`**: reportes de ejemplo. Vacialo (`[]`) cuando los reportes reales estén en Supabase.
5. Poné `NEXT_PUBLIC_DATOS_DEMO=0` y `NEXT_PUBLIC_FECHA_REFERENCIA=""`.
6. Corré `npm run validar-datos`: revisa que los ids existan, que cada dato tenga fuente y fecha, que las coordenadas caigan en CABA y que toda foto tenga texto alternativo.
7. Si cambiás el catálogo, revisá también los pictogramas (`public/picto/`).

Para pasar a reportes reales en la ficha, hoy la discrepancia se calcula con `reportes-demo.json`. Los reportes que envían las personas se guardan (Supabase o archivo), pero todavía no se leen para recalcular las fichas.

## Despliegue en Vercel

1. Importá el repositorio en Vercel y, en **Root Directory**, elegí `dnd`.
2. Cargá `METRICAS_PASSWORD` (obligatoria para `/metricas`).
3. Para que reportes, leads y métricas **persistan**: creá un proyecto gratis en Supabase, ejecutá `supabase/schema.sql` en el SQL editor y cargá `SUPABASE_URL` y `SUPABASE_SERVICE_KEY`. Sin Supabase, en Vercel esos datos viven solo en la memoria de cada instancia y se pierden al reiniciarse.
4. Desplegá. El build no necesita más configuración.

## Decisiones de accesibilidad

Meta: **WCAG 2.2 nivel AA**, y AAA donde es razonable (contraste y tamaño de los elementos tocables). Si una decisión de diseño competía con la accesibilidad, ganó la accesibilidad. También están resumidas, para el público, en `/accesibilidad`.

**Del dato**
- Nada de etiquetas generales ("apto para…", "100 % accesible"): solo condiciones concretas y observables.
- Tres estados (Confirmado, No disponible, Sin información), siempre con **texto + ícono + color + forma del borde**. Azul, naranja y gris, que se distinguen con daltonismo. La ausencia de datos nunca se muestra como "sí".
- Cada dato dice **quién lo aportó y cuándo**. Si 2 o más reportes de los últimos 60 días contradicen un dato confirmado, se muestra un aviso visible.
- La información de accesibilidad es siempre gratuita. Un lugar patrocinado solo aparece si cumple **todas** las condiciones elegidas, lleva la etiqueta "Patrocinado" y no mejora su posición (el desempate es por cantidad de datos confirmados, nunca por patrocinio).
- No se muestra ningún puntaje ni estrellas de accesibilidad: solo "Cumple 5 de 6 · 1 sin información".

**De la interfaz**
- Contraste de 7:1 como mínimo en texto principal y secundario y en los tres estados, en los 4 temas (verificado por test).
- Elementos tocables de 44 × 44 px (verificado por test, incluidos los marcadores y controles del mapa). Los marcadores muy cercanos se agrupan para no superponerse.
- Todo se usa con teclado. Foco siempre visible con doble anillo, nunca atrapado salvo en el diálogo modal (donde Escape sale y devuelve el foco). Skip link "Ir al contenido".
- Resultados, errores y cambios de paso se anuncian con `aria-live` o moviendo el foco al nuevo título. Los errores se explican en texto, asociados al campo. Ninguna acción tiene límite de tiempo.
- Gráficos (momentos tranquilos, panel Pro) siempre con **tabla equivalente**, y distinguidos sin depender del color (relleno liso o rayado).
- Mapa y listado tienen la misma información; el mapa es un complemento, no el único camino.
- **Modos de visualización** siempre en el encabezado: texto hasta 200 %, alto contraste, modo oscuro, reducir movimiento y lectura fácil (frases cortas y pictogramas ARASAAC). Respetan `prefers-color-scheme`, `prefers-contrast` y `prefers-reduced-motion`. Sin scroll horizontal a 320 px.
- HTML semántico: landmarks, un `h1` por página, jerarquía de encabezados, `lang="es-AR"`, imágenes con `alt` significativo y decorativas con `alt=""`.
- Tipografía: Atkinson Hyperlegible (Braille Institute) para el texto y Lexend para los títulos. Lenguaje en español rioplatense, frases cortas, "personas con discapacidad".

**De la privacidad**
- No se piden diagnósticos: la persona elige condiciones concretas.
- Las necesidades se guardan solo en el dispositivo (`localStorage`).
- La medición es anónima: se guarda el nombre del evento, unas pocas propiedades de una lista permitida y la hora. Nada de IP, navegador ni identificadores. Se respeta "No rastrear".

## Resultados de los tests

Detalle y cómo repetirlos en [`docs/RESULTADOS.md`](docs/RESULTADOS.md). Resumen (28/10/2026, build de producción):

- **Vitest: 82 de 82.** Lógica de coincidencia y orden, patrocinados, discrepancias, validación de reportes, leads y eventos, contraseña de `/metricas`, métricas, integridad de los datos y contraste de color.
- **Playwright: 174 de 174.**
  - **axe-core: 0 violaciones** en 20 pantallas × 7 modos de visualización (claro, oscuro, alto contraste, alto contraste oscuro, texto enorme, lectura fácil y con necesidades marcadas), más cada paso del asistente de reporte y el diálogo abierto.
  - Recorrido de demo completo solo con teclado: necesidades → listado → ficha → recorrido → reporte → lectura fácil.
  - Sin scroll horizontal a 320 px y a 360 px con texto al 200 %. Elementos tocables de 44 × 44 px. PWA offline. 404.
- **Lighthouse** (móvil y escritorio): **Accesibilidad 100 y Buenas prácticas 100 en las 11 páginas medidas.** Rendimiento: 93 como mínimo en móvil y 91 como mínimo en escritorio (mapa).

Lo que **no** está probado todavía: lectores de pantalla reales (hay una checklist manual para VoiceOver, TalkBack y NVDA en [`docs/CHECKLIST-MANUAL.md`](docs/CHECKLIST-MANUAL.md)), pruebas con personas con discapacidad, y Safari/Firefox (los automáticos corren en Chromium).

## Límites conocidos

- Las fotos de los lugares son **ilustrativas** (espacios parecidos, de Wikimedia Commons, con licencia libre): los cafés de la demostración son ficticios. El recorrido visual usa ilustraciones propias a propósito: una foto real de una rampa junto a un texto que dice "no hay rampa" confundiría, y la honestidad del dato es el diferencial. Con relevamientos reales, se reemplazan por fotos propias (ver arriba).
- La foto de evidencia del reporte es simulada: no se sube el archivo.
- Las teselas del mapa son las públicas de OpenStreetMap, aptas para una demostración pero no para mucho tráfico.
- Los reportes nuevos se guardan, pero no recalculan las fichas (la discrepancia usa los reportes de demostración).
- Los precios de los relevamientos no están definidos: la página dice "presupuesto según el tamaño del local".

## Licencias y atribuciones

- **Pictogramas: ARASAAC** (<https://arasaac.org>). © Gobierno de Aragón, autor Sergio Palao. Licencia **CC BY-NC-SA 4.0** (uso no comercial, con atribución y compartiendo igual). Está bien para este proyecto universitario; si Umbral se comercializa (por ejemplo con el plan Pro), hay que pedir autorización a ARASAAC o reemplazar los pictogramas. La atribución está en el pie de página y en `public/picto/LICENCIA.txt`.
- **Mapa:** © colaboradores de OpenStreetMap (ODbL), con Leaflet.
- **Fotos:** Wikimedia Commons, con licencias CC0, CC BY y CC BY-SA. Autor, licencia y enlace de cada una están en la página `/creditos` y en `src/data/fotos.json`. Se redimensionaron y convirtieron a WebP; conservan su licencia original.
- **Tipografías:** Atkinson Hyperlegible (Braille Institute) para el texto y Lexend para los títulos, ambas con licencia SIL Open Font License, vía `@fontsource`.
