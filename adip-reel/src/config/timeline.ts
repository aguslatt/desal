/**
 * Cronograma central v3 (30 fps, 1590 fotogramas = 53,0 s). Fuente única de tiempos para animación, textos y audio
 * (scripts/build-audio.ts lee este mismo archivo). Todos los valores son fotogramas ABSOLUTOS del reel salvo que se indique lo contrario.
 * Referencia del cliente (brief v3): 50–53 s; los MENSAJES necesitan permanencia (≈ 3 s completos) y las animaciones pueden ser ágiles.
 */
export const FPS = 30;
export const TOTAL_FRAMES = 1590;
/** Pregunta de la campaña (S1): legible desde el fotograma 0 (asienta en `settle` f), estable, y sale cuando empieza a escribirse. */
export const HOOK_TIMING = { settle: 6, exitFrom: 100, exitTo: 116 } as const;

/**
 * Escritura (S2). Por mensaje:
 *  start → typeEnd: se tipea; typeEnd → deleteStart: la frase queda COMPLETA y ESTABLE ≈ 3 s (90 f);
 *  deleteStart → deleteEnd: se borra DESDE EL FINAL, un carácter por vez (cada carácter desaparece por completo en su fotograma; sin opacidad).
 *  M3 no se borra: queda 3 s (pausa de duda, cursor titilando) y se ENVÍA (SEND_TIMING).
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
  // «No me estoy sintiendo bien.»  27 car.: tipea 2,1 s · se sostiene 3,0 s · borra 1,3 s
  { start: 118, typeEnd: 182, deleteStart: 272, deleteEnd: 312, hesitations: [{ afterChars: 12, frames: 5 }], seed: 11 },
  // «¿Tenés un ratito para mí?»    25 car.: tipea 2,1 s · se sostiene 3,0 s · borra 1,3 s
  { start: 326, typeEnd: 388, deleteStart: 478, deleteEnd: 518, hesitations: [{ afterChars: 17, frames: 6 }], seed: 23 },
  // «No sé por dónde empezar…»     24 car.: tipea 2,6 s (duda antes de «empezar…») · queda 3,0 s · se envía
  { start: 534, typeEnd: 612, deleteStart: null, deleteEnd: null, hesitations: [{ afterChars: 16, frames: 10 }], seed: 37 },
];

/** Cursor: parpadeo (período en fotogramas), sólido mientras se escribe/borra. */
export const CURSOR_BLINK = { period: 24, onFrames: 13, fade: 3, idleBeforeBlink: 3 } as const;

/**
 * Envío y respuesta (S2, brief v3 sección 3).
 *  - pressFrom→pressTo: se pulsa ENVIAR (el botón se hunde/destella);
 *  - flyFrom→flyTo: el texto PASA del campo de escritura a una burbuja de mensaje enviado (el campo queda vacío);
 *  - indicatorFrom→indicatorTo: breve espera («Amiga» escribiendo: tres puntos);
 *  - replyIn: aparece «Estoy acá. Te escucho.» y se sostiene hasta replyHoldTo (≥ 3 s: centro emocional).
 */
export const SEND_TIMING = {
  pressFrom: 702,
  pressTo: 712,
  flyFrom: 712,
  flyTo: 742,
  indicatorFrom: 756,
  indicatorTo: 790,
  replyIn: 790,
  replyHoldTo: 892,
} as const;

/**
 * Transición desde la respuesta hacia el acompañamiento (S3): se retira la interfaz del chat (encabezado, campo, teclado, burbuja enviada),
 * el fondo cambia a naranja desde la burbuja de respuesta y el TEXTO conserva su posición como referencia: «Estoy acá. Te escucho.» →
 * «Podés empezar por ahí.»
 */
export const TRANSITION_TIMING = {
  from: 892,
  chatExitTo: 920,
  wipeFrom: 900,
  wipeTo: 934,
} as const;

/** Frase de la locución en dos momentos (pausa ≈ 0,6 s entre entradas). Ambas visibles a la vez hasta exitFrom. */
export const TURN_TIMING = {
  firstIn: 930,
  secondIn: 994,
  exitFrom: 1100,
} as const;

/** Revelado de la ilustración: el naranja se retira y el dibujo de la escena de escucha se incorpora. */
export const REVEAL_TIMING = {
  wipeOutFrom: 1068,
  wipeOutTo: 1108,
} as const;

/** S4 — situación de escucha (dos personas) y texto «No tenés que pasar por esto en soledad.». */
export const COMPANION_TIMING = {
  /** las figuras empiezan a dibujarse / entra la 2.ª persona */
  drawFrom: 1100,
  friendEnterFrom: 1104,
  friendArriveAt: 1154,
  /** gesto de escucha (mano abierta / apoyo suave) */
  gestureAt: 1172,
  textIn: 1114,
  textExitFrom: 1222,
} as const;

/** S5 — firma institucional completa en dos bloques (el 1.º queda visible cuando entra el 2.º) + logo con protagonismo. */
export const SIGNATURE_TIMING = {
  block1In: 1240,
  logoIn: 1254,
  block2In: 1304,
  exitFrom: 1408,
} as const;

/** S6 — cierre; todo visible desde `allVisible` hasta el último fotograma (≥ 3 s). */
export const CLOSING_TIMING = {
  messageIn: 1420,
  dateIn: 1458,
  allVisible: 1498,
} as const;

/** Curvas de conexión (hilo naranja entre las personas y hacia la firma). */
export const THREAD_TIMING = {
  connectFrom: 1124,
  connectTo: 1200,
  logoFrom: 1258,
  logoTo: 1336,
  settleFrom: 1420,
  settleTo: 1470,
} as const;

/**
 * Hitos de sonido (frame absoluto). Stems de 53 s ya alineados al reel. La música entra suave cuando llega la respuesta
 * («Estoy acá. Te escucho.») y cambia de armonía cada 105 f desde musicIn (790, 895, 1000, 1105, 1210, 1315, 1420, 1525): cae en la
 * transición (≈895), la frase 2 (≈994), la escena de escucha (≈1105), la firma (≈1210–1240), el bloque 2 (≈1315) y el cierre (≈1420).
 */
export const SFX_CUES = {
  ambienceStart: 0,
  sendPress: SEND_TIMING.pressFrom,
  sendFly: SEND_TIMING.flyFrom,
  indicator: SEND_TIMING.indicatorFrom,
  reply: SEND_TIMING.replyIn,
  musicIn: SEND_TIMING.replyIn,
  transition: TRANSITION_TIMING.wipeFrom,
  /** el sonido entra con el texto (el rodillo de la 1.ª frase ya muestra letras ≈ 5 f después de firstIn) */
  phraseOne: TURN_TIMING.firstIn + 5,
  /** el sonido entra con el texto (el rodillo de la 2.ª frase ya muestra letras ≈ 4 f después de secondIn) */
  phraseTwo: TURN_TIMING.secondIn + 4,
  reveal: REVEAL_TIMING.wipeOutFrom,
  companionText: COMPANION_TIMING.textIn,
  friendArrive: COMPANION_TIMING.friendArriveAt,
  /** la campanita coincide con el tramo más veloz del gesto (la mano empieza a moverse ≈ 4 f después de gestureAt) */
  gesture: COMPANION_TIMING.gestureAt + 8,
  signatureOne: SIGNATURE_TIMING.block1In,
  logoReveal: SIGNATURE_TIMING.logoIn,
  signatureTwo: SIGNATURE_TIMING.block2In,
  finalMessage: CLOSING_TIMING.messageIn,
  finalDate: CLOSING_TIMING.dateIn,
  musicOutFrom: 1530, // cierre suave mientras la imagen permanece hasta el último fotograma
} as const;

/** Recursos de audio (stems de 53 s, 48 kHz estéreo, ya alineados al reel). Generados por scripts/build-audio.ts. */
export const AUDIO_FILES = {
  ambience: "audio/ambiente.wav",
  keys: "audio/teclado.wav",
  music: "audio/musica.wav",
  sfx: "audio/sfx-hilo.wav",
} as const;

/**
 * Locución. Sin grabación ni voz sintética autorizada: `enabled: false` (versión de revisión).
 * Para incorporar la voz: stem de 53 s en public/audio/locucion.wav, enabled: true y ajustar TURN_TIMING / SIGNATURE_TIMING.
 */
export const VOICEOVER = {
  enabled: false,
  file: "audio/locucion.wav",
  cues: {
    turnFirst: TURN_TIMING.firstIn,
    turnSecond: TURN_TIMING.secondIn,
    signature: SIGNATURE_TIMING.block1In,
  },
} as const;
