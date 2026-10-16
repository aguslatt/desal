# Web de renders — versión provisional

Sitio de visualización arquitectónica para captar los primeros clientes. Next 16 (App Router) · TypeScript · Tailwind v4 · sin librerías de animación (CSS + IntersectionObserver, scroll nativo).

```bash
cd web-renders
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

## Dónde se edita todo
**`src/content/site.ts`** centraliza: nombre, marca, WhatsApp, correo, Instagram, textos, proyectos, servicios, proceso y "sobre mí". Buscá `COMPLETAR` y `CONFIRMAR`.

- WhatsApp: solo dígitos con código de país (ej. `5491112345678`). Mientras esté vacío, los botones no abren ningún chat y lo avisan.
- `site.provisional = true` muestra los rótulos "Imagen de muestra" y bloquea la indexación en buscadores. Pasar a `false` al publicar.

## Imágenes
Los renders actuales (`src/assets/renders/`) son recortes de capturas del Instagram de Julián: **baja resolución** (≈350×470 px) y con nombres/agrupaciones provisorios. Reemplazar por los originales en alta para que se vean nítidos a pantalla grande. Las composiciones de `src/assets/muestras/` ya solo se usan como imagen para redes.

## Reemplazar imágenes de muestra
Las imágenes de `src/assets/muestras/` son composiciones abstractas generadas por código (`npm run samples`). **No son trabajos del arquitecto.**
1. Poné cada render en `src/assets/` (WebP/JPG, lado largo ≥ 2400 px; el portrait del hero ≥ 1200×1900).
2. Cambiá el `import` correspondiente en `site.ts` y poné `sample: false` en ese proyecto.
3. Cada proyecto admite 1 a N imágenes (`shots`). Ajustá `focus` (ej. `"50% 30%"`) si un recorte tapa algo importante.

Next optimiza (AVIF/WebP, tamaños responsivos), genera el placeholder borroso y carga con `lazy` todo lo que está debajo del hero; el hero se pide con prioridad alta y tiene versión vertical para celulares.

## Pendiente de confirmar con él
Servicios (nombres y alcance), proceso, textos de "Sobre mí", nombre de cada proyecto y toda la copy. No se prometen plazos, revisiones ni prestaciones adicionales.

## Accesibilidad y movimiento
Estructura semántica, enlace "saltar al contenido", visor con `<dialog>` (foco atrapado, Esc, flechas, swipe), foco visible, `prefers-reduced-motion` desactiva animaciones, contrastes AA.

## Cómo cargar los renders reales de Julián
Instagram no se puede leer desde el entorno de desarrollo, así que las imágenes hay que pasarlas como archivos (mejor los originales que lo publicado: Instagram los comprime).
Carpeta sugerida: `src/assets/renders/<proyecto>/01.jpg, 02.jpg…` y luego editar `projects` en `src/content/site.ts`. Las cápsulas de la portada (`heroContent.capsules`) pueden ser fragmentos de cualquier render.
