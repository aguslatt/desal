import cuts from './cuts.json';

export const FPS = 30;
export const SPEECH_END = cuts.total; // 38.37 s de voz editada
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

// Subtítulos corregidos a mano. a/b en tiempo del original. kw = palabras destacadas.
export type Cap = {a: number; b: number; text: string; kw?: string[]};
export const CAPS: Cap[] = [
  {a: 0.3, b: 1.95, text: 'Hoy en día,\nuna de cada diez personas', kw: ['una de cada diez']},
  {a: 1.94, b: 3.3, text: 'con certificado de discapacidad'},
  {a: 3.34, b: 4.46, text: 'y en edad laboral'},
  {a: 4.46, b: 5.85, text: 'tiene un trabajo registrado.', kw: ['trabajo registrado']},
  {a: 6.55, b: 7.3, text: 'Por eso mismo,'},
  {a: 7.4, b: 8.34, text: 'desde Equipo ADIP', kw: ['Equipo ADIP']},
  {a: 8.34, b: 9.4, text: 'creamos el programa'},
  {a: 9.42, b: 12.04, text: 'de formación sociolaboral\ny vida independiente', kw: ['sociolaboral', 'vida independiente']},
  {a: 12.04, b: 13.4, text: 'para poder preparar'},
  {a: 13.44, b: 15.26, text: 'a los jóvenes y adultos\ncon discapacidad', kw: ['jóvenes y adultos']},
  {a: 15.26, b: 17.7, text: 'a insertarse en\nel mundo laboral.', kw: ['mundo laboral']},
  {a: 18.2, b: 19.44, text: 'Asimismo, capacitamos'},
  {a: 19.44, b: 20.05, text: 'a empresas', kw: ['empresas']},
  {a: 20.06, b: 23.06, text: 'para poder insertar\na estas personas'},
  {a: 23.06, b: 24.36, text: 'en el mundo laboral'},
  {a: 24.36, b: 25.9, text: 'y poder crear una red'},
  {a: 26.04, b: 27.94, text: 'de contención y\nacompañamiento', kw: ['contención', 'acompañamiento']},
  {a: 27.94, b: 30.1, text: 'fomentando el\nempleo con apoyo.', kw: ['empleo con apoyo']},
  {a: 30.44, b: 31.98, text: 'Si nuestra propuesta\nte interesa,'},
  {a: 32.1, b: 33.7, text: 'no dudes en contactarte\ncon nosotros.'},
  {a: 35.05, b: 36.26, text: 'Puedes comentar\nacá abajo', kw: ['comentar']},
  {a: 36.26, b: 37.9, text: 'o escribirnos un\nmensaje privado.', kw: ['mensaje privado']},
];

export const T = {
  wipe1: 5.5, // la cabeza naranja crece -> escena del programa
  callout: E(7.4) - 0.1, // logo grande
  calloutEnd: E(8.34) + 0.15,
  programa: E(8.96),
  w1: E(9.7) - 0.12,
  w2: E(10.22) - 0.12,
  w3: E(11.06) - 0.1,
  s3: E(12.04) - 0.05,
  jov: E(13.44) - 0.1,
  back: E(17.04) - 0.15,
  s4: 17.74,
  emp: E(19.44) - 0.15,
  s5: E(24.36) - 0.1,
  aco: E(26.98) - 0.15,
  empleo: E(27.94) - 0.1,
  s6: E(30.38),
  nos: E(32.6),
  s7: E(34.4),
  comentar: E(35.28) - 0.1,
  escribir: E(36.26) - 0.1,
  s8: E(38.2),
  te: E(38.52) - 0.05,
  wipe2: SPEECH_END - 0.45,
  outro: SPEECH_END + 0.05,
};
