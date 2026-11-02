// Pure data: what is shown on the portal window, when. All times are SOURCE seconds
// (the original interview) — data.ts maps them onto the edited timeline with T().
// Image coordinates are px of the 2x screenshots of the REAL site (https://equipoadip.com.ar).

export type Cam = {t: number; y: number; z?: number; cx?: number};
export type Cur = {t: number; img?: [number, number]; scr?: [number, number]; click?: boolean};
export type HL = {t0: number; t1: number; r: [number, number, number, number]; label?: string};
export type Shot = {
  id: string;
  t0: number;
  t1: number;
  img: string;
  h: number; // image height (px)
  url: string;
  fade?: number; // transition duration
  tr?: 'fade' | 'burst' | 'slide' | 'reveal'; // how the shot enters
  cam: Cam[];
  hl: HL[];
};

export const WIN = {x: 20, y: 350, w: 1040, h: 1190, chrome: 72};
export const WIN_CLOSED = {x: 600, y: 860, w: 380, h: 480};

// ---- window life (source time) -------------------------------------------------------------
export const WINDOWS: [number, number][] = [
  [24.15, 36.6],
  [51.95, 71.6],
];

// ---- tutorial steps (chip + progress) -----------------------------------------------------
export const STEPS: {n: number; t0: number; t1: number; label: string; hint: string}[] = [
  {n: 1, t0: 24.45, t1: 32.3, label: 'Ingresá al portal', hint: 'Menú › Profesionales › Portal de trabajo'},
  {n: 2, t0: 32.3, t1: 36.6, label: 'Completá tus datos', hint: 'Nombre, DNI, mail y localidad'},
  {n: 3, t0: 52.4, t1: 58.6, label: 'Armá tu perfil', hint: 'Disponibilidad, profesión, área y CV'},
  {n: 4, t0: 58.6, t1: 68.4, label: 'Elegí tu zona', hint: 'Filtrá y abrí una búsqueda'},
  {n: 5, t0: 68.4, t1: 71.6, label: 'Postulate', hint: 'Tocá “Aplicar para el trabajo”'},
];

const URL_HOME = 'equipoadip.com.ar';
const URL_PROF = 'equipoadip.com.ar/profesionales/#trabajo';
const URL_CV = 'equipoadip.com.ar/carga-tu-cv';
const URL_JOB = 'equipoadip.com.ar/trabajo/27964';

export const SHOTS: Shot[] = [
  // ---------- demo 1 : ingresar al portal -----------------------------------------------------
  {id: 'home', t0: 24.45, t1: 26.05, img: 'home_top', h: 1920, url: URL_HOME, fade: 0,
    cam: [{t: 24.45, y: 480, z: 1}, {t: 25.3, y: 480, z: 1}, {t: 25.95, y: 330, z: 1.55, cx: 690}],
    hl: [{t0: 25.3, t1: 26.05, r: [708, 62, 94, 94]}]},
  {id: 'menu', t0: 26.05, t1: 27.8, img: 'home_menu', h: 1920, url: URL_HOME, fade: 0.12,
    cam: [{t: 26.05, y: 330, z: 1.55, cx: 690}, {t: 26.7, y: 420, z: 1.15, cx: 540}],
    hl: [{t0: 27.0, t1: 27.8, r: [0, 418, 1080, 80], label: 'Profesionales'}]},
  {id: 'menu2', t0: 27.8, t1: 29.8, img: 'home_menu2', h: 1920, url: URL_HOME, fade: 0.12,
    cam: [{t: 27.8, y: 420, z: 1.15}],
    hl: [{t0: 28.6, t1: 29.8, r: [0, 498, 1080, 80], label: 'Portal de trabajo'}]},
  {id: 'prof1', t0: 29.8, t1: 32.45, img: 'prof', h: 10702, url: URL_PROF, tr: 'burst', fade: 0,
    cam: [{t: 29.8, y: 1960, z: 1.12}, {t: 31.9, y: 1960, z: 1.2}],
    hl: [
      {t0: 30.35, t1: 31.75, r: [40, 1775, 1000, 130], label: 'Bolsa de empleo'},
      {t0: 31.95, t1: 32.45, r: [385, 1555, 310, 98], label: 'Cargá tu CV'},
    ]},
  {id: 'cv1', t0: 32.45, t1: 33.6, img: 'cv1', h: 5858, url: URL_CV, tr: 'burst', fade: 0,
    cam: [{t: 32.45, y: 1380}, {t: 33.2, y: 2040}], hl: []},
  {id: 'cv1f', t0: 33.6, t1: 36.6, img: 'cv1f', h: 5858, url: URL_CV, tr: 'reveal', fade: 0.9,
    cam: [{t: 33.6, y: 2040}, {t: 34.7, y: 2040}, {t: 35.2, y: 3380}, {t: 35.95, y: 3380}, {t: 36.3, y: 1930}],
    hl: [
      {t0: 33.7, t1: 34.75, r: [40, 1830, 1000, 640], label: 'Tus datos'},
      {t0: 35.0, t1: 35.95, r: [40, 3195, 1000, 290], label: 'Tu localidad'},
      {t0: 36.2, t1: 36.6, r: [945, 1560, 110, 130], label: 'Tu CV'},
    ]},

  // ---------- demo 2 : formulario paso a paso --------------------------------------------------
  {id: 'cv2', t0: 52.4, t1: 53.0, img: 'cv2', h: 4166, url: URL_CV, tr: 'slide', fade: 0.4,
    cam: [{t: 52.4, y: 2040}, {t: 52.9, y: 2100}],
    hl: [{t0: 52.5, t1: 53.0, r: [40, 1830, 1000, 130], label: 'Zona'}]},
  {id: 'cv2f', t0: 53.0, t1: 54.0, img: 'cv2f', h: 4166, url: URL_CV, fade: 0.15,
    cam: [{t: 53.0, y: 2100}],
    hl: [{t0: 53.1, t1: 53.85, r: [40, 1955, 1000, 125], label: 'Disponibilidad'}]},
  {id: 'cv3', t0: 54.0, t1: 54.85, img: 'cv3', h: 4948, url: URL_CV, tr: 'slide', fade: 0.4,
    cam: [{t: 54.0, y: 2040}, {t: 54.6, y: 2200}],
    hl: [{t0: 54.1, t1: 54.85, r: [40, 1830, 1000, 440], label: 'Tu profesión'}]},
  {id: 'cv3f', t0: 54.85, t1: 55.65, img: 'cv3f', h: 4948, url: URL_CV, fade: 0.15,
    cam: [{t: 54.85, y: 2200}, {t: 55.3, y: 2810}], hl: []},
  {id: 'cv4', t0: 55.65, t1: 56.35, img: 'cv4', h: 4340, url: URL_CV, tr: 'slide', fade: 0.4,
    cam: [{t: 55.65, y: 2040}, {t: 56.1, y: 2180}],
    hl: [{t0: 55.75, t1: 56.35, r: [40, 1830, 1000, 350], label: 'Tu área'}]},
  {id: 'cv4f', t0: 56.35, t1: 57.3, img: 'cv4f', h: 4340, url: URL_CV, fade: 0.15,
    cam: [{t: 56.35, y: 2180}], hl: []},
  {id: 'cv5', t0: 57.3, t1: 58.6, img: 'cv5', h: 3918, url: URL_CV, tr: 'slide', fade: 0.4,
    cam: [{t: 57.3, y: 2040}, {t: 57.8, y: 2180}],
    hl: [{t0: 57.4, t1: 58.55, r: [40, 1870, 1000, 190], label: 'Adjuntá tu CV', hint: 'Adjuntá el archivo y enviá'}]},

  // ---------- demo 2 : buscar por zona y postularse -------------------------------------------
  {id: 'prof2', t0: 58.6, t1: 59.5, img: 'prof', h: 10702, url: URL_PROF, tr: 'burst', fade: 0,
    cam: [{t: 58.6, y: 2880}],
    hl: [{t0: 58.75, t1: 59.5, r: [585, 2635, 395, 135], label: 'Zona'}]},
  {id: 'zona', t0: 59.5, t1: 60.95, img: 'prof_zona', h: 10802, url: URL_PROF, fade: 0.12,
    cam: [{t: 59.5, y: 2880}, {t: 60.1, y: 2980}],
    hl: [{t0: 60.15, t1: 60.95, r: [580, 2855, 400, 70], label: 'SUR'}]},
  {id: 'sur', t0: 60.95, t1: 68.55, img: 'prof_sur', h: 7692, url: URL_PROF, fade: 0.25,
    cam: [{t: 60.95, y: 2980}, {t: 61.7, y: 3810}, {t: 64.6, y: 3810}, {t: 65.2, y: 4500}],
    hl: [
      {t0: 61.7, t1: 64.4, r: [40, 3490, 1000, 330], label: 'Zona SUR'},
      {t0: 65.2, t1: 66.55, r: [56, 4020, 968, 500], label: 'Elegí una búsqueda'},
      {t0: 66.6, t1: 68.2, r: [565, 4318, 260, 62], label: 'En tu localidad'},
    ]},
  {id: 'job', t0: 68.55, t1: 70.85, img: 'job', h: 5516, url: URL_JOB, tr: 'burst', fade: 0,
    cam: [{t: 68.55, y: 1330}, {t: 69.5, y: 1330}, {t: 70.1, y: 2630}],
    hl: [{t0: 70.1, t1: 70.85, r: [60, 2676, 960, 122], label: 'Aplicar'}]},
  {id: 'modal', t0: 70.85, t1: 71.65, img: 'job_modal', h: 1920, url: URL_JOB, fade: 0.25,
    cam: [{t: 70.85, y: 480}], hl: []},
];

// ---- cursor (image coords resolved through the camera of the shot that is on screen) -------------
export const CURSOR: Cur[] = [
  // demo 1
  {t: 24.45, scr: [820, 640]},
  {t: 25.95, img: [755, 109], click: true},
  {t: 27.75, img: [300, 458], click: true},
  {t: 29.45, img: [300, 538], click: true},
  {t: 30.6, img: [520, 1850]},
  {t: 32.3, img: [540, 1604], click: true},
  {t: 33.4, img: [540, 1908], click: true},
  {t: 34.35, img: [540, 2390]},
  {t: 35.35, img: [540, 3418]},
  {t: 36.2, img: [990, 1625]},
  // demo 2
  {t: 52.4, scr: [820, 700]},
  {t: 52.95, img: [63, 1884], click: true},
  {t: 53.9, img: [790, 2362], click: true},
  {t: 54.75, img: [654, 2181], click: true},
  {t: 55.55, img: [790, 3144], click: true},
  {t: 56.3, img: [63, 1884], click: true},
  {t: 57.15, img: [790, 2537], click: true},
  {t: 57.95, img: [540, 1971]},
  {t: 59.35, img: [700, 2705], click: true},
  {t: 60.8, img: [602, 2894], click: true},
  {t: 62.2, img: [540, 3660]},
  {t: 65.4, img: [540, 4270]},
  {t: 66.75, img: [650, 4350]},
  {t: 68.45, img: [540, 4274], click: true},
  {t: 70.75, img: [540, 2737], click: true},
  {t: 71.3, scr: [700, 900]},
];

// ---- sound design cues: [source or output seconds, name, gain, isOutputTime] --------------------
export const SFX_CUES: {t: number; n: string; g: number; out?: boolean}[] = [
  {t: 0.35, n: 'whoosh', g: 0.55, out: true},
  {t: 0.55, n: 'pop', g: 0.45, out: true},
  {t: 1.0, n: 'pop', g: 0.4, out: true},
  {t: 1.4, n: 'pop', g: 0.4, out: true},
  {t: 2.0, n: 'swell', g: 0.5, out: true},
  {t: 1.2, n: 'tick', g: 0.35},
  {t: 5.86, n: 'pop', g: 0.4},
  {t: 9.78, n: 'pop', g: 0.35},
  {t: 20.5, n: 'pop', g: 0.35},
  {t: 22.7, n: 'pop', g: 0.45},
  {t: 24.2, n: 'whoosh', g: 0.55},
  {t: 36.5, n: 'whoosh', g: 0.5},
  {t: 36.9, n: 'pop', g: 0.45},
  {t: 41.9, n: 'pop', g: 0.4},
  {t: 44.1, n: 'pop', g: 0.4},
  {t: 46.2, n: 'pop', g: 0.4},
  {t: 51.9, n: 'whoosh', g: 0.55},
  {t: 71.5, n: 'whoosh', g: 0.55},
  {t: 48.1, n: 'whoosh', g: 0.5},
  {t: 16.35, n: 'pop', g: 0.4},
  {t: 3.38, n: 'pop', g: 0.4},
  {t: 72.0, n: 'chime', g: 0.5},
];
// step changes and every cursor click are added to the cues automatically (see tools/dump_sfx.mjs)
