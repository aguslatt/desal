import { COLORS } from "../config/brand.ts";
import { MESSAGES } from "../config/script.ts";
import { CURSOR_HANDOFF } from "../config/timeline.ts";
import { KEY_EVENTS, MESSAGE_TIMINGS, activeMessage, cursorOpacity } from "../config/typing.ts";
import { CURSOR, KEYS, KEY_FX, PILL, lineCenterY, type KeyId } from "./geometry.ts";
import { measureTextWidth } from "./measure.ts";

/**
 * Estado visible del chat en un fotograma ABSOLUTO del reel. Módulo PURO (sin React/Remotion):
 * la interfaz lo dibuja tal cual y sirve para verificar (texto visible, tecla activa, borrar, enviar).
 * Misma fuente que el audio de teclado: KEY_EVENTS / MESSAGE_TIMINGS de config/typing.ts.
 */

// ───────────────────────── carácter → tecla
const MARKS = /[̀-ͯ]/g;

/** Tecla física que produce un carácter (vocales con tilde → vocal base; «¿ ? …» → ?123 o «.»). */
export const keyForChar = (c: string): KeyId => {
  if (c === " ") return "space";
  if (c === "." || c === "…") return "dot";
  if (c === ",") return "comma";
  if (/[¿?¡!:;()"'\-]/.test(c)) return "sym";
  const low = c.toLowerCase();
  if (low === "ñ") return "ñ";
  return low.normalize("NFD").replace(MARKS, "");
};
const isCapital = (c: string) => /\p{Lu}/u.test(c);

// ───────────────────────── pulsaciones (derivadas de KEY_EVENTS)
type Press = { readonly key: KeyId; readonly from: number; readonly until: number; readonly decay: number };

const PRESSES: Press[] = [];
const BACK_PULSES: number[] = [];
{
  let prev = -Infinity;
  for (const e of KEY_EVENTS) {
    if (e.kind === "backspace") {
      BACK_PULSES.push(e.frame);
    } else {
      // «…» se obtiene manteniendo la tecla «.»: la pulsación dura un poco más
      const hold = e.char === "…" ? KEY_FX.longPress : 0;
      PRESSES.push({ key: keyForChar(e.char), from: e.frame, until: e.frame + hold, decay: KEY_FX.press });
      if (isCapital(e.char)) {
        // ⇧ se enciende un instante antes de la mayúscula y se suelta cuando aparece
        const lead = Number.isFinite(prev) ? Math.max(1, Math.min(KEY_FX.shiftLead, e.frame - prev - 1)) : KEY_FX.shiftLead;
        PRESSES.push({ key: "shift", from: e.frame - lead, until: e.frame, decay: KEY_FX.press });
      }
    }
    if (e.frame > prev) prev = e.frame;
  }
}
const PRESSES_BY_KEY: Record<KeyId, Press[]> = {};
for (const p of PRESSES) (PRESSES_BY_KEY[p.key] ??= []).push(p);

/** Tramos en que la tecla ⌫ se mantiene presionada (primer → último borrado de cada mensaje). */
const BACK_HOLDS = MESSAGE_TIMINGS.filter((m) => m.deleteFrames.length > 0).map((m) => ({
  from: m.deleteFrames[0] - KEY_FX.backHoldIn,
  first: m.deleteFrames[0],
  until: m.deleteFrames[m.deleteFrames.length - 1],
}));

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);

/** Resalte 0–1 de una tecla normal en `frame` (1 en el fotograma exacto de la pulsación, cae suave). */
const keyIntensity = (key: KeyId, frame: number): number => {
  let v = 0;
  for (const p of PRESSES_BY_KEY[key] ?? []) {
    if (frame < p.from) continue;
    if (frame <= p.until) return 1;
    const d = (frame - p.until) / p.decay;
    if (d < 1) v = Math.max(v, Math.pow(1 - d, 1.6));
  }
  return v;
};

/** ⌫: componente «mantenida» (0–1) y pulso por carácter borrado (0–1). */
const backspaceParts = (frame: number): { hold: number; pulse: number } => {
  let hold = 0;
  for (const h of BACK_HOLDS) {
    if (frame < h.from) continue;
    if (frame <= h.until) hold = Math.max(hold, easeOut(clamp01((frame - h.from) / KEY_FX.backHoldIn)));
    else hold = Math.max(hold, 1 - easeInOut(clamp01((frame - h.until) / KEY_FX.backHoldOut)));
  }
  let pulse = 0;
  for (const f of BACK_PULSES) {
    if (frame < f) break;
    const d = (frame - f) / KEY_FX.backPulse;
    if (d < 1) pulse = Math.max(pulse, Math.pow(1 - d, 1.4));
  }
  return { hold, pulse };
};

// ───────────────────────── campo: 2 líneas y botón de enviar
const TWO_LINE_WINDOWS = MESSAGE_TIMINGS.map((m, i) => {
  const lines = MESSAGES[i].lines;
  if (lines.length < 2) return null;
  const n = Array.from(m.text).length;
  const len0 = Array.from(lines[0]).length;
  return {
    /** el espacio entre líneas se tipea → el cursor pasa a la 2.ª línea y el campo empieza a crecer */
    grow: m.charFrames[len0],
    /** al borrar, el visible vuelve a len0 → el campo se encoge (cuando ya se desvanecieron los fantasmas de la 2.ª línea) */
    shrink: m.deleteFrames.length > 0 ? m.deleteFrames[n - len0 - 1] + KEY_FX.ghost : Infinity,
  };
});

const twoLinesAt = (frame: number): number => {
  let v = 0;
  for (const w of TWO_LINE_WINDOWS) {
    if (!w || frame < w.grow) continue;
    if (frame < w.shrink) v = Math.max(v, easeInOut(clamp01((frame - w.grow) / PILL.growFrames)));
    else v = Math.max(v, 1 - easeInOut(clamp01((frame - w.shrink) / PILL.growFrames)));
  }
  return v;
};

const ARM_EVENTS: readonly { t: number; arm: boolean }[] = MESSAGE_TIMINGS.flatMap((m) => {
  const ev = [{ t: m.charFrames[0], arm: true }];
  if (m.deleteFrames.length > 0) ev.push({ t: m.deleteFrames[m.deleteFrames.length - 1], arm: false });
  return ev;
}).sort((a, b) => a.t - b.t);

const sendArmedAt = (frame: number): number => {
  let last: { t: number; arm: boolean } | null = null;
  for (const e of ARM_EVENTS) {
    if (e.t <= frame) last = e;
    else break;
  }
  if (!last) return 0;
  const r = easeInOut(clamp01((frame - last.t) / KEY_FX.arm));
  return last.arm ? r : 1 - r;
};

// ───────────────────────── estado
export type Ghost = { readonly char: string; readonly age: number; readonly opacity: number };

export type ChatState = {
  readonly frame: number;
  /** índice (0–2) del mensaje que está en el campo (o del último en escribirse) */
  readonly message: number;
  /** cantidad de caracteres visibles (== visibleChars(message, frame) de typing.ts) */
  readonly visible: number;
  /** texto visible por línea del campo */
  readonly lines: readonly [string, string];
  /** línea donde está el cursor */
  readonly cursorLine: 0 | 1;
  /** 0 → campo de 1 línea, 1 → campo de 2 líneas (animado) */
  readonly twoLines: number;
  /** resalte 0–1 de cada tecla (solo las que tienen > 0) */
  readonly keys: Readonly<Record<KeyId, number>>;
  /** tecla más resaltada (null si ninguna) */
  readonly activeKey: KeyId | null;
  /** ⌫: intensidad total 0–1 y sus componentes */
  readonly backspace: number;
  readonly backspaceHold: number;
  readonly backspacePulse: number;
  /** 0 → enviar apagado (gris), 1 → armado (hay texto). NUNCA se presiona. */
  readonly sendArmed: number;
  /** ¿lo dibuja el chat? (hasta CURSOR_HANDOFF; desde ahí lo dibuja el hilo) */
  readonly cursorVisible: boolean;
  readonly cursorOpacity: number;
  /** caracteres recién borrados que se desvanecen por línea (a la derecha del cursor) */
  readonly ghosts: readonly [readonly Ghost[], readonly Ghost[]];
};

export const chatStateAt = (frame: number): ChatState => {
  const { index, chars: visible } = activeMessage(frame);
  const timing = MESSAGE_TIMINGS[index];
  const chars = Array.from(timing.text);
  const n = chars.length;
  const len0 = Array.from(MESSAGES[index].lines[0]).length;

  const line0 = chars.slice(0, Math.min(visible, len0)).join("");
  const line1 = visible > len0 + 1 ? chars.slice(len0 + 1, visible).join("") : "";
  const twoLines = twoLinesAt(frame);
  // al tipear el espacio entre líneas el campo empieza a crecer: el cursor baja a la 2.ª línea cuando ya hay lugar
  const cursorLine: 0 | 1 = visible >= len0 + 1 && twoLines >= 0.5 ? 1 : 0;

  const keys: Record<KeyId, number> = {};
  for (const k of KEYS) {
    if (k.id === "back") continue;
    const v = keyIntensity(k.id, frame);
    if (v > 0.001) keys[k.id] = v;
  }
  const { hold, pulse } = backspaceParts(frame);
  const backspace = Math.min(1, 0.58 * hold + 0.42 * pulse);
  if (backspace > 0.001) keys.back = backspace;

  let activeKey: KeyId | null = null;
  let best = 0;
  for (const [id, v] of Object.entries(keys)) {
    // ⇧ solo es «la» tecla activa si no hay otra (la letra que desencadena es la importante)
    const score = id === "shift" ? v * 0.5 : v;
    if (score > best + 1e-9) {
      best = score;
      activeKey = id;
    }
  }

  const g0: Ghost[] = [];
  const g1: Ghost[] = [];
  timing.deleteFrames.forEach((df, k) => {
    const age = frame - df;
    if (age < 0 || age >= KEY_FX.ghost) return;
    const j = n - 1 - k;
    const ghost: Ghost = { char: chars[j], age, opacity: 0.45 * (1 - age / KEY_FX.ghost) };
    (j <= len0 ? g0 : g1).push(ghost);
  });
  // quedaron en orden de borrado (del final al principio): el flujo del texto las quiere de izquierda a derecha
  g0.reverse();
  g1.reverse();

  return {
    frame,
    message: index,
    visible,
    lines: [line0, line1],
    cursorLine,
    twoLines,
    keys,
    activeKey,
    backspace,
    backspaceHold: hold,
    backspacePulse: pulse,
    sendArmed: sendArmedAt(frame),
    cursorVisible: frame < CURSOR_HANDOFF,
    cursorOpacity: cursorOpacity(frame),
    ghosts: [g0, g1],
  };
};

// ───────────────────────── traspaso del cursor al hilo
/**
 * Ancho (px nativos, Montserrat 500 60 px) de «empezar…», medido con el motor de render. Respaldo para
 * cuando no hay DOM/fuente (scripts de Node). En el render real se mide en vivo con la fuente cargada.
 */
const ANCHOR_TEXT_WIDTH_FALLBACK = 310.08;

export type CursorAnchor = {
  /** borde izquierdo de la barra (px nativos 1080×1920) */
  readonly left: number;
  /** centro vertical de la barra */
  readonly cy: number;
  readonly w: number;
  readonly h: number;
  readonly top: number;
  /** centro horizontal de la barra */
  readonly cx: number;
  readonly color: string;
  /** false si se usó el ancho de respaldo (sin DOM/fuente) */
  readonly measured: boolean;
};

/**
 * Cursor en el fotograma final del mensaje 3 (el que sigue visible, sin enviar): pegado al último carácter
 * («…») de la 2.ª línea. El hilo arranca exactamente aquí (coordenadas NATIVAS de la pantalla del chat).
 */
export const getCursorAnchor = (): CursorAnchor => {
  const last = MESSAGES[MESSAGES.length - 1];
  const live = measureTextWidth(last.lines[last.lines.length - 1], PILL.fontSize, PILL.weight);
  const w = live ?? ANCHOR_TEXT_WIDTH_FALLBACK;
  const left = PILL.textLeft + w + CURSOR.gap;
  const cy = lineCenterY(1, 1) + CURSOR.dy;
  return {
    left,
    cy,
    w: CURSOR.w,
    h: CURSOR.h,
    top: cy - CURSOR.h / 2,
    cx: left + CURSOR.w / 2,
    color: COLORS.orange,
    measured: live !== null,
  };
};
