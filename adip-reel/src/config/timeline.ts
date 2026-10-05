/**
 * Cronograma central (30 fps, 1050 fotogramas = 35 s). Fuente única de tiempos
 * para animación, subtítulos y audio (scripts/build-audio.ts lee este mismo archivo).
 * Todos los valores son fotogramas ABSOLUTOS del reel salvo que se indique lo contrario.
 */
export const FPS = 30;
export const TOTAL_FRAMES = 1050;
export const sec = (s: number) => Math.round(s * FPS);

/** Ventanas de escena según el brief. Cada escena puede extender su salida unos fotogramas (tail) solapando la siguiente. */
export const SCENES = {
  s1: { from: 0, to: 90 }, //   00:00–00:03 El inicio
  s2: { from: 90, to: 420 }, // 00:03–00:14 Los mensajes
  s3: { from: 420, to: 630 }, // 00:14–00:21 El giro
  s4: { from: 630, to: 840 }, // 00:21–00:28 El acompañamiento
  s5: { from: 840, to: 1050 }, // 00:28–00:35 El cierre
} as const;

/** Solape de salida/entrada entre escenas (fotogramas). */
export const OVERLAP = 12;

/** Gancho (escena 1): entra en el fotograma 0 ya legible (asienta en ~10 f) y sale al final de la ventana. */
export const HOOK_TIMING = { settle: 10, exitFrom: 74, exitTo: 96 } as const;

/**
 * Escena 2 — escritura. Por mensaje:
 *  start → typeEnd: se tipea; typeEnd → deleteStart: se sostiene completo (~1 s en 1 y 2);
 *  deleteStart → deleteEnd: se borra (aceleración, estilo "mantener borrar"). El mensaje 3 queda.
 *  hesitations: pausas humanas (dudas) tras N caracteres tipeados.
 */
export type MessageSpec = {
  readonly start: number;
  readonly typeEnd: number;
  readonly deleteStart: number | null;
  readonly deleteEnd: number | null;
  readonly hesitations: readonly { readonly afterChars: number; readonly frames: number }[];
  readonly seed: number;
};

export const MESSAGE_SPECS: readonly [MessageSpec, MessageSpec, MessageSpec] = [
  // 00:03–00:06.5  "No me estoy sintiendo bien."  → sostiene ~0,95 s y borra
  { start: 99, typeEnd: 152, deleteStart: 180, deleteEnd: 195, hesitations: [{ afterChars: 12, frames: 4 }], seed: 11 },
  // 00:06.5–00:10  "¿Tenés un ratito para mí?"   → sostiene 1 s y borra
  { start: 202, typeEnd: 255, deleteStart: 285, deleteEnd: 300, hesitations: [{ afterChars: 17, frames: 5 }], seed: 23 },
  // 00:10–00:14    "No sé por dónde empezar…"    → queda sin enviar; duda antes de "empezar…"
  { start: 307, typeEnd: 364, deleteStart: null, deleteEnd: null, hesitations: [{ afterChars: 16, frames: 11 }], seed: 37 },
];

/** Pausa perceptible con el cursor titilando (typeEnd del msg 3 → HANDOFF) ≈ 1,5 s. */
export const CURSOR_HANDOFF = 410;

/** Cursor: parpadeo (período en fotogramas), activo "sólido" mientras se escribe/borra. */
export const CURSOR_BLINK = { period: 32, onFrames: 18, fade: 3, idleBeforeBlink: 9 } as const;

/** Escena 3 — dos momentos (fotogramas absolutos). Pausa entre oraciones ≈ 1,2 s. */
export const TURN_TIMING = {
  firstIn: 452,
  secondIn: 540,
  exitFrom: 618,
} as const;

/** Escena 4 — subtítulos por unidad de sentido: [inicio, fin] absolutos (máx. 2 líneas simultáneas). */
export const COMPANION_TIMING = {
  mediaIn: 640,
  units: [
    { from: 656, to: 742 },
    { from: 742, to: 792 },
    { from: 792, to: 838 },
  ],
} as const;

/** Escena 5 — cierre; todo visible desde `allVisible` hasta el último fotograma (≥ 3 s). */
export const CLOSING_TIMING = {
  messageIn: 864,
  logoIn: 912,
  dateIn: 940,
  allVisible: 958,
} as const;

/** Movimientos del hilo gráfico (fotogramas absolutos). */
export const THREAD_TIMING = {
  /** el cursor se estira hasta ser línea horizontal: [inicio, fin] */
  bornFrom: CURSOR_HANDOFF,
  bornTo: 450,
  /** carril escena 3 → 4 (baja) */
  descendFrom: 622,
  descendTo: 652,
  /** carril escena 4 → 5 (sube) */
  riseFrom: 832,
  riseTo: 864,
  /** llegada al logo: la línea se recoge y cierra */
  arriveFrom: 912,
  arriveTo: 950,
} as const;

/**
 * Hitos de sonido que el diseño visual debe respetar y que build-audio sintetiza.
 * (frame absoluto; el audio se renderiza ya alineado al reel en stems de 35 s.)
 */
export const SFX_CUES = {
  ambienceStart: 0,
  musicIn: CURSOR_HANDOFF, // la música entra suave DESPUÉS de la pausa del último mensaje
  threadBorn: THREAD_TIMING.bornFrom,
  phraseOne: TURN_TIMING.firstIn,
  phraseTwo: TURN_TIMING.secondIn,
  threadDescend: THREAD_TIMING.descendFrom,
  subtitleUnits: COMPANION_TIMING.units.map((u) => u.from),
  threadRise: THREAD_TIMING.riseFrom,
  logoReveal: CLOSING_TIMING.logoIn,
  musicOutFrom: 990, // cierre suave mientras la imagen permanece hasta el último fotograma
} as const;

/** Recursos de audio (stems de 35 s, 48 kHz estéreo, ya alineados al reel). Generados por scripts/build-audio.ts. */
export const AUDIO_FILES = {
  ambience: "audio/ambiente.wav",
  keys: "audio/teclado.wav",
  music: "audio/musica.wav",
  sfx: "audio/sfx-hilo.wav",
} as const;

/**
 * Locución. Sin grabación ni voz sintética autorizada: `enabled: false` (versión de revisión).
 * Para incorporar la voz: copiar el audio a public/audio/locucion.wav, poner enabled: true
 * y ajustar `from` al fotograma donde empieza cada pieza (ver cues).
 */
export const VOICEOVER = {
  enabled: false,
  file: "audio/locucion.wav",
  /** Marcas de sincronización previstas para la locución (referencia para grabar/editar). */
  cues: {
    turnFirst: TURN_TIMING.firstIn,
    turnSecond: TURN_TIMING.secondIn,
    companion: COMPANION_TIMING.units[0].from,
  },
} as const;

/**
 * Medios reales a incorporar (si hay): videos/fotos de ADIP. null = alternativa gráfica de marca.
 * Rutas relativas a public/. Ver README.
 */
export const MEDIA = {
  /** Escena 3: grabación de una persona del equipo diciendo la frase a cámara. */
  turnVideo: null as string | null,
  /** Escena 4: dos o tres planos reales del equipo / consultorios (autorizados). */
  companionClips: [null, null, null] as (string | null)[],
};

/** El hilo gráfico se monta unos fotogramas antes del traspaso del cursor (fotograma absoluto de inicio de su capa). */
export const THREAD_FROM = SFX_CUES.threadBorn - 6;

/**
 * Chat (escena 2): la tarjeta del campo de redacción, el encabezado y el texto del 3.er mensaje
 * se desvanecen entre `from` y `to` (fotogramas absolutos). El cursor NO se desvanece: lo toma el hilo en CURSOR_HANDOFF.
 */
export const CHAT_FADE = { from: 404, to: 432 } as const;
