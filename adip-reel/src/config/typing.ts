import { MESSAGES } from "./script.ts";
import { CURSOR_BLINK, MESSAGE_SPECS, type MessageSpec } from "./timeline.ts";
import { mulberry32 } from "../lib/rng.ts";

/**
 * Cronograma de tipeo determinista. Módulo PURO (sin React/Remotion): lo usan la animación
 * (qué texto se ve en cada fotograma) y el sintetizador de audio (cuándo suena cada tecla).
 */
export type KeyKind = "key" | "space" | "punct" | "backspace";

export type KeyEvent = {
  /** fotograma absoluto en que se oye/ve */
  readonly frame: number;
  readonly kind: KeyKind;
  readonly message: number;
  readonly char: string;
};

export type MessageTiming = {
  readonly text: string;
  readonly spec: MessageSpec;
  /** charFrames[i] = fotograma en que aparece el carácter i */
  readonly charFrames: readonly number[];
  /** deleteFrames[k] = fotograma en que desaparece el k-ésimo carácter borrado (desde el último al primero) */
  readonly deleteFrames: readonly number[];
};

const kindOf = (c: string): KeyKind => (c === " " ? "space" : /[.,;:!?¿¡…]/.test(c) ? "punct" : "key");

const buildMessage = (text: string, spec: MessageSpec): MessageTiming => {
  const chars = Array.from(text);
  const n = chars.length;
  const rnd = mulberry32(spec.seed);

  // Intervalos relativos con variación humana (letras "fluidas", espacios y puntuación un poco más lentos)
  const gaps: number[] = [];
  for (let i = 1; i < n; i++) {
    const base = 0.8 + rnd() * 0.55;
    const slow = chars[i - 1] === " " ? 0.35 : 0;
    gaps.push(base + slow);
  }
  const hes = new Map(spec.hesitations.map((h) => [h.afterChars, h.frames]));
  const totalSpan = spec.typeEnd - spec.start;
  const extra = spec.hesitations.reduce((a, h) => a + h.frames, 0);
  const typingSpan = Math.max(1, totalSpan - extra);
  const sum = gaps.reduce((a, b) => a + b, 0);
  const scale = typingSpan / sum;

  const charFrames: number[] = [spec.start];
  let t = spec.start;
  for (let i = 1; i < n; i++) {
    t += gaps[i - 1] * scale + (hes.get(i) ?? 0);
    charFrames.push(Math.round(t));
  }
  charFrames[n - 1] = spec.typeEnd;

  // Borrado: acelera (los primeros caracteres tardan más que los últimos), cada carácter se quita una vez
  const deleteFrames: number[] = [];
  if (spec.deleteStart !== null && spec.deleteEnd !== null) {
    const D = spec.deleteEnd - spec.deleteStart;
    for (let k = 0; k < n; k++) {
      const u = n === 1 ? 1 : k / (n - 1);
      deleteFrames.push(spec.deleteStart + Math.round(D * (1 - Math.pow(1 - u, 1.6))));
    }
  }
  return { text, spec, charFrames, deleteFrames };
};

export const MESSAGE_TIMINGS: readonly MessageTiming[] = MESSAGES.map((m, i) =>
  buildMessage(m.text, MESSAGE_SPECS[i]),
);

/** Cantidad de caracteres visibles del mensaje `i` en el fotograma `frame` (absoluto). */
export const visibleChars = (i: number, frame: number): number => {
  const m = MESSAGE_TIMINGS[i];
  let typed = 0;
  for (const f of m.charFrames) if (f <= frame) typed++;
  let deleted = 0;
  for (const f of m.deleteFrames) if (f <= frame) deleted++;
  return Math.max(0, typed - deleted);
};

/** Mensaje activo en el campo en `frame` (el que tiene caracteres visibles o el último en escribirse). */
export const activeMessage = (frame: number): { index: number; chars: number } => {
  for (let i = MESSAGE_TIMINGS.length - 1; i >= 0; i--) {
    if (frame >= MESSAGE_TIMINGS[i].spec.start) return { index: i, chars: visibleChars(i, frame) };
  }
  return { index: 0, chars: 0 };
};

/** Todos los eventos de teclado, ordenados (para sintetizar el audio de teclado). */
export const KEY_EVENTS: readonly KeyEvent[] = MESSAGE_TIMINGS.flatMap((m, mi) => {
  const chars = Array.from(m.text);
  const typed: KeyEvent[] = m.charFrames.map((frame, i) => ({ frame, kind: kindOf(chars[i]), message: mi, char: chars[i] }));
  const erased: KeyEvent[] = m.deleteFrames.map((frame, k) => ({
    frame,
    kind: "backspace" as const,
    message: mi,
    char: chars[chars.length - 1 - k],
  }));
  return [...typed, ...erased];
}).sort((a, b) => a.frame - b.frame);

/** Último fotograma (≤ frame) con actividad de teclado; -Infinity si aún no hubo ninguna. */
export const lastKeyFrame = (frame: number): number => {
  let last = -Infinity;
  for (const e of KEY_EVENTS) {
    if (e.frame <= frame) last = e.frame;
    else break;
  }
  return last;
};

/**
 * Opacidad del cursor (0–1): sólido mientras se escribe/borra; luego titila con fundidos suaves.
 * Determinista (solo depende del fotograma).
 */
export const cursorOpacity = (frame: number): number => {
  const { period, onFrames, fade, idleBeforeBlink } = CURSOR_BLINK;
  const last = lastKeyFrame(frame);
  const idle = frame - last;
  if (idle <= idleBeforeBlink) return 1;
  const p = (frame - (last + idleBeforeBlink)) % period;
  if (p < onFrames - fade) return 1;
  if (p < onFrames) return 1 - (p - (onFrames - fade)) / fade;
  if (p < period - fade) return 0;
  return (p - (period - fade)) / fade;
};
