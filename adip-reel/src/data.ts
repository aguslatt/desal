import rawWords from './words.json';

export const FPS = 30;
export const VOICE_END = 53.65; // end of the edited interview
export const OUTRO = 3.0;
export const TOTAL = VOICE_END + OUTRO;

// ---------- words ----------
export type Word = {text: string; s: number; e: number; key?: boolean};

const KEYS = new Set([
  'acompañamiento', 'escolar', 'contactar', 'telefónica', 'mail', 'whatsapp', 'sedes', 'admisiones', 'paraguay', '930',
  'niceto', 'vega', '5140', 'palermo', 'caba', 'microcentro', 'horarios', 'amplios', 'variados', 'conurbano', 'gran',
  'buenos', 'aires', '2027', 'contactarnos', 'adip', 'admisión',
]);
const norm = (s: string) => s.toLowerCase().replace(/[.,¿?¡!]/g, '');

const merged: Word[] = [];
(rawWords as [string, number, number][]).forEach(([t, s, e], i, arr) => {
  if (t.toLowerCase() === 'con' && arr[i + 1] && arr[i + 1][0].toLowerCase() === 'urbano') return; // merged below
  let text = t;
  let ws = s;
  if (t.toLowerCase() === 'urbano') {
    text = 'Conurbano';
    ws = arr[i - 1][1];
  }
  if (norm(text) === 'caba') text = text.replace(/caba/i, 'CABA');
  if (norm(text) === 'whatsapp') text = 'WhatsApp';
  merged.push({text, s: ws, e, key: KEYS.has(norm(text))});
});
export const WORDS = merged;

export const wordAt = (txt: string, nth = 0) => {
  const m = WORDS.filter((w) => norm(w.text) === txt.toLowerCase());
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
  WORDS.forEach((w, i) => {
    const prev = cur[cur.length - 1];
    const chars = cur.reduce((a, x) => a + x.text.length + 1, 0);
    if (prev && (w.s - prev.e > 0.5 || chars + w.text.length > 27 || cur.length >= 5)) flush();
    cur.push(w);
    if (/[.?]$/.test(w.text) || (/,$/.test(w.text) && cur.length >= 2)) flush();
  });
  flush();
  // end times: hold a little after the last word, never beyond next chunk
  out.forEach((c, i) => {
    const nxt = out[i + 1];
    const hold = c.words[c.words.length - 1].e + 0.38;
    c.e = nxt ? Math.min(hold, nxt.s - 0.02) : hold;
    c.s = c.s - 0.04;
  });
  return out;
})();

// ---------- camera ----------
export type Pose = {cx: number; cy: number; z: number; b?: number};
export type Shot = {from: number; to: number; a: Pose; b: Pose; blend?: number};

// source frame is 2160x3840. cx/cy = window centre in source px, z = zoom (1 = full frame)
const ANDY_CLOSE: Pose = {cx: 1180, cy: 1900, z: 1.2};
export const SHOTS: Shot[] = [
  {from: 0, to: 5.55, a: {cx: 1150, cy: 1640, z: 1.18}, b: {cx: 1170, cy: 1600, z: 1.32}},
  {from: 5.55, to: 8.88, a: {cx: 1080, cy: 1900, z: 1.1}, b: {cx: 1100, cy: 1900, z: 1.22}},
  {from: 8.88, to: 10.5, a: {cx: 1100, cy: 1900, z: 1.22}, b: {cx: 1120, cy: 1900, z: 1.32}, blend: 0},
  // Andy asks (tight, looking room towards Pau) with a reaction shot of Pau in the middle
  {from: 10.5, to: 12.2, a: {cx: 1500, cy: 1890, z: 1.62}, b: {cx: 1500, cy: 1895, z: 1.68}, blend: 0.5},
  {from: 12.2, to: 13.45, a: {cx: 620, cy: 1930, z: 1.85, b: 1.12}, b: {cx: 620, cy: 1930, z: 1.92, b: 1.12}},
  {from: 13.45, to: 17.16, a: {cx: 1500, cy: 1895, z: 1.66}, b: {cx: 1500, cy: 1920, z: 1.84}},
  // Pau answers
  {from: 17.16, to: 21.8, a: {cx: 600, cy: 1920, z: 1.8, b: 1.12}, b: {cx: 590, cy: 1925, z: 1.92, b: 1.12}},
  {from: 21.8, to: 26.0, a: {cx: 700, cy: 1850, z: 1.5, b: 1.12}, b: {cx: 680, cy: 1850, z: 1.62, b: 1.12}},
  {from: 26.0, to: 29.7, a: {cx: 600, cy: 1930, z: 1.9, b: 1.12}, b: {cx: 590, cy: 1930, z: 2.05, b: 1.12}, blend: 0.6},
  {from: 29.7, to: 32.0, a: {cx: 800, cy: 1900, z: 1.4, b: 1.1}, b: {cx: 760, cy: 1900, z: 1.48, b: 1.1}, blend: 0.6},
  {from: 32.0, to: 37.4, a: {cx: 600, cy: 1920, z: 1.7, b: 1.12}, b: {cx: 600, cy: 1925, z: 1.88, b: 1.12}, blend: 0.6},
  {from: 37.4, to: 40.72, a: {cx: 600, cy: 1930, z: 1.95, b: 1.12}, b: {cx: 600, cy: 1930, z: 2.08, b: 1.12}},
  {from: 40.72, to: 44.0, a: {cx: 700, cy: 1850, z: 1.5, b: 1.12}, b: {cx: 690, cy: 1850, z: 1.6, b: 1.12}},
  {from: 44.0, to: 47.87, a: {cx: 600, cy: 1925, z: 1.8, b: 1.12}, b: {cx: 600, cy: 1930, z: 2.0, b: 1.12}, blend: 0.6},
  // Andy closes
  {from: 47.87, to: 53.65, a: {cx: 1410, cy: 1930, z: 1.7}, b: {cx: 1410, cy: 1925, z: 2.0}},
];
