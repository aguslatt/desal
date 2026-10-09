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

  // Borrado (brief v3): DESDE EL FINAL, un carácter por vez: cada carácter desaparece por completo en su fotograma
  // (nunca más de uno por fotograma ni por opacidad). Ritmo apenas creciente (de ≈ 1,9 a ≈ 1,2 f/carácter), normalizado a [deleteStart, deleteEnd].
  const deleteFrames: number[] = [];
  if (spec.deleteStart !== null && spec.deleteEnd !== null) {
    const D = spec.deleteEnd - spec.deleteStart;
    const w: number[] = [];
    for (let k = 0; k < n - 1; k++) w.push(1.9 - 0.7 * (n > 2 ? k / (n - 2) : 0));
    const sumW = w.reduce((x, y) => x + y, 0) || 1;
    let acc = 0;
    deleteFrames.push(spec.deleteStart);
    for (let k = 0; k < n - 1; k++) {
      acc += (w[k] / sumW) * D;
      const f = Math.max(deleteFrames[k] + 1, Math.round(spec.deleteStart + acc));
      deleteFrames.push(f);
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
  // Antes de la 1.ª tecla (last = -Infinity) el cursor titila desde el fotograma 0 (visible en el 0);
  // sin esto el cálculo daba NaN (opacity inválida → cursor sólido sin titilar).
  const started = Number.isFinite(last);
  if (started && frame - last <= idleBeforeBlink) return 1;
  const p = (frame - (started ? last + idleBeforeBlink : 0)) % period;
  if (p < onFrames - fade) return 1;
  if (p < onFrames) return 1 - (p - (onFrames - fade)) / fade;
  if (p < period - fade) return 0;
  return (p - (period - fade)) / fade;
};
