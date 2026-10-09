import { Easing, interpolate } from "remotion";
import { CHAT, MESSAGES } from "../config/script.ts";
import { HOOK_TIMING, SEND_TIMING, TRANSITION_TIMING } from "../config/timeline.ts";
import { KEY_EVENTS, MESSAGE_TIMINGS, activeMessage, cursorOpacity } from "../config/typing.ts";
import {
  CURSOR,
  FIELD,
  HEADER,
  INDICATOR,
  KEYS,
  KEY_FX,
  MSG,
  RECEIVED_BUBBLE,
  REPLY_BUBBLE,
  SENT_BUBBLE,
  THREAD_FX,
  lineCenterY,
  type KeyId,
  type Rect,
} from "./geometry.ts";
import { measureTextWidth } from "./measure.ts";

/**
 * Estado visible del chat en un fotograma ABSOLUTO del reel (v3). Módulo PURO (sin React ni hooks): la interfaz lo dibuja tal cual
 * y sirve para verificar (texto visible, tecla activa, borrar, enviar, respuesta). Misma fuente que el audio de teclado:
 * KEY_EVENTS / MESSAGE_TIMINGS de config/typing.ts (no se cambian sus tiempos).
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
  until: m.deleteFrames[m.deleteFrames.length - 1],
}));

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const EASE_IO = Easing.bezier(0.5, 0, 0.2, 1);
const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);

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

// ───────────────────────── botón de enviar: gris (sin texto) → violeta (hay texto)
const ARM_EVENTS: readonly { t: number; arm: boolean }[] = MESSAGE_TIMINGS.flatMap((m) => {
  const ev = [{ t: m.charFrames[0], arm: true }];
  if (m.deleteFrames.length > 0) ev.push({ t: m.deleteFrames[m.deleteFrames.length - 1], arm: false });
  else ev.push({ t: SEND_TIMING.flyFrom, arm: false }); // el mensaje enviado deja el campo vacío
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

/** Pulsación de ENVIAR (0–1): hundimiento y destello solo entre pressFrom y pressTo. */
const sendPressAt = (frame: number): number => {
  const { pressFrom, pressTo } = SEND_TIMING;
  if (frame < pressFrom || frame >= pressTo) return 0;
  const p = (frame - pressFrom) / (pressTo - pressFrom);
  const peak = THREAD_FX.pressPeak;
  return p < peak ? easeOut(p / peak) : 1 - easeInOut((p - peak) / (1 - peak));
};

// ───────────────────────── rectángulos animados
export type BoxStyle = Rect & {
  /** radios de esquina: superior izq., superior der., inferior der., inferior izq. */
  readonly r: readonly [number, number, number, number];
};

/** Rectángulo de la burbuja ENVIADA en el tramo flyFrom→flyTo: del rectángulo del campo a su lugar en el hilo. */
export const sentBubbleBox = (t: number): BoxStyle & { readonly textX: number; readonly textY: number } => {
  const F = FIELD;
  const S = SENT_BUBBLE;
  return {
    x: lerp(F.x, S.x, t),
    y: lerp(F.y, S.y, t),
    w: lerp(F.w, S.w, t),
    h: lerp(F.h, S.h, t),
    r: [lerp(F.radius, S.radius, t), lerp(F.radius, S.radius, t), lerp(F.radius, S.tail, t), lerp(F.radius, S.radius, t)],
    // el texto conserva su tamaño (60/500): solo cambia su desplazamiento dentro del contenedor
    textX: lerp(F.textLeft - F.x, S.padX, t),
    textY: lerp(F.textTop - F.y, S.padY, t),
  };
};

/** Burbuja de «escribe» (puntos) → burbuja de RESPUESTA (g: 0 → 1). */
export const replyBubbleBox = (g: number): BoxStyle => {
  const I = INDICATOR;
  const R = REPLY_BUBBLE;
  return {
    x: R.x,
    y: R.y,
    w: lerp(I.w, R.w, g),
    h: lerp(I.h, R.h, g),
    r: [lerp(I.radius, R.radius, g), lerp(I.radius, R.radius, g), lerp(I.radius, R.radius, g), lerp(I.tail, R.tail, g)],
  };
};

// ───────────────────────── estado
export type ChatState = {
  readonly frame: number;

  /** pregunta de la campaña (S1): desplazamiento vertical (asienta / sale) y opacidad */
  readonly hook: { readonly shown: boolean; readonly dy: number; readonly opacity: number };

  /** índice (0–2) del mensaje que está en el campo (o del último en escribirse) */
  readonly message: number;
  /** caracteres escritos y NO borrados del mensaje activo (== visibleChars(message, frame) de typing.ts) */
  readonly typed: number;
  /** caracteres que muestra el CAMPO (== typed; 0 desde flyFrom: el mensaje enviado pasó a la burbuja) */
  readonly visible: number;
  /** texto del campo por línea */
  readonly lines: readonly [string, string];
  /** línea donde está el cursor (justo después del último carácter visible, también si es el espacio de fin de línea) */
  readonly cursorLine: 0 | 1;
  /** ¿se dibuja el cursor? (no desde el envío) y su opacidad (sólido al teclear/borrar, titila en pausa) */
  readonly cursorShown: boolean;
  readonly cursorOpacity: number;

  /** resalte 0–1 de cada tecla (solo las que tienen > 0) */
  readonly keys: Readonly<Record<KeyId, number>>;
  /** tecla más resaltada (null si ninguna) */
  readonly activeKey: KeyId | null;
  /** ⌫: intensidad total 0–1 y sus componentes (mantenida durante la ráfaga / pulso por carácter) */
  readonly backspace: number;
  readonly backspaceHold: number;
  readonly backspacePulse: number;
  /** 0 → enviar inactivo (gris), 1 → armado (hay texto) */
  readonly sendArmed: number;
  /** 0–1: hundimiento/destello de ENVIAR (solo pressFrom→pressTo) */
  readonly sendPress: number;

  /** envío: «idle» (aún no) · «press» (se pulsa) · «fly» (el texto pasa a la burbuja) · «sent» (burbuja en su lugar) */
  readonly send: { readonly phase: "idle" | "press" | "fly" | "sent"; readonly fly: number; readonly shown: boolean; readonly box: ReturnType<typeof sentBubbleBox> };
  /** «Amiga escribe»: tres puntos animados por fotograma */
  readonly indicator: { readonly shown: boolean; readonly pop: number; readonly dots: readonly [number, number, number] };
  /** respuesta: 0 → no existe, 1 → estable; la burbuja crece de los puntos a su tamaño */
  readonly reply: { readonly shown: boolean; readonly grow: number; readonly text: number; readonly dotsOpacity: number; readonly box: BoxStyle; readonly stable: boolean };

  /** salida de la interfaz (TRANSITION_TIMING.from → chatExitTo): 0 → 1 */
  readonly exit: {
    readonly header: number;
    readonly bottom: number;
    readonly bubbles: number;
    /** desplazamientos en px que se aplican a cada capa */
    readonly headerDy: number;
    readonly bottomDy: number;
    readonly receivedDx: number;
    readonly sentDx: number;
    readonly bubbleOpacity: number;
  };
};

export const chatStateAt = (frame: number): ChatState => {
  // pregunta de la campaña
  const settle = interpolate(frame, [0, HOOK_TIMING.settle], [0, 1], { ...CLAMP, easing: EASE_OUT });
  const hookExit = interpolate(frame, [HOOK_TIMING.exitFrom, HOOK_TIMING.exitTo], [0, 1], { ...CLAMP, easing: Easing.bezier(0.5, 0, 0.9, 0.6) });
  const hook = {
    shown: frame < HOOK_TIMING.exitTo,
    dy: (1 - settle) * THREAD_FX.hookSettlePx - hookExit * THREAD_FX.hookExitPx,
    opacity: 1 - hookExit,
  };

  // campo
  const { index, chars: typed } = activeMessage(frame);
  const sentGone = frame >= SEND_TIMING.flyFrom;
  const visible = sentGone && index === MESSAGES.length - 1 ? 0 : typed;
  const chars = Array.from(MESSAGES[index].text);
  const len0 = Array.from(MESSAGES[index].lines[0]).length;
  const line0 = chars.slice(0, Math.min(visible, len0)).join("");
  // el espacio entre líneas es parte de la 1.ª línea (queda al final); la 2.ª empieza con el carácter siguiente
  const line0Full = visible === len0 + 1 ? chars.slice(0, len0 + 1).join("") : line0;
  const line1 = visible > len0 + 1 ? chars.slice(len0 + 1, visible).join("") : "";
  const cursorLine: 0 | 1 = visible > len0 + 1 ? 1 : 0;

  // teclas
  const keys: Record<KeyId, number> = {};
  for (const k of KEYS) {
    if (k.id === "back") continue;
    const v = keyIntensity(k.id, frame);
    if (v > 0.001) keys[k.id] = v;
  }
  const { hold, pulse } = backspaceParts(frame);
  const backspace = Math.min(1, 0.6 * hold + 0.4 * pulse);
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

  // envío
  const { pressFrom, flyFrom, flyTo, indicatorFrom, replyIn } = SEND_TIMING;
  const fly = interpolate(frame, [flyFrom, flyTo], [0, 1], { ...CLAMP, easing: EASE_IO });
  const phase = frame < pressFrom ? "idle" : frame < flyFrom ? "press" : frame < flyTo ? "fly" : "sent";

  // «Amiga escribe»
  const iShown = frame >= indicatorFrom;
  const t0 = frame - indicatorFrom;
  const dot = (i: number) => {
    const ph = (t0 / THREAD_FX.dotsPeriod) * Math.PI * 2 - i * 0.95;
    const s = Math.max(0, Math.sin(ph));
    return Math.pow(s, 1.3);
  };

  // respuesta
  const grow = interpolate(frame, [replyIn, replyIn + THREAD_FX.replyGrow], [0, 1], { ...CLAMP, easing: EASE_OUT });
  const replyText = interpolate(frame, [replyIn + THREAD_FX.replyTextFrom, replyIn + THREAD_FX.replyTextTo], [0, 1], CLAMP);

  // salida de la interfaz
  const { from: exFrom, chatExitTo } = TRANSITION_TIMING;
  const exitHeader = interpolate(frame, [exFrom, exFrom + 22], [0, 1], { ...CLAMP, easing: EASE_IO });
  const exitBubbles = interpolate(frame, [exFrom, exFrom + 20], [0, 1], { ...CLAMP, easing: EASE_IO });
  const exitBottom = interpolate(frame, [exFrom + 4, chatExitTo], [0, 1], { ...CLAMP, easing: EASE_IO });

  return {
    frame,
    hook,
    message: index,
    typed,
    visible,
    lines: [line0Full, line1],
    cursorLine,
    cursorShown: !sentGone,
    cursorOpacity: cursorOpacity(frame),
    keys,
    activeKey,
    backspace,
    backspaceHold: hold,
    backspacePulse: pulse,
    sendArmed: sendArmedAt(frame),
    sendPress: sendPressAt(frame),
    send: { phase, fly, shown: sentGone, box: sentBubbleBox(fly) },
    indicator: {
      shown: iShown && frame < replyIn + THREAD_FX.replyGrow,
      pop: interpolate(frame, [indicatorFrom, indicatorFrom + THREAD_FX.indicatorPop], [0, 1], { ...CLAMP, easing: EASE_OUT }),
      dots: [dot(0), dot(1), dot(2)],
    },
    reply: {
      shown: frame >= replyIn,
      grow,
      text: replyText,
      dotsOpacity: 1 - interpolate(frame, [replyIn, replyIn + 4], [0, 1], CLAMP),
      box: replyBubbleBox(grow),
      stable: frame >= replyIn + THREAD_FX.replyGrow,
    },
    exit: {
      header: exitHeader,
      bottom: exitBottom,
      bubbles: exitBubbles,
      headerDy: -exitHeader * (HEADER.bottom + 12),
      bottomDy: exitBottom * (1920 - FIELD.y + 12),
      receivedDx: -exitBubbles * (RECEIVED_BUBBLE.x + RECEIVED_BUBBLE.w + 60),
      sentDx: exitBubbles * (1080 - SENT_BUBBLE.x + 60),
      bubbleOpacity: 1 - exitBubbles,
    },
  };
};

// ───────────────────────── cursor
export type CursorBox = {
  /** esquina superior izquierda y tamaño de la barra (px nativos 1080×1920) */
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly line: 0 | 1;
  readonly opacity: number;
  /** ¿se dibuja? (false desde el envío) */
  readonly shown: boolean;
  /** x del borde derecho del último carácter visible (texto de la línea con el cursor) */
  readonly textRight: number;
  /** false si se usó un ancho aproximado (sin DOM/fuente) */
  readonly measured: boolean;
};

const APPROX_CHAR_W = 34.6;

/** Caja del cursor en `frame`: pegada al último carácter visible (misma medida de texto que el DOM: canvas 2D con Montserrat). */
export const getCursorBox = (frame: number): CursorBox => {
  const s = chatStateAt(frame);
  const text = s.lines[s.cursorLine];
  const live = text === "" ? 0 : measureTextWidth(text, MSG.fontSize, MSG.weight);
  const w = live ?? text.length * APPROX_CHAR_W;
  const textRight = FIELD.textLeft + w;
  const cy = lineCenterY(s.cursorLine) + CURSOR.dy;
  return {
    x: textRight + CURSOR.gap,
    y: cy - CURSOR.h / 2,
    w: CURSOR.w,
    h: CURSOR.h,
    line: s.cursorLine,
    opacity: s.cursorOpacity,
    shown: s.cursorShown,
    textRight,
    measured: live !== null,
  };
};

/** Las dos líneas de la respuesta «Estoy acá. Te escucho.» (una por oración, de CHAT.reply). */
export const REPLY_LINES: readonly string[] = CHAT.reply.split(/(?<=\.)\s+/);
