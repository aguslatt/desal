/**
 * GUION APROBADO — texto literal. No reescribir.
 * (scripts/check-script.mjs verifica que estos textos coincidan con el brief.)
 * Español rioplatense, voseo.
 */
export const HOOK = "¿Cuántas veces escribiste esto… y lo borraste?";

/**
 * Interfaz de chat (briefs v2/v3): contacto, mensaje RECIBIDO al comienzo y RESPUESTA que llega después de que la persona
 * envía «No sé por dónde empezar…» (centro emocional de la pieza: se sostiene ≥ 3 s).
 */
export const CHAT = {
  contact: "Amiga",
  received: "¿Cómo estás?",
  reply: "Estoy acá. Te escucho.",
} as const;

export type ChatMessage = {
  /** Texto literal del mensaje (lo que se tipea). */
  readonly text: string;
  /** Cortes de línea de diseño dentro del campo de escritura. lines.join(" ") === text. */
  readonly lines: readonly string[];
  /** Si true, el mensaje se borra al final (borrado carácter por carácter, desde el final); si false, se ENVÍA (brief v3). */
  readonly erased: boolean;
};

export const MESSAGES: readonly [ChatMessage, ChatMessage, ChatMessage] = [
  {
    text: "No me estoy sintiendo bien.",
    lines: ["No me estoy", "sintiendo bien."],
    erased: true,
  },
  {
    text: "¿Tenés un ratito para mí?",
    lines: ["¿Tenés un ratito", "para mí?"],
    erased: true,
  },
  {
    text: "No sé por dónde empezar…",
    lines: ["No sé por dónde", "empezar…"],
    erased: false,
  },
];

/** Escena 3 — frase de la locución, en dos momentos (tipografía animada), con pausa entre ambas. */
export const TURN = {
  first: "Podés empezar por ahí.",
  second: "Por no saber cómo empezar.",
  /** Cortes de línea de diseño. */
  firstLines: ["Podés empezar", "por ahí."],
  secondLines: ["Por no saber", "cómo empezar."],
} as const;

/** Escena 4 (brief v2) — texto en pantalla (sin locución). */
export const COMPANION_TEXT = "No tenés que pasar por esto en soledad.";
/** Cortes de línea de diseño: no es obligatorio usarlos. */
export const COMPANION_TEXT_LINES = ["No tenés que pasar", "por esto en soledad."] as const;

/** Escena 5 — locución y texto de la firma institucional (brief v3: frase COMPLETA y legible, en dos bloques; el 1.º queda visible cuando entra el 2.º). */
export const COMPANION_FULL =
  "En Equipo ADIP estamos para escucharte y acompañarte, a tu ritmo.";

export type SignatureBlock = {
  /** Texto literal del bloque. */
  readonly text: string;
  /** Cortes de línea de diseño. lines.join(" ") === text. */
  readonly lines: readonly string[];
  /** Palabras a destacar con moderación (contenidas en lines). */
  readonly emphasis: readonly string[];
};

export const SIGNATURE_BLOCKS: readonly [SignatureBlock, SignatureBlock] = [
  { text: "En Equipo ADIP estamos para escucharte", lines: ["En Equipo ADIP", "estamos para escucharte"], emphasis: ["escucharte"] },
  { text: "y acompañarte, a tu ritmo.", lines: ["y acompañarte,", "a tu ritmo."], emphasis: ["acompañarte", "a tu ritmo"] },
];

/** Escena 6 — cierre. */
export const CLOSING = {
  message: ["Si hoy te cuesta decirlo,", "podés compartir este video."],
  dateLine: "10 de octubre",
  campaign: "Día Mundial de la Salud Mental",
} as const;

/** Portada independiente. */
export const COVER = {
  title: "El mensaje que borraste",
  subtitle: "Día Mundial de la Salud Mental",
} as const;

/** Texto completo de locución (para grabar). Pronunciación de "ADIP" a confirmar con el equipo. */
export const VOICEOVER_TEXT =
  "Podés empezar por ahí. Por no saber cómo empezar. En Equipo ADIP estamos para escucharte y acompañarte, a tu ritmo.";
