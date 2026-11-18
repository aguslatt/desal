import edl from './edl.json';

export const FPS = 30;
export const SRC_FRAMES = 1023; // the clip is used whole, uncut (34.1 s)
export const VOICE_END = SRC_FRAMES / FPS;
export const OUTRO_AT = VOICE_END - 0.36; // circle starts to cover (fully closed before the clip ends)
export const TOTAL = 36.4;

export type W = {w: string; s: number; e: number};
export type Chunk = {i0: number; n: number; hi: number; hidden: boolean; s: number; e: number; text: string};
export const WORDS = edl.words as W[];
export const CHUNKS = edl.chunks as Chunk[];

const norm = (s: string) => s.toLowerCase().replace(/[.,¿?¡!]/g, '');
/** start of a spoken word on the timeline */
export const T = (w: string, nth = 0) => {
  const m = WORDS.filter((x) => norm(x.w) === w);
  if (!m[nth]) throw new Error(`word not found: ${w}#${nth}`);
  return m[nth].s;
};

// ---- key moments (seconds on the source timeline) ----
export const SNAP = 0.25; // finger snap (audio transient, frame 7-8)
export const CUTS = [0.633, 1.5, 4.267, 6.0, 8.767, 10.767, 12.8, 16.7, 20.167, 22.1, 27.633, 29.467];
export const PLATE_IN = 4.267; // "más de un millón de conexiones nuevas"
export const PLATE_OUT = 6.0;
export const T_CADA = T('cada');
export const T_CADA_OUT = T('en', 1) - 0.04;
export const BIG_WORDS: {text: string; t: number}[] = [
  {text: 'JUGAR', t: T('jugar')},
  {text: 'MIRAR', t: T('mirar')},
  {text: 'HABLAR', t: T('hablar')},
  {text: 'RESPONDER', t: T('responder')},
];
export const BIG_OUT = CUTS[8];
export const T_CLAVE = T('clave') - 0.06;
export const CLAVE_OUT = CUTS[9];
export const T_PILL = T('estimulación') - 0.05;
export const PILL_OUT = CUTS[10] - 0.1;
export const T_BTN = T('no', 1) - 0.08;
export const BALL = {t0: 10.8, t1: 11.5, x: 262, y: 842, r: 122};

/** windows where a giant word owns the screen: captions are hidden */
export const BIG_WINDOWS: [number, number][] = [
  [PLATE_IN - 0.1, PLATE_OUT],
  [T_CADA - 0.05, T_CADA_OUT],
  [BIG_WORDS[0].t - 0.05, BIG_OUT],
  [T_CLAVE - 0.05, CLAVE_OUT],
];
