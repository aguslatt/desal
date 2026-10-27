import cuts from './cuts.json';

export const FPS = 30;
export const SPEECH_END = cuts.total; // voz editada, sin micro-pausas
export const OUTRO = 3.3;
export const TOTAL_FRAMES = Math.round((SPEECH_END + OUTRO) * FPS);

// tiempo del material original -> tiempo de la edición
export const E = (src: number) => {
  for (let i = cuts.segs.length - 1; i >= 0; i--) {
    const s = cuts.segs[i];
    if (src >= s.src - 0.001) return s.edit + Math.min(src, s.srcEnd) - s.src;
  }
  return src;
};
// índice del tramo de entrevista (para alternar encuadres en cada corte)
export const segIndex = (t: number) => {
  let k = 0;
  cuts.segs.forEach((s, i) => { if (t >= s.edit - 0.001) k = i; });
  return k;
};
export const CUT_TIMES = cuts.segs.map((s) => s.edit);

// Subtítulos corregidos a mano. a/b en tiempo del original. kw = palabras destacadas.
export type Cap = {a: number; b: number; text: string; kw?: string[]};
export const CAPS: Cap[] = [
  {a: 0.38, b: 1.95, text: 'Hoy en día,\nuna de cada diez personas', kw: ['una de cada diez']},
  {a: 1.95, b: 3.4, text: 'con certificado de discapacidad'},
  {a: 3.45, b: 4.51, text: 'y en edad laboral'},
  {a: 4.74, b: 5.85, text: 'tiene un trabajo registrado.', kw: ['trabajo registrado']},
  {a: 6.58, b: 7.3, text: 'Por eso mismo,'},
  {a: 7.36, b: 8.34, text: 'desde Equipo ADIP', kw: ['Equipo ADIP']},
  {a: 8.65, b: 9.75, text: 'creamos el programa'},
  {a: 9.8, b: 12.21, text: 'de formación sociolaboral\ny vida independiente', kw: ['sociolaboral', 'vida independiente']},
  {a: 12.48, b: 13.65, text: 'para poder preparar'},
  {a: 13.7, b: 15.3, text: 'a los jóvenes y adultos\ncon discapacidad', kw: ['jóvenes y adultos']},
  {a: 15.4, b: 17.7, text: 'a insertarse en\nel mundo laboral.', kw: ['mundo laboral']},
  {a: 18.27, b: 19.7, text: 'Asimismo, capacitamos'},
  {a: 19.78, b: 20.41, text: 'a empresas', kw: ['empresas']},
  {a: 20.59, b: 23.3, text: 'para poder insertar\na estas personas'},
  {a: 23.35, b: 24.35, text: 'en el mundo laboral'},
  {a: 24.53, b: 26.2, text: 'y poder crear una red'},
  {a: 26.25, b: 28.13, text: 'de contención y\nacompañamiento', kw: ['contención', 'acompañamiento']},
  {a: 28.62, b: 30.25, text: 'fomentando el\nempleo con apoyo.', kw: ['empleo con apoyo']},
  {a: 30.43, b: 32.0, text: 'Si nuestra propuesta\nte interesa,'},
  {a: 32.08, b: 33.92, text: 'no dudes en contactarte\ncon nosotros.'},
  {a: 35.1, b: 36.35, text: 'Puedes comentar\nacá abajo', kw: ['comentar']},
  {a: 36.4, b: 37.87, text: 'o escribirnos un\nmensaje privado.', kw: ['mensaje privado']},
];

// momentos clave (tiempo de edición), derivados de la voz
export const T = {
  cut1: E(6.45), // cambio de hablante
  trab: E(5.12) - 0.05,
  callout: E(7.36) - 0.12, // el logo entra al decir "Equipo ADIP"
  calloutEnd: E(8.65) + 0.4,
  prog: E(9.32) - 0.05,
  form: E(9.86) - 0.05,
  socio: E(10.36) - 0.05,
  vida: E(11.12) - 0.05,
  indep: E(11.42) - 0.05,
  para: E(12.48) - 0.1, // entran las primeras fotos
  jov: E(13.72) - 0.3, // la foto ocupa todo el cuadro
  ins: E(15.9) - 0.15, // composición de dos fotos
  photosOut: E(17.78) - 0.45,
  asim: E(18.27),
  capa: E(18.89) - 0.05,
  emp: E(19.83) - 0.25, // entra la actividad sobre la entrevista
  full2: E(23.35) - 0.15, // la actividad ocupa el cuadro
  red: E(24.53) - 0.1,
  redChip: E(25.73) - 0.05,
  aco: E(27.25) - 0.2,
  fom: E(28.62) - 0.15,
  empleoChip: E(29.59) - 0.05,
  photos2Out: E(30.25) - 0.15,
  si: E(30.43),
  nos: E(33.44),
  cta1: E(35.38) - 0.2,
  cta2: E(36.7) - 0.12,
  te: E(38.74) - 0.05,
  outro: SPEECH_END - 0.05,
};
