import edl from './edl.json';

export const FPS = 30;
const segs = edl.segments as {src: [number, number]; out: number; dur: number}[];
export const HOOK_END = segs[0].dur; // cold open (line moved up front)
export const CUT_TOTAL = edl.total;
export const TAIL = 0.9; // hold on the closing frame
export const TOTAL = CUT_TOTAL + TAIL;

/** source second of the interview -> second on the edited timeline (hook excluded). */
export const T = (src: number): number => {
  for (let i = 1; i < segs.length; i++) {
    const s = segs[i];
    if (src < s.src[0]) return s.out; // falls in a removed gap -> start of next kept piece
    if (src <= s.src[1]) return s.out + (src - s.src[0]);
  }
  return CUT_TOTAL;
};

// Reviewed subtitles. *word* = highlighted in the brand colour. Times = source seconds.
// (!) 58.5-68.2 is hard to hear in the recording — wording is the best reading, flagged for review.
export const CAPTIONS: [number, number, string][] = [
  [0.0, 1.84, 'Hola a todos, soy *Andy* de *Equipo ADIP*.'],
  [1.98, 4.12, 'Acompáñenme a charlar con el equipo de *Recursos Humanos*'],
  [4.12, 6.55, 'para que nos cuenten un poco cómo funciona el *portal de empleo*'],
  [9.24, 11.7, 'Vamos a hablar con *Mika*, una de las reclutadoras de nuestro equipo,'],
  [15.64, 17.98, 'Bueno, *Mika*, contanos, ¿cómo pueden hacer'],
  [17.98, 19.95, 'los *profesionales* para sumarse a nuestro equipo?'],
  [20.44, 21.85, 'Bueno, hola Andy, ¿cómo estás?'],
  [22.48, 24.16, 'Bueno, la idea de los *profesionales*'],
  [24.16, 26.9, 'es que puedan acceder a nuestro *portal web*.'],
  [27.32, 30.16, 'Ahí hay un *apartado para profesionales*.'],
  [30.26, 32.04, 'Está justamente la *bolsa de empleo*'],
  [32.04, 34.48, 'donde la idea es que coloquen sus *datos personales*,'],
  [34.58, 36.38, 'su *localidad*, también su *currículum*'],
  [36.38, 38.48, 'y nosotros, allí, desde *Recursos Humanos*'],
  [38.48, 42.58, 'lo que hacemos es justamente hacer el *reclutamiento*'],
  [42.58, 44.62, 'acá internamente y las futuras *entrevistas*,'],
  [44.62, 46.04, 'dependiendo de las *localidades*,'],
  [46.42, 48.2, 'incluso qué *terapia* busquen y demás.'],
  [48.7, 50.95, 'Bueno, y lo bueno que tiene justamente nuestro *portal de empleo*'],
  [51.26, 54.15, 'es que vos vas a poder allí colocar tu *disponibilidad*,'],
  [54.36, 56.0, 'el *área* que te interesa, tu *profesión*'],
  [56.0, 58.5, 'y nosotros, justamente desde allí, lo que hacemos es'],
  [58.5, 61.5, 'el filtro, supongamos, de *zona sur*.'],
  [61.6, 64.5, 'Vamos a buscar, justamente, desde un proceso de'],
  [64.5, 68.2, '*inclusión*, un *AT en domicilio*, en tu *localidad*.'],
  [68.6, 71.45, 'Así que ya sabés, si estás interesado en sumarte a *Equipo ADIP*,'],
  [71.48, 72.85, 'no dudes entrar a nuestro *portal de empleos*'],
  [72.85, 74.2, 'y sumarte a nuestro equipo.'],
  [75.6, 76.4, '*Te esperamos.*'],
];
export const HOOK_CAPTION = 'Así te podés sumar a *nuestro equipo*.';
