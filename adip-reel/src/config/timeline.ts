/**
 * Cronograma central v2 (30 fps, 1140 fotogramas = 38 s). Fuente única de tiempos para animación,
 * textos, cámara y audio (scripts/build-audio.ts lee este mismo archivo).
 * Todos los valores son fotogramas ABSOLUTOS del reel salvo que se indique lo contrario.
 */
export const FPS = 30;
export const TOTAL_FRAMES = 1140;
export const sec = (s: number) => Math.round(s * FPS);

/** Ventanas de escena según el brief v2 (las escenas se solapan con sus colas de salida). */
export const SCENES = {
  s1: { from: 0, to: 90 }, //     00:00–00:03 Persona con celular → acercamiento a la pantalla
  s2: { from: 90, to: 420 }, //   00:03–00:14 Primer plano del chat: escribir y borrar
  s3: { from: 420, to: 600 }, //  00:14–00:20 El cursor se vuelve trazo; la cámara se aleja
  s4: { from: 600, to: 750 }, //  00:20–00:25 Se amplía: otras personas, alguien se acerca
  s5: { from: 750, to: 930 }, //  00:25–00:31 Las líneas conectan al grupo con la firma ADIP
  s6: { from: 930, to: 1140 }, // 00:31–00:38 Composición final + mensaje + fecha
} as const;

/** Solape de salida/entrada entre escenas (fotogramas). */
export const OVERLAP = 12;

/**
 * Gancho (escena 1): legible desde el fotograma 0 (asienta en `settle` f), COMPLETO y quieto hasta `exitFrom` (≈ 2,1 s) y sale
 * (fundido corto) ANTES de que la cabeza, la cabecera «Amiga» o la burbuja recibida entren en su franja (el zoom de la cámara acelera
 * recién cuando el gancho terminó de salir: ver ZOOM_IN_CURVE en src/world/camera.ts).
 */
export const HOOK_TIMING = { settle: 10, exitFrom: 72, exitTo: 80 } as const;

/**
 * Escena 2 — escritura. Por mensaje:
 *  start → typeEnd: se tipea; typeEnd → deleteStart: se sostiene completo (~1 s en 1 y 2);
 *  deleteStart → deleteEnd: se borra desde el final (tecla de borrar mantenida). El mensaje 3 queda sin enviar.
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
  { start: 307, typeEnd: 356, deleteStart: null, deleteEnd: null, hesitations: [{ afterChars: 16, frames: 6 }], seed: 37 },
];

/** Pausa perceptible con el cursor titilando (typeEnd del msg 3 → HANDOFF) ≈ 1,8 s. Desde aquí el cursor empieza a volverse trazo. */
export const CURSOR_HANDOFF = 410;

/** Cursor: parpadeo (período en fotogramas), sólido mientras se escribe/borra. */
export const CURSOR_BLINK = { period: 24, onFrames: 13, fade: 3, idleBeforeBlink: 3 } as const;

/**
 * Cámara continua (mundo ilustrado). Fotogramas de los hitos de movimiento; la cámara la define src/world/camera.ts.
 *  zoomIn:  S1 persona con celular → el chat llena el encuadre
 *  chat:    S2 el chat llena el encuadre (primer plano)
 *  pullOut: S3 la cámara se aleja hasta el encuadre persona + celular
 *  widen:   S4 la composición se amplía (aparecen los demás)
 *  push:    S4 empuje MUY sutil (≈ +9 %) hacia la protagonista y la amiga mientras ella se sienta y ofrece la mano
 *  final:   S5 encuadre final de la composición (con logo)
 */
export const CAMERA_TIMING = {
  zoomInFrom: 0,
  zoomInTo: 96,
  chatTo: 428,
  pullOutFrom: 428,
  pullOutTo: 512,
  widenFrom: 612,
  widenTo: 716,
  pushFrom: 716,
  pushTo: 768,
  finalFrom: 790,
  finalTo: 842,
} as const;

/** Escena 3 — frase de la locución en dos momentos (pausa ≈ 0,8 s entre ambas). Sale en la cola de la escena. */
export const TURN_TIMING = {
  firstIn: 488,
  secondIn: 548,
  exitFrom: 606,
} as const;

/** Escena 4 — acompañamiento: reparto, gesto y texto en pantalla. */
export const COMPANION_TIMING = {
  /** aparecen (se dibujan) las otras personas, escalonadas */
  othersFrom: 624,
  othersStagger: 14,
  /** la figura amiga entra, se sienta y ofrece la mano */
  friendEnterFrom: 640,
  friendSitFrom: 696,
  friendGestureAt: 722,
  /** texto «No tenés que pasar por esto en soledad.» estable hasta exitFrom */
  textIn: 646,
  textExitFrom: 750,
} as const;

/** Escena 5 — firma institucional: subtítulos por unidad de sentido (inicio, fin) y logo. */
export const SIGNATURE_TIMING = {
  units: [
    { from: 764, to: 838 },
    { from: 838, to: 884 },
    { from: 884, to: 930 },
  ],
  logoIn: 772,
} as const;

/** Escena 6 — cierre; todo visible desde `allVisible` hasta el último fotograma (≥ 3 s). */
export const CLOSING_TIMING = {
  messageIn: 944,
  dateIn: 1000,
  allVisible: 1040,
} as const;

/** Hilo naranja: del cursor al trazo y a las conexiones (fotogramas). */
export const THREAD_TIMING = {
  /** el cursor del chat empieza a estirarse hasta ser un trazo que sale del encuadre */
  bornFrom: CURSOR_HANDOFF,
  leavesChatBy: 456,
  /** S3: se dibuja en el mundo alrededor de la persona */
  loopFrom: 456,
  loopTo: 548,
  /** S4: se extiende hacia las demás personas */
  branchesFrom: 626,
  branchesTo: 734,
  /** S5: llega a la firma (logo) sin atravesarla */
  logoFrom: 790,
  logoTo: 858,
  /** S6: asienta la composición final */
  settleFrom: 930,
  settleTo: 990,
} as const;

/**
 * Hitos de sonido (frame absoluto). El audio se renderiza en stems de 38 s ya alineados al reel.
 * La música entra DESPUÉS de la pausa del último mensaje; cambios de armonía cada 105 f desde musicIn
 * (410, 515, 620, 725, 830, 935, 1040) para caer en los hitos de cámara/relato.
 */
export const SFX_CUES = {
  ambienceStart: 0,
  musicIn: CURSOR_HANDOFF,
  threadBorn: THREAD_TIMING.bornFrom,
  cameraPullOut: CAMERA_TIMING.pullOutFrom,
  phraseOne: TURN_TIMING.firstIn,
  phraseTwo: TURN_TIMING.secondIn,
  widen: CAMERA_TIMING.widenFrom,
  companionText: COMPANION_TIMING.textIn,
  friendSits: COMPANION_TIMING.friendSitFrom,
  friendGesture: COMPANION_TIMING.friendGestureAt,
  logoReveal: SIGNATURE_TIMING.logoIn,
  subtitleUnits: SIGNATURE_TIMING.units.map((u) => u.from),
  finalMessage: CLOSING_TIMING.messageIn,
  musicOutFrom: 1070, // cierre suave mientras la imagen permanece hasta el último fotograma
} as const;

/** Recursos de audio (stems de 38 s, 48 kHz estéreo, ya alineados al reel). Generados por scripts/build-audio.ts. */
export const AUDIO_FILES = {
  ambience: "audio/ambiente.wav",
  keys: "audio/teclado.wav",
  music: "audio/musica.wav",
  sfx: "audio/sfx-hilo.wav",
} as const;

/**
 * Locución. Sin grabación ni voz sintética autorizada: `enabled: false` (versión de revisión).
 * Para incorporar la voz: copiar el audio a public/audio/locucion.wav, poner enabled: true y ajustar
 * TURN_TIMING / SIGNATURE_TIMING a la duración real (las marcas de `cues` son la referencia prevista).
 */
export const VOICEOVER = {
  enabled: false,
  file: "audio/locucion.wav",
  cues: {
    turnFirst: TURN_TIMING.firstIn,
    turnSecond: TURN_TIMING.secondIn,
    signature: SIGNATURE_TIMING.units[0].from,
  },
} as const;

/** El hilo se monta unos fotogramas antes del traspaso del cursor (fotograma absoluto de inicio de su capa). */
export const THREAD_FROM = THREAD_TIMING.bornFrom - 6;
