import { COVER } from "../config/script.ts";
import { LOGO } from "../config/brand.ts";
import { H, SAFE, W } from "../config/layout.ts";
import { BENCH_SLOTS, PHONE_CENTER, PHONE_SCALE, benchSeat, phoneToWorld, type Pt } from "../illustration/index.ts";

/**
 * PORTADA «El mensaje que borraste» — geometría y composición (pantalla 1080×1920).
 *
 *  recorte 4:5 del perfil (y 285–1635)  ·  zona segura x 120–960  ·  nada cruza texto ni logo (≥ CLEAR px de aire)
 *
 *      345  entradilla  «Día Mundial de la Salud Mental»
 *      420  TÍTULO  «El mensaje / que borraste»  (2 líneas, Montserrat 700 · 94 px)
 *      ──   banda de ilustración: protagonista + celular (chat con el mensaje SIN ENVIAR), reparto pequeño en los bordes,
 *           el hilo naranja que nace del cursor y conecta
 *     1380  logo oficial (sin deformar)
 */
export { H, W, SAFE };
export const CLEAR = 40;

/** Recorte central 4:5 de la portada (lo que muestra la grilla del perfil). */
export const CROP_45 = { y0: 285, y1: 1635 } as const;

// ───────────────────────── tipografía (métricas de Montserrat medidas, em) ─────────────────────────
export const MONT = { ascent: 0.968, descent: 0.251, cap: 0.703, ascender: 0.75, descender: 0.203, xHeight: 0.547 } as const;

export const TYPE = {
  kicker: { size: 34, weight: 600, baseline: 372, tracking: 0.015 },
  title: { size: 94, weight: 700, baselines: [494, 600] as const, tracking: -0.012 },
} as const;

/** El texto sale SIEMPRE de config/script.ts; acá solo se decide el corte de líneas del título (2 + 2 palabras) y la palabra con subrayado. */
const TITLE_WORDS = COVER.title.split(" ");
const TITLE_BREAK = 2;
export const LINES = {
  kicker: COVER.subtitle,
  /** «El mensaje / que borraste» — lines.join(" ") === COVER.title */
  title: [TITLE_WORDS.slice(0, TITLE_BREAK).join(" "), TITLE_WORDS.slice(TITLE_BREAK).join(" ")] as const,
  /** palabra con subrayado de crayón naranja (la última del título) */
  mark: TITLE_WORDS[TITLE_WORDS.length - 1],
} as const;

/**
 * Anchos medidos con el motor de render (Montserrat 700, 94 px, interletra −0,012 em): respaldo para cuando la fuente todavía no cargó
 * (así el subrayado queda en el mismo lugar en cualquier pasada de render). Se escalan por tamaño de fuente.
 */
export const MEASURED_TITLE = { size: 94, line1: 526.03, line2: 611.81, before: 210.84, word: 400.97 } as const;

/** Caja de la línea (px) y distancia de su borde superior a la línea base. */
export const lineBox = (size: number) => Math.round(size * 1.3);
export const baselineIn = (size: number, box: number) => (box - (MONT.ascent + MONT.descent) * size) / 2 + MONT.ascent * size;

// ───────────────────────── logo ─────────────────────────
export const LOGO_W = 440;
export const LOGO_BOX = (() => {
  const h = LOGO_W / LOGO.ratio;
  const top = 1384;
  return { left: 540 - LOGO_W / 2, top, width: LOGO_W, height: h, right: 540 + LOGO_W / 2, bottom: top + h, cx: 540 };
})();

// ───────────────────────── héroe: la protagonista en su banco ─────────────────────────
/** px de pantalla por unidad de mundo del kit (la protagonista y su celular están calibrados para escala 1). */
export const HERO_K = 0.72;
/** suelo bajo el centro del banco (pantalla) */
export const BENCH_ON_SCREEN = { x: 575, y: 1318 } as const;
/** cadera sentada en coordenadas del «mundo héroe» (origen = suelo bajo el centro del banco) */
export const SEAT = benchSeat({ x: 0, y: 0 }, BENCH_SLOTS.protagonist);

/** mundo héroe → pantalla */
export const heroToScreen = (p: Pt): Pt => [BENCH_ON_SCREEN.x + p[0] * HERO_K, BENCH_ON_SCREEN.y + p[1] * HERO_K];

/** El celular de la portada: derecho (0°) y quieto, pantalla = chat nativo 1080×1920 escalado. */
export const PHONE_CONTROLS = { phoneLower: 0, phoneScale: 1, phoneTilt: 0 } as const;

/** coordenada NATIVA del chat → pantalla de la portada */
export const chatToScreen = (nx: number, ny: number): Pt => heroToScreen(phoneToWorld(nx, ny, { x: SEAT.x, y: SEAT.y, controls: PHONE_CONTROLS }));

/** centro del celular en pantalla (la pantalla nativa 540,960) */
export const PHONE_ON_SCREEN = heroToScreen([SEAT.x + PHONE_CENTER.x, SEAT.y + PHONE_CENTER.y]);
/** px de pantalla por px nativo del chat */
export const PHONE_K = PHONE_SCALE * HERO_K;

/** fotograma absoluto del reel que muestra el chat: el mensaje 3 completo, SIN ENVIAR, con el cursor naranja encendido (CURSOR_HANDOFF − 1) */
export const CHAT_FRAME = 409;
/** fotograma absoluto para la postura y los pulgares de la protagonista (la pausa de duda tras el último mensaje) */
export const BODY_FRAME = 409;

// ───────────────────────── reparto (suelo en pantalla, px por unidad, mirada) ─────────────────────────
export type CastSpot = { readonly id: "parentChild" | "wheelchair" | "elder"; readonly x: number; readonly y: number; readonly k: number; readonly facing: 1 | -1 };
export const CAST: readonly CastSpot[] = [
  { id: "parentChild", x: 204, y: 1040, k: 0.32, facing: 1 },
  { id: "elder", x: 905, y: 1000, k: 0.36, facing: -1 },
  { id: "wheelchair", x: 905, y: 1290, k: 0.3, facing: -1 },
];
