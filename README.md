# DE SAL — web v1 (editorial / ecommerce)

Concepto: **joyas que emergen de la sal**, con el sistema visual del manual de marca (rojo / hueso / negro, grotesca Black). Dirección de arte completa en [`docs/ART_DIRECTION.md`](docs/ART_DIRECTION.md)
(análisis de la referencia, 3 conceptos, elección, sistema visual y de movimiento).

## Correr
```bash
npm install
npm run dev          # http://localhost:3000
npm run build && npm start
```

## Stack
Next.js 16 (App Router) · TypeScript · Tailwind v4 · GSAP (ScrollTrigger, Draggable, Inertia) · Lenis · Three.js / React Three Fiber.

## Qué hay
- **Home**: Intro (joya 3D que emerge entre costras) → New in 01—06 (6 composiciones; carrusel por swipe en mobile) → Mundo (collage arrastrable) → Made by hand → Colecciones → Seen on you → Footer (sal que se acumula).
- **PDP** `/piece/[slug]`: ficha de especimen, pieza orbitable a pantalla casi completa, regla de talle, vuelo de la pieza al carrito.
- Cursor contextual, transición de página (corte de sal), loader, menú mobile, bolsa (sin checkout: v1).

## Logo y marca
`src/components/ui/Logo.tsx` contiene los vectores EXACTOS del logo del manual (extraídos del PDF: Neue Haas Grotesk Black + "studio"). Se usa en nav, hero, footer y loader.
El resto de los títulos usa Inter (libre) como aproximación; si hay licencia de Neue Haas Grotesk, cambiar `--font-display`.

## Qué lo hace propio
Hero con **agua líquida** sobre el logo (WebGL, el cursor deja ondas) · cursor de **oro fundido** · fotos que se **distorsionan como agua** al pasar el mouse ·
sección "Hecho a mano" donde un anillo 3D pasa de **cera → metal fundido → limado → pulido** al scrollear.

## Piezas reales
Las fotos de `public/photos/` son anillos reales de DE SAL. Tres diseños están modelados en 3D a partir de esas fotos
(`src/three/PieceModel.tsx`: `cuffstar`, `rib`, `molten`): son aproximaciones, no escaneos. Los nombres (`ESTRELLA`, `COSTILLAS`, `AMATISTA`, `CALADO`) son descriptivos y PROVISORIOS: confirmar con el taller.

## ⚠ Placeholders (nada de esto es información oficial de DE SAL)
- **Joyas**: modelos procedurales (`src/three/`). Renders estáticos en `public/pieces/` (con `npm run dev` corriendo, `npm run render:pieces` los regenera).
  Para usar fotografía real: reemplazar `public/pieces/<kind>-{a,b,c}.webp` (a/b con fondo transparente; c = macro) y actualizar `src/content/pieceSizes.json`.
- **Datos**: precio, material, peso, medidas, stock y talles son `null` en `src/content/pieces.ts` y se muestran como `[por definir]`.
- **Copy**: propuesta, centralizada en `src/content/copy.ts`.
- Fotos de comunidad, "manos", "puesta": huecos marcados `placeholder`.

## Performance / accesibilidad
- Un solo `<Canvas>` por vista, pausado fuera de viewport; DPR ≤ 1.75; luz procedural (sin HDRI).
- Fallback 2D (mismo render) si no hay WebGL, `prefers-reduced-motion`, `saveData` o ≤ 2 núcleos.
- `prefers-reduced-motion`: sin Lenis, sin scrub, estados finales directos.
- Imágenes con `width/height` (sin CLS) y `loading="lazy"`.

## Pendiente
Checkout real, páginas de colección, datos y fotografía reales, tuning fino de motion con feedback.
