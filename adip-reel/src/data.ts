import rawWords from './words.json';

export const FPS = 30;
export const BASE_FRAMES = 1326; // edited interview, in frames
export const VOICE_END = BASE_FRAMES / FPS;
export const OUTRO = 3.9;
export const TOTAL = VOICE_END + OUTRO;

// ---------- words (forced alignment on the edited voice) ----------
export type Word = {text: string; s: number; e: number; key?: boolean; show?: string};

const KEYS = new Set([
  'acompañamiento', 'escolar', 'contactar', 'telefónica', 'mail', 'whatsapp', 'sedes', 'admisiones', 'paraguay', '930',
  'niceto', 'vega', '5140', 'palermo', 'caba', 'microcentro', 'horarios', 'amplios', 'variados', 'conurbano', 'gran',
  'buenos', 'aires', '2027', 'contactarnos', 'adip', 'admisión', 'momento',
]);
export const norm = (s: string) => s.toLowerCase().replace(/[.,¿?¡!]/g, '');

const merged: Word[] = [];
(rawWords as [string, number, number][]).forEach(([t, s, e], i, arr) => {
  if (t.toLowerCase() === 'con' && arr[i + 1] && arr[i + 1][0].toLowerCase() === 'urbano') return;
  let text = t;
  let ws = s;
  if (t.toLowerCase() === 'urbano') {
    text = 'Conurbano';
    ws = arr[i - 1][1];
  }
  if (norm(text) === 'caba') text = text.replace(/caba/i, 'CABA');
  if (norm(text) === 'whatsapp') text = text.replace(/whatsapp/i, 'WhatsApp');
  // what is written on screen (can differ from what is said, e.g. the nickname / the brand name)
  const show = norm(text) === 'pau' ? 'Paola,' : norm(text) === 'adip' ? 'Equipo ADIP?' : undefined;
  merged.push({text, s: ws, e, key: KEYS.has(norm(text)), show});
});
export const WORDS = merged;

const wordAt = (txt: string, nth = 0) => {
  const m = WORDS.filter((w) => norm(w.text) === txt.toLowerCase());
  if (!m[nth]) throw new Error(`word not found: ${txt}#${nth}`);
  return m[nth];
};
export const T = (txt: string, nth = 0) => wordAt(txt, nth).s;
export const TE = (txt: string, nth = 0) => wordAt(txt, nth).e;

// ---------- captions ----------
export type Chunk = {words: Word[]; s: number; e: number};
export const CHUNKS: Chunk[] = (() => {
  const out: Chunk[] = [];
  let cur: Word[] = [];
  const flush = () => {
    if (!cur.length) return;
    out.push({words: cur, s: cur[0].s, e: cur[cur.length - 1].e});
    cur = [];
  };
  WORDS.forEach((w) => {
    const prev = cur[cur.length - 1];
    const chars = cur.reduce((a, x) => a + (x.show ?? x.text).length + 1, 0);
    if (prev && (w.s - prev.e > 0.45 || chars + (w.show ?? w.text).length > 27 || cur.length >= 5)) flush();
    cur.push(w);
    if (/[.?]$/.test(w.text) || (/,$/.test(w.text) && cur.length >= 2)) flush();
  });
  flush();
  out.forEach((c, i) => {
    const nxt = out[i + 1];
    const hold = c.words[c.words.length - 1].e + 0.3;
    c.e = nxt ? Math.min(hold, nxt.s - 0.02) : hold;
    c.s = c.s - 0.05;
  });
  return out;
})();
