import { COLORS } from "../config/brand.ts";

/**
 * Geometría y paleta del chat de celular. Coordenadas NATIVAS de pantalla (1080×1920).
 * Módulo puro (sin React): lo usan la interfaz, `chatStateAt` y los agentes de mundo/hilo.
 *
 *   0 ─ barra de estado + cabecera ─ 296
 *   296 ─ hilo (mensaje RECIBIDO, mucho aire) ─ ~900
 *   ~914–1122 ─ campo de escritura (crece hacia arriba: 1 línea 140 px → 2 líneas 216 px)
 *   1170 ─ teclado ─ 1920
 */
export const CHAT_SCREEN = { w: 1080, h: 1920, radius: 90 } as const;

// ───────────────────────── color (derivados de la identidad, ver brand.ts)
const hex = (c: string): [number, number, number] => [
  parseInt(c.slice(1, 3), 16),
  parseInt(c.slice(3, 5), 16),
  parseInt(c.slice(5, 7), 16),
];
/** Mezcla lineal de dos colores #RRGGBB (t = 0 → a, t = 1 → b). */
export const mix = (a: string, b: string, t: number): string => {
  const [ar, ag, ab] = hex(a);
  const [br, bg, bb] = hex(b);
  const f = (x: number, y: number) => Math.round(x + (y - x) * t);
  const h = (n: number) => n.toString(16).padStart(2, "0");
  return `#${h(f(ar, br))}${h(f(ag, bg))}${h(f(ab, bb))}`;
};

export const CHAT_COLORS = {
  /** fondo del hilo (crema de marca) */
  thread: COLORS.cream,
  /** cabecera y burbuja recibida */
  surface: COLORS.surface,
  line: COLORS.surfaceLine,
  ink: COLORS.ink,
  inkSoft: COLORS.inkSoft,
  /** borde del campo de escritura (más firme que el del hilo: se lee como campo) */
  fieldBorder: mix(COLORS.surfaceLine, COLORS.ink, 0.28),
  /** fondo del teclado: gris cálido */
  keyboard: mix(COLORS.cream, COLORS.black, 0.1),
  keyboardEdge: mix(COLORS.cream, COLORS.black, 0.16),
  key: COLORS.surface,
  keyEdge: mix(COLORS.cream, COLORS.black, 0.27),
  keyFn: mix(COLORS.cream, COLORS.black, 0.17),
  keyFnEdge: mix(COLORS.cream, COLORS.black, 0.3),
  /** botón de enviar apagado / armado */
  sendOff: mix(COLORS.cream, COLORS.black, 0.1),
  sendOffIcon: mix(COLORS.cream, COLORS.black, 0.34),
  sendOn: COLORS.ink,
  /** acentos */
  orange: COLORS.orange,
  avatar: COLORS.purple,
  presence: COLORS.green,
} as const;

// ───────────────────────── cabecera
export const STATUS_BAR = { h: 100 } as const;
export const HEADER = {
  /** la barra de estado y la cabecera comparten fondo (0 → bottom) */
  bottom: 296,
  back: { cx: 78, cy: 196 },
  avatar: { cx: 204, cy: 196, d: 116 },
  /** nombre del contacto (CHAT.contact) */
  name: { x: 292, fontSize: 52, weight: 600 },
  presence: { d: 30 },
  actions: { videoCx: 842, kebabCx: 972, cy: 196 },
} as const;

// ───────────────────────── hilo (mensaje RECIBIDO)
export const THREAD = {
  avatar: { cx: 96, d: 64 },
  bubble: { left: 156, top: 408, fontSize: 56, weight: 500, padX: 40, padY: 32, radius: 54, tail: 12 },
} as const;

// ───────────────────────── campo de escritura
export const PILL = {
  x0: 36,
  x1: 1044,
  /** borde inferior fijo: el campo crece HACIA ARRIBA */
  bottom: 1122,
  h1: 140,
  h2: 216,
  radius: 70,
  border: 3,
  lineH: 76,
  fontSize: 60,
  weight: 500,
  /** x del borde izquierdo del texto */
  textLeft: 168,
  /** ancho máximo del texto (hasta el botón de enviar) */
  textMaxW: 732,
  plus: { cx: 100, d: 80 },
  send: { cx: 974, d: 100 },
  /** fotogramas que tarda el campo en crecer/encogerse una línea */
  growFrames: 6,
} as const;

/** Centro vertical de la línea `line` (0 | 1) con el campo en `twoLines` (0 → 1 línea, 1 → 2 líneas). */
export const lineCenterY = (line: 0 | 1, twoLines: number): number => {
  const h = PILL.h1 + (PILL.h2 - PILL.h1) * twoLines;
  const center = PILL.bottom - h / 2;
  const l0 = center - (PILL.lineH / 2) * twoLines;
  return line === 0 ? l0 : l0 + PILL.lineH;
};
/** Centro vertical de los íconos del campo (+ y enviar): alineados a la última línea, fijos. */
export const FIELD_ICON_CY = PILL.bottom - PILL.h1 / 2;

/** Cursor de escritura (barra naranja). */
export const CURSOR = {
  w: 6,
  h: 56,
  /** separación entre el último carácter y la barra */
  gap: 4,
  /** desplazamiento vertical respecto del centro de la línea (centra la barra sobre las minúsculas) */
  dy: 3,
} as const;

// ───────────────────────── teclado
export const KEYBOARD = {
  top: 1170,
  bottom: 1920,
  sideMargin: 14,
  gap: 10,
  keyW: 96.2,
  keyH: 130,
  rowGap: 24,
  rowsTop: 1204,
  radius: 24,
  letterSize: 50,
  homeBar: { cy: 1868, w: 300, h: 10 },
} as const;

export type KeyId = string;
export type KeyKind = "letter" | "shift" | "back" | "sym" | "comma" | "emoji" | "space" | "dot" | "enter";
export type KeyBox = {
  readonly id: KeyId;
  readonly kind: KeyKind;
  /** etiqueta (letras y símbolos con texto) */
  readonly label: string;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
};

const ROWS = ["QWERTYUIOP", "ASDFGHJKLÑ"] as const;

const buildKeys = (): readonly KeyBox[] => {
  const { sideMargin: m, gap, keyW: kw, keyH: kh, rowGap, rowsTop } = KEYBOARD;
  const inner = 1080 - 2 * m;
  const rowY = (r: number) => rowsTop + r * (kh + rowGap);
  const keys: KeyBox[] = [];

  // filas 1 y 2: 10 teclas iguales (Q…P / A…Ñ)
  ROWS.forEach((row, r) => {
    Array.from(row).forEach((ch, i) => {
      keys.push({ id: ch.toLowerCase(), kind: "letter", label: ch, x: m + i * (kw + gap), y: rowY(r), w: kw, h: kh });
    });
  });

  // fila 3: ⇧ Z X C V B N M ⌫ (⇧ y ⌫ anchas)
  const wide = (inner - 7 * kw - 8 * gap) / 2;
  keys.push({ id: "shift", kind: "shift", label: "", x: m, y: rowY(2), w: wide, h: kh });
  Array.from("ZXCVBNM").forEach((ch, i) => {
    keys.push({ id: ch.toLowerCase(), kind: "letter", label: ch, x: m + wide + gap + i * (kw + gap), y: rowY(2), w: kw, h: kh });
  });
  keys.push({ id: "back", kind: "back", label: "", x: 1080 - m - wide, y: rowY(2), w: wide, h: kh });

  // fila 4: ?123 , 😊 [espacio] . ↵
  const fn = 140;
  const space = inner - (2 * fn + 3 * kw) - 5 * gap;
  let x = m;
  const push = (id: KeyId, kind: KeyKind, label: string, w: number) => {
    keys.push({ id, kind, label, x, y: rowY(3), w, h: kh });
    x += w + gap;
  };
  push("sym", "sym", "?123", fn);
  push("comma", "comma", ",", kw);
  push("emoji", "emoji", "", kw);
  push("space", "space", "", space);
  push("dot", "dot", ".", kw);
  push("enter", "enter", "", fn);
  return keys;
};

export const KEYS: readonly KeyBox[] = buildKeys();
export const KEY_BY_ID: Readonly<Record<KeyId, KeyBox>> = Object.fromEntries(KEYS.map((k) => [k.id, k]));
/** Tecla de borrar (⌫): reconocible, grande, a la derecha de la fila 3. */
export const BACKSPACE_KEY: KeyBox = KEY_BY_ID.back;

/** Efecto de pulsación (fotogramas, no son tiempos de guion: duración del resalte). */
export const KEY_FX = {
  /** el resalte de una tecla cae suavemente en este número de fotogramas */
  press: 5,
  /** pulsación sostenida (p. ej. «…» = mantener «.») */
  longPress: 6,
  /** pulso de la tecla ⌫ por carácter borrado */
  backPulse: 4,
  /** la tecla ⌫ se «mantiene»: sube antes del primer borrado y baja después del último */
  backHoldIn: 3,
  backHoldOut: 8,
  /** ⇧ se enciende N fotogramas antes de la mayúscula */
  shiftLead: 3,
  /** hundimiento (px) y tinte naranja (0–1) a intensidad 1 */
  depth: 2,
  tint: 0.22,
  backDepth: 3,
  backTint: 0.62,
  /** el carácter borrado se desvanece (fantasma) en este número de fotogramas */
  ghost: 4,
  /** el botón de enviar se arma/apaga en este número de fotogramas */
  arm: 4,
} as const;
