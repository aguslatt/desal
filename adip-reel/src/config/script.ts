/**
 * GUION APROBADO — texto literal. No reescribir.
 * (scripts/check-script.mjs verifica que estos textos coincidan con el brief.)
 * Español rioplatense, voseo.
 */
export const HOOK = "¿Cuántas veces escribiste esto… y lo borraste?";

export type ChatMessage = {
  /** Texto literal del mensaje (lo que se tipea). */
  readonly text: string;
  /** Cortes de línea de diseño dentro del campo de escritura. lines.join(" ") === text. */
  readonly lines: readonly string[];
  /** Si true, el mensaje se borra al final; si false, queda sin enviar. */
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

/** Escena 3 — frase dicha a cámara (versión alternativa: tipografía animada). Dos oraciones, con pausa entre ambas. */
export const TURN = {
  first: "Podés empezar por ahí.",
  second: "Por no saber cómo empezar.",
  /** Cortes de línea de diseño. */
  firstLines: ["Podés empezar", "por ahí."],
  secondLines: ["Por no saber", "cómo empezar."],
} as const;

/** Escena 4 — locución y subtítulos exactos. Unidades de sentido (máx. 2 líneas simultáneas). */
export const COMPANION_FULL =
  "En Equipo ADIP estamos para escucharte y acompañarte, a tu ritmo.";

export type SubtitleUnit = {
  readonly lines: readonly string[];
  /** Palabras a destacar con moderación (contenidas en lines). */
  readonly emphasis: readonly string[];
};

export const COMPANION_UNITS: readonly SubtitleUnit[] = [
  { lines: ["En Equipo ADIP", "estamos para escucharte"], emphasis: ["escucharte"] },
  { lines: ["y acompañarte,"], emphasis: ["acompañarte"] },
  { lines: ["a tu ritmo."], emphasis: ["a tu ritmo"] },
];

/** Escena 5 — cierre. */
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
