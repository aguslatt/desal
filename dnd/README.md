# Umbral

App web para elegir salidas (bares, restaurantes, cafés, cines y centros culturales de CABA) con información de accesibilidad concreta, verificada y fechada. MVP del proyecto integrador de Desarrollo de Negocios Digitales (UADE).

> En construcción: este README se completa en la fase 5. Estado actual: **fase 3** (de 5).

## Correr

```bash
cd dnd
npm install
npm run dev        # http://localhost:3000
npm test           # tests unitarios (lógica, datos de demostración, contraste)
npm run build
```

## Datos de demostración

`src/data/lugares.json` (15 lugares ficticios en distintos barrios de CABA), `src/data/catalogo.json` (condiciones por dimensión) y `src/data/reportes-demo.json`.
Todos los nombres son inventados. Cualquier parecido con un comercio real es casualidad.

## Reportes y almacenamiento

Los reportes se envían a `/api/reportes` y pasan por `src/lib/store/`:
- Con `SUPABASE_URL` y `SUPABASE_SERVICE_KEY`: se guardan en Supabase (tablas en `supabase/schema.sql`).
- Sin eso: archivos locales en `.data/` o, si el servidor es de solo lectura (Vercel), memoria de esa instancia.

El servidor descarta todo campo que no esté en la lista permitida: no se guarda ningún dato personal. En esta versión los reportes nuevos se guardan, pero la discrepancia de la ficha se calcula con los reportes de demostración.

## Reglas del dato

- Cada condición tiene un estado: `confirmado`, `no_disponible` o `sin_info`. Lo que no está cargado es `sin_info`, nunca "sí".
- Cada dato lleva fuente (equipo, comercio o visitantes) y fecha.
- Hay discrepancia cuando 2 o más reportes de los últimos 60 días contradicen un dato confirmado (`src/lib/discrepancia.ts`).
- Un lugar patrocinado solo aparece si cumple todas las condiciones elegidas, y no mejora su posición (`src/lib/match.ts`).
