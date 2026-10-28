import edl from './edl.json';

export const FPS = 30;
export const MAIN = edl.main; // where the interview starts (after the hook)
export const VOICE_END = edl.total;
export const OUTRO_AT = 54.55;
export const TOTAL = 58.7;

export type W = {w: string; s: number; e: number; k: boolean; teaser?: boolean};
export const WORDS = edl.words as W[];
export const MAIN_WORDS = WORDS.filter((x) => !x.teaser);
export const HOOK_WORDS = WORDS.filter((x) => x.teaser);

export const norm = (s: string) => s.toLowerCase().replace(/[.,¿?¡!]/g, '');

const find = (list: W[], w: string, nth: number) => {
  const m = list.filter((x) => norm(x.w) === w.toLowerCase());
  if (!m[nth]) throw new Error(`word not found: ${w}#${nth}`);
  return m[nth];
};
/** start / end of a spoken word on the edited timeline (main interview) */
export const T = (w: string, nth = 0) => find(MAIN_WORDS, w, nth).s;
export const TE = (w: string, nth = 0) => find(MAIN_WORDS, w, nth).e;
/** same for the hook (teaser) */
export const H = (w: string, nth = 0) => find(HOOK_WORDS, w, nth).s;
export const HE = (w: string, nth = 0) => find(HOOK_WORDS, w, nth).e;

/** Cut points between segments of the interview (jump cuts) on the edited timeline. */
export const CUTS: number[] = (edl.offsets as number[]).slice(2);

// ---------- captions: hand-phrased so each line reads as one idea ----------
const PHRASES = [5, 4, 5, 4, 4, 3, 4, 4, 3, 4, 2, 3, 2, 4, 4, 3, 5, 3, 3, 4, 3, 3, 3, 3, 3, 2, 2, 3, 2];
export type Chunk = {words: W[]; s: number; e: number};
export const CHUNKS: Chunk[] = (() => {
  const total = PHRASES.reduce((a, b) => a + b, 0);
  if (total !== MAIN_WORDS.length) throw new Error(`phrases ${total} != words ${MAIN_WORDS.length}`);
  let i = 0;
  const out: Chunk[] = PHRASES.map((n) => {
    const words = MAIN_WORDS.slice(i, i + n);
    i += n;
    return {words, s: words[0].s - 0.04, e: words[words.length - 1].e + 0.22};
  });
  out.forEach((c, k) => {
    const nx = out[k + 1];
    if (nx) c.e = Math.min(c.e, nx.s - 0.03);
  });
  return out;
})();
