import { COLORS, ROLE, TYPE } from "../config/brand.ts";

/**
 * Geometría y paleta del chat de celular (v3). Coordenadas NATIVAS de pantalla (1080×1920), pantalla completa y ESTÁTICA.
 * Módulo puro (sin React): lo usan la interfaz, `chatStateAt` y el agente de montaje (REPLY_BUBBLE / REPLY_TEXT).
 *
 *   0 ─ encabezado naranja plano (íconos de estado, sin isla) ─ 272
 *   272 ─ hilo (papel gris): «¿Cómo estás?», pregunta de la campaña (S1), burbuja enviada, respuesta ─ 1062
 *   1062–1262 ─ campo de escritura BLANCO de tamaño FIJO (2 líneas), vacío o lleno mide lo mismo
 *   1290 ─ teclado (utilería «apagada»: fondo casi papel, teclas blancas, tinta gris) ─ 1920
 *
 * Jerarquía visual (decisiones de la revisión de composición): 1) pregunta / texto del campo, 2) mensaje recibido, 3) resto de la UI.
 * El eje izquierdo único es x = 120: texto de la burbuja recibida, pregunta de la campaña y texto de la respuesta.
 */
export const CHAT_SCREEN = { w: 1080, h: 1920 } as const;

// ───────────────────────── color: paleta oficial + neutros derivados del gris/negro
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
  /** papel del hilo (gris del manual) */
  paper: ROLE.paper,
  text: ROLE.text,
  /** encabezado y burbujas RECIBIDAS de «Amiga» (texto negro: 8,3:1) */
  header: COLORS.orange,
  received: COLORS.orange,
  /** burbujas ENVIADAS (texto blanco: 7,6:1) */
  sent: COLORS.purple,
  sentText: COLORS.white,
  /** campo de escritura (blanco) y su borde */
  field: COLORS.white,
  fieldBorder: mix(COLORS.grey, COLORS.black, 0.16),
  fieldIcon: mix(COLORS.grey, COLORS.black, 0.58),
  /**
   * Cursor de escritura: VIOLETA. El naranja (#FE801C) sobre el campo blanco solo alcanza 2,5:1 (< 3:1 de un elemento gráfico);
   * el violeta #8A00B7 sobre blanco da 7,6:1 y es el color de lo «mío» (lo que se escribe y se envía).
   */
  cursor: COLORS.purple,
  /**
   * Teclado: es utilería, no mensaje. Ocupa un tercio del cuadro con ~40 letras de casi el mismo cuerpo que el texto del campo, así que
   * se «apaga»: fondo apenas más oscuro que el papel, teclas blancas con borde inferior tenue y tinta gris (6,9:1 sobre blanco; la
   * misma familia de gris del isologotipo). La tecla pulsada recupera la tinta negra y el tinte naranja: lo único que se enciende.
   */
  keyboard: mix(COLORS.grey, COLORS.black, 0.05),
  keyboardEdge: mix(COLORS.grey, COLORS.black, 0.1),
  key: COLORS.white,
  keyEdge: mix(COLORS.grey, COLORS.black, 0.15),
  keyFn: mix(COLORS.grey, COLORS.black, 0.09),
  keyFnEdge: mix(COLORS.grey, COLORS.black, 0.19),
  keyInk: mix(COLORS.black, COLORS.grey, 0.38),
  /** botón de enviar inactivo (gris) / activo (violeta) */
  sendOff: mix(COLORS.grey, COLORS.black, 0.1),
  sendOffIcon: mix(COLORS.grey, COLORS.black, 0.4),
  sendOn: COLORS.purple,
  presence: COLORS.green,
  orange: COLORS.orange,
  white: COLORS.white,
  black: COLORS.black,
} as const;

// ───────────────────────── encabezado
export const STATUS_BAR = {
  /** íconos (sin texto) alineados a la derecha; sin «isla» negra: era la mancha más oscura del cuadro y no dice nada de la historia */
  icons: { cy: 54, right: 1024 },
} as const;
export const HEADER = {
  /** barra de estado y encabezado comparten el naranja (0 → bottom) */
  bottom: 272,
  cy: 190,
  back: { cx: 74 },
  avatar: { cx: 190, d: 112 },
  /** «Amiga» (CHAT.contact): TYPE.body (52) en Bold */
  name: { x: 272, fontSize: TYPE.body.size, weight: 700 },
  presence: { d: 30, ring: 6 },
  actions: { videoCx: 862, kebabCx: 990 },
} as const;

// ───────────────────────── hilo
/** Línea de texto del chat: TYPE.message (60/500), interlineado fijo de 77 px (60 × 1,28 redondeado). */
export const MSG = {
  fontSize: TYPE.message.size,
  weight: TYPE.message.weight,
  lineH: Math.round(TYPE.message.size * TYPE.message.lineHeight),
} as const;

export const BUBBLE = { radius: 46, tail: 14, padX: 44, padY: 28 } as const;

/**
 * Anchos de texto Montserrat medidos con el motor de render (px nativos). Respaldo cuando no hay DOM/fuente (Node);
 * en el render real las medidas salen en vivo de measure.ts.
 */
export const TEXT_W = {
  received: 418, // «¿Cómo estás?» 60/500
  sentLine: 504, // «No sé por dónde» 60/500 (línea más ancha de M3)
  replyLine: 413, // «Te escucho.» 68/700 (línea más ancha de la respuesta)
  hookWrap: 800, // ancho de ajuste de la pregunta (display 88/800)
} as const;

export type Rect = { readonly x: number; readonly y: number; readonly w: number; readonly h: number };

/**
 * Relleno de las burbujas de «Amiga»: 72 px a la izquierda, como la respuesta (REPLY_PAD.x), de modo que el TEXTO recibido arranca en
 * x = 120, el mismo eje que la pregunta de la campaña y que «Estoy acá. / Te escucho.»: una sola alineación izquierda en todo el hilo.
 */
export const RECEIVED_PAD = { x: 72, y: BUBBLE.padY } as const;

/** Mensaje RECIBIDO «¿Cómo estás?»: arriba a la izquierda del hilo. */
export const RECEIVED_BUBBLE: Rect & { readonly radius: number; readonly tail: number } = {
  x: 48,
  y: 316,
  w: TEXT_W.received + 2 * RECEIVED_PAD.x,
  h: MSG.lineH + 2 * RECEIVED_PAD.y,
  radius: BUBBLE.radius,
  tail: BUBBLE.tail,
};

/**
 * Pregunta de la campaña (HOOK) en TYPE.display, alineada a la izquierda en x = 120 (como el resto de los titulares), 3 líneas.
 * y = 590: centro óptico del hueco libre del hilo entre el mensaje recibido (termina en y 449) y el campo (empieza en y 1062): 141 px de
 * aire arriba y 187 abajo, en vez de pegada a la burbuja (71 / 257) como antes.
 */
export const HOOK_BOX = {
  x: 120,
  y: 590,
  w: TEXT_W.hookWrap,
  lines: 3,
  fontSize: TYPE.display.size,
  weight: TYPE.display.weight,
  lineHeightPx: TYPE.display.size * TYPE.display.lineHeight,
  letterSpacing: TYPE.display.letterSpacing,
} as const;

/** Burbuja ENVIADA (violeta, derecha del hilo), con las 2 líneas de M3 y el mismo cuerpo de texto que el campo. */
export const SENT_BUBBLE: Rect & { readonly radius: number; readonly tail: number; readonly padX: number; readonly padY: number } = {
  x: CHAT_SCREEN.w - 48 - (TEXT_W.sentLine + 2 * BUBBLE.padX),
  y: RECEIVED_BUBBLE.y + RECEIVED_BUBBLE.h + 40,
  w: TEXT_W.sentLine + 2 * BUBBLE.padX,
  h: 2 * MSG.lineH + 2 * BUBBLE.padY,
  radius: BUBBLE.radius,
  tail: BUBBLE.tail,
  padX: BUBBLE.padX,
  padY: BUBBLE.padY,
};

/**
 * Burbuja enviada al despegar del campo (f712): píldora violeta OPACA que envuelve el texto justo donde estaba (el texto no se mueve ni
 * cambia de tamaño en el primer fotograma). Relleno inicial (px); durante el vuelo crece hasta BUBBLE.padX / padY.
 */
export const SENT_FLY = { padX: 28, padY: 8 } as const;

/** Indicador «Amiga escribe» (tres puntos): nace en la esquina de la futura respuesta. */
export const REPLY_PAD = { x: 72, y: 50 } as const;
const REPLY_LINE_H = TYPE.title.size * TYPE.title.lineHeight; // 77,52
const REPLY_Y = SENT_BUBBLE.y + SENT_BUBBLE.h + 40;

/**
 * BURBUJA DE RESPUESTA «Estoy acá. Te escucho.» (centro emocional): rectángulo exacto (px nativos 1080×1920) para que el montaje
 * haga crecer el naranja desde ella. El texto arranca en x = 120 (= TURN_ANCHOR.x).
 */
export const REPLY_BUBBLE = {
  x: 48,
  y: REPLY_Y,
  w: Math.ceil(TEXT_W.replyLine + 2 * REPLY_PAD.x),
  h: Math.ceil(2 * REPLY_LINE_H + 2 * REPLY_PAD.y),
  radius: 54,
  /** radio de la esquina inferior izquierda (la «cola») */
  tail: 16,
  color: COLORS.orange,
} as const;

/** Origen y estilo del TEXTO de la respuesta (esquina superior izquierda del bloque de 2 líneas). */
export const REPLY_TEXT = {
  x: REPLY_BUBBLE.x + REPLY_PAD.x,
  y: REPLY_BUBBLE.y + REPLY_PAD.y,
  fontSize: TYPE.title.size,
  fontWeight: TYPE.title.weight,
  /** relación (TYPE.title.lineHeight) y px (68 × 1,14 = 77,52) */
  lineHeight: TYPE.title.lineHeight,
  lineHeightPx: REPLY_LINE_H,
  letterSpacing: TYPE.title.letterSpacing,
  color: COLORS.black,
  /** el texto de la respuesta se parte en dos líneas por oración (CHAT.reply) */
  lines: 2,
} as const;

/** Burbuja de «escribiendo…»: mismo origen que la respuesta; se transforma/crece en ella. */
export const INDICATOR = { x: REPLY_BUBBLE.x, y: REPLY_BUBBLE.y, w: 176, h: 100, radius: 50, tail: 16, dot: 20, spacing: 44 } as const;

// ───────────────────────── campo de escritura (FIJO: 2 líneas, vacío o lleno mide lo mismo)
export const FIELD = {
  x: 36,
  y: 1062,
  w: 1008,
  h: 200,
  radius: 64,
  border: 3,
  /** x del borde izquierdo del texto y ancho máximo (hasta el botón de enviar) */
  textLeft: 168,
  textMaxW: 740,
  /** primer renglón del bloque de 2 líneas, centrado en el campo */
  textTop: 1062 + (200 - 2 * MSG.lineH) / 2,
  plus: { cx: 104, size: 46 },
  send: { cx: 976, d: 104 },
} as const;
export const FIELD_CY = FIELD.y + FIELD.h / 2;
/** Centro vertical de la línea `line` (0 | 1) del campo. */
export const lineCenterY = (line: 0 | 1): number => FIELD.textTop + MSG.lineH * (line + 0.5);

/** Cursor de escritura (barra violeta ~8×58 pegada al último carácter). */
export const CURSOR = {
  w: 8,
  h: 58,
  /** separación entre el último carácter y la barra */
  gap: 3,
  /** desplazamiento vertical respecto del centro de la línea (centra la barra sobre ascendentes/descendentes) */
  dy: 2,
  radius: 3,
} as const;

// ───────────────────────── teclado
export const KEYBOARD = {
  top: 1290,
  bottom: 1920,
  side: 14,
  gap: 10,
  keyW: 96.2,
  keyH: 118,
  rowGap: 22,
  rowsTop: 1318,
  radius: 22,
  letterSize: 44,
  homeBar: { cy: 1890, w: 300, h: 10 },
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
  const { side: m, gap, keyW: kw, keyH: kh, rowGap, rowsTop } = KEYBOARD;
  const inner = CHAT_SCREEN.w - 2 * m;
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
  keys.push({ id: "back", kind: "back", label: "", x: CHAT_SCREEN.w - m - wide, y: rowY(2), w: wide, h: kh });

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

/** Efectos de pulsación y de interfaz (duraciones de acabado en fotogramas; no son tiempos de guion). */
export const KEY_FX = {
  /** el resalte de una tecla cae suave en este número de fotogramas */
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
  /** hundimiento (px) y tinte naranja (0–1) a intensidad 1: sutil (≤ 25 %) */
  depth: 2,
  tint: 0.22,
  backDepth: 3,
  backTint: 0.3,
  /** el botón de enviar se arma/apaga en este número de fotogramas */
  arm: 4,
} as const;

/** Efectos del hilo (fotogramas). La respuesta queda estable desde replyIn + grow. */
export const THREAD_FX = {
  /** el indicador «escribe» entra en N fotogramas */
  indicatorPop: 6,
  /** período (fotogramas) del rebote de los tres puntos */
  dotsPeriod: 21,
  /** la burbuja de puntos crece hasta la respuesta en N fotogramas (el texto aparece dentro) */
  replyGrow: 10,
  replyTextFrom: 3,
  replyTextTo: 8,
  /** pulsación del botón: pico a este porcentaje de pressFrom→pressTo */
  pressPeak: 0.4,
  /** el hook asienta con un desplazamiento de N px */
  hookSettlePx: 12,
  /** el hook sale con un desplazamiento hacia arriba de N px */
  hookExitPx: 40,
} as const;
