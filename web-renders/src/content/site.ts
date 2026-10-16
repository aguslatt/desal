/**
 * ───────────────────────────────────────────────────────────────
 *  TODO EL CONTENIDO EDITABLE VIVE ACÁ.
 *  Buscá los marcadores  «COMPLETAR»  y  «CONFIRMAR».
 * ───────────────────────────────────────────────────────────────
 */
import type { StaticImageData } from "next/image";

import torrePlaza from "@/assets/renders/torre-plaza.webp";
import torreFachada from "@/assets/renders/torre-fachada.webp";
import oficinas from "@/assets/renders/oficinas.webp";
import banoVerde from "@/assets/renders/bano-verde.webp";
import casaLadrillo from "@/assets/renders/casa-ladrillo.webp";
import escritorio from "@/assets/renders/escritorio.webp";
import cocinaBlanca from "@/assets/renders/cocina-blanca.webp";
import casaMadera1 from "@/assets/renders/casa-madera-1.webp";
import casaMadera2 from "@/assets/renders/casa-madera-2.webp";
import casaGris from "@/assets/renders/casa-gris.webp";
import casaPileta from "@/assets/renders/casa-pileta.webp";
import dorm1 from "@/assets/renders/dormitorio-1.webp";
import dorm2 from "@/assets/renders/dormitorio-2.webp";
import dorm3 from "@/assets/renders/dormitorio-3.webp";
import banoMadera from "@/assets/renders/bano-madera.webp";
import banoMarmol from "@/assets/renders/bano-marmol.webp";
import banoBambu from "@/assets/renders/bano-bambu.webp";
import cocinaG1 from "@/assets/renders/cocina-granito-1.webp";
import cocinaG2 from "@/assets/renders/cocina-granito-2.webp";
import ogImage from "@/assets/muestras/hero.webp";

/* ───────────── 1 · Identidad y contacto ───────────── */
export const site = {
  /** true = versión provisional: muestra avisos de «imagen de muestra» y bloquea la indexación en buscadores.
   *  Pasar a false cuando haya renders y datos reales. */
  provisional: true,

  /** Nombre del arquitecto (confirmar tildes: ¿Julián Vázquez?) */
  name: "Julian Vazquez",
  /** Marca (su cuenta de Instagram) */
  brand: "vqz.render",
  /** Wordmark gigante de la portada */
  wordmark: "vqz",
  role: "Arquitecto · Visualización arquitectónica",
  /** COMPLETAR · dominio público final (para metadatos / redes) */
  url: "https://example.com",

  contact: {
    /** COMPLETAR · WhatsApp en formato internacional, solo dígitos. Ej. Argentina móvil: "5491112345678" */
    whatsapp: "",
    /** COMPLETAR · correo */
    email: "",
    /** Usuario de Instagram, sin @ */
    instagram: "vqz.render",
  },

  /** Ubicación visible en el pie (opcional). COMPLETAR o dejar vacío. */
  location: "",
} as const;

export const displayName = site.brand || site.name;

/** Mensaje de WhatsApp. Con tipo y cantidad elegidos, coincide con el texto base acordado. */
export const whatsappTemplate = {
  build: (type?: string, qty?: string) => {
    const t = type ? ` de ${type.toLowerCase()}` : "";
    const q = qty && qty !== "A definir" ? ` Necesitaría aproximadamente ${qty} imágenes.` : "";
    return `Hola, vi tu web y me gustaría cotizar renders para un proyecto${t}.${q}`;
  },
};

/* ───────────── 2 · Portada ───────────── */
export const heroContent = {
  /** Cada línea sube por separado. */
  title: ["Todavía no existe.", "Ya se puede ver."],
  lead: "Renders y visualización arquitectónica para presentar tu proyecto con la fuerza que merece.",
  /** Imagen para redes (Open Graph). Reemplazar por un render propio ≥ 1200×630. */
  image: ogImage,
  alt: "Render de una torre de oficinas",
  /** Cápsulas de la portada: 3 en celular, 4 en escritorio. */
  capsules: [
    { src: torreFachada, alt: "Render de la fachada de una torre de oficinas", focus: "50% 40%" },
    { src: banoVerde, alt: "Render de un baño con revestimiento verde y claraboya", focus: "50% 50%" },
    { src: casaMadera1, alt: "Render exterior de una vivienda con frente de madera", focus: "45% 50%" },
    { src: banoBambu, alt: "Render de un baño con bañera y pared de bambú", focus: "50% 50%" },
  ],
};

export const intro = {
  kicker: "Visualización arquitectónica",
  /** Declaración breve. Sin cifras ni logros. */
  statement:
    "Un proyecto se decide mucho antes de construirse: en cómo se lo muestra. Trabajo cada imagen con mirada de arquitecto — materiales, luz, escala y atmósfera — para que se entienda lo que vas a proponer.",
  points: ["Materiales", "Luz", "Escala", "Atmósfera"],
};

/* ───────────── 3 · Proyectos ─────────────
 *  Renders reales de Julián (recortados de capturas de su Instagram: baja resolución).
 *  Los NOMBRES y AGRUPACIONES son provisorios: confirmar con él. Idealmente reemplazar
 *  cada imagen por el original en alta.
 *  `sample: true` rotula «Imagen de muestra» (solo para placeholders).
 *  `layout` define la posición en la grilla (ver globals.css → .a-*).
 */
export type Shot = { src: StaticImageData; alt: string; note?: string };
export type Project = {
  slug: string;
  title: string;
  space: string;
  kind: string;
  description?: string;
  sample: boolean;
  category: "Exteriores" | "Interiores";
  layout?: string;
  focus?: string;
  shots: Shot[];
};

export const projects: Project[] = [
  {
    slug: "torre-corporativa",
    category: "Exteriores",
    title: "Torre corporativa",
    space: "Exterior · edificio de oficinas",
    kind: "Render exterior",
    description: "Fachada de vidrio y acceso sobre una plaza urbana, con escala humana y vegetación.",
    sample: false,
    focus: "50% 35%",
    shots: [
      { src: torreFachada, alt: "Fachada de vidrio de una torre de oficinas con vegetación en la base", note: "Fachada" },
      { src: torrePlaza, alt: "Plaza urbana con espejo de agua junto a un edificio de vidrio", note: "Plaza" },
    ],
  },
  {
    slug: "oficinas",
    category: "Interiores",
    title: "Oficinas abiertas",
    space: "Interior · oficinas",
    kind: "Render interior",
    description: "Planta libre con puestos de trabajo y vista a la ciudad.",
    sample: false, shots: [{ src: oficinas, alt: "Planta de oficinas abierta con escritorios y ventanales a la ciudad" }],
  },
  {
    slug: "vivienda-madera",
    category: "Exteriores",
    title: "Vivienda con frente de madera",
    space: "Exterior · vivienda unifamiliar",
    kind: "Render exterior",
    description: "Volúmenes simples de líneas rectas con un frente de madera que marca el acceso.",
    sample: false,
    focus: "50% 55%",
    shots: [
      { src: casaMadera1, alt: "Vivienda con frente de madera y camino de lajas sobre el césped", note: "Acceso" },
      { src: casaMadera2, alt: "Vista lateral de la vivienda con galería y parrilla", note: "Jardín" },
    ],
  },
  {
    slug: "vivienda-pileta",
    category: "Exteriores",
    title: "Vivienda con pileta",
    space: "Exterior · vivienda unifamiliar",
    kind: "Render exterior",
    sample: false,
    focus: "50% 60%",
    shots: [
      { src: casaPileta, alt: "Vivienda de una planta con pileta y jardín", note: "Pileta" },
      { src: casaGris, alt: "Frente de una vivienda gris con camino de lajas", note: "Frente" },
    ],
  },
  {
    slug: "dormitorios",
    category: "Interiores",
    title: "Dormitorios",
    space: "Interior · dormitorio",
    kind: "Render interior",
    description: "Luz natural rasante sobre madera y ladrillo blanco.",
    sample: false, shots: [
      { src: dorm1, alt: "Dormitorio con pared de ladrillo blanco y piso de madera", note: "Cama" },
      { src: dorm3, alt: "Dormitorio con ventana al arbolado", note: "Ventana" },
      { src: dorm2, alt: "Dormitorio con escritorio y ventana", note: "Escritorio" },
    ],
  },
  {
    slug: "banos",
    category: "Interiores",
    title: "Baños",
    space: "Interior · baño",
    kind: "Render interior",
    description: "Revestimientos y griferías: el material es el protagonista.",
    sample: false,
    focus: "50% 40%",
    shots: [
      { src: banoVerde, alt: "Baño con revestimiento cerámico verde y claraboya", note: "Cerámico verde" },
      { src: banoMadera, alt: "Baño con listones de madera y mampara negra", note: "Madera" },
      { src: banoBambu, alt: "Baño con bañera exenta y pared de bambú", note: "Bambú" },
      { src: banoMarmol, alt: "Baño con revestimiento símil mármol y ducha vidriada", note: "Mármol" },
    ],
  },
  {
    slug: "cocinas",
    category: "Interiores",
    title: "Cocinas",
    space: "Interior · cocina",
    kind: "Render interior",
    description: "Mesadas de piedra, iluminación puntual y carpintería en tonos neutros.",
    sample: false, shots: [
      { src: cocinaG1, alt: "Cocina con mesada de granito y lámparas colgantes", note: "Mesada" },
      { src: cocinaG2, alt: "Cocina con salida a un patio", note: "Patio" },
      { src: cocinaBlanca, alt: "Cocina blanca con isla y banquetas", note: "Cocina blanca" },
    ],
  },
  {
    slug: "casa-ladrillo",
    category: "Exteriores",
    title: "Vivienda de ladrillo",
    space: "Exterior · vivienda unifamiliar",
    kind: "Render exterior",
    sample: false,
    focus: "50% 60%",
    shots: [
      { src: casaLadrillo, alt: "Vivienda con muro de ladrillo y cochera cubierta" },
      { src: escritorio, alt: "Ambiente de trabajo con escritorio y estantes", note: "Escritorio" },
    ],
  },
];

export const projectsCta = {
  title: "¿Tenés un proyecto en mente? Hablemos.",
  text: "Contame qué necesitás mostrar y vemos juntos qué imágenes lo cuentan mejor.",
  button: "Cotizar mi proyecto",
};

/* ───────────── 4 · Servicios · CONFIRMAR con el arquitecto ───────────── */
export const services = {
  title: "Qué puedo hacer por tu proyecto",
  items: [
    {
      n: "01",
      title: "Renders de interiores",
      text: "Materiales, iluminación y atmósfera de cada ambiente, para decidir y comunicar antes de construir.",
      image: dorm1,
      alt: "Render de un dormitorio",
      sample: false,
    },
    {
      n: "02",
      title: "Renders de exteriores",
      text: "La arquitectura y su relación con el entorno: implantación, volumen, vegetación y luz.",
      image: casaMadera2,
      alt: "Render exterior de una vivienda",
      sample: false,
    },
    {
      n: "03",
      title: "Imágenes para presentación comercial",
      text: "Visuales que ayudan a comunicar un proyecto a clientes, compradores o inversores.",
      image: torrePlaza,
      alt: "Render de una plaza urbana junto a un edificio",
      sample: false,
    },
  ],
  /** Qué gana quien contrata. Sin promesas de plazos ni resultados. */
  value: [
    { title: "Una idea clara", text: "Lo que está en el plano se vuelve algo que cualquiera entiende a primera vista." },
    { title: "Decisiones visibles", text: "Los materiales, la luz y las proporciones elegidas se comunican, no se explican." },
    { title: "Presentación profesional", text: "Imágenes con criterio de arquitecto, listas para acompañar tu proyecto." },
  ],
};

/* ───────────── 5 · Sobre él · COMPLETAR / revisar con él ───────────── */
export const about = {
  kicker: "Sobre mí",
  title: "Primero arquitecto. Después, imagen.",
  /** Texto provisional, sin datos biográficos inventados. Reescribir con su voz. */
  paragraphs: [
    "Me formé como arquitecto, y eso cambia la manera de mirar un render: antes de pensar en la imagen pienso en el espacio, en cómo entra la luz, qué se toca y a qué escala se camina.",
    "Por eso cada visualización busca respetar la intención del proyecto y mostrarla con precisión, para que quien la vea entienda lo mismo que quien la diseñó.",
  ],
  image: cocinaG1,
  alt: "Render de una cocina con mesada de granito",
  sample: false,
  /** COMPLETAR · foto real del arquitecto o de su mesa de trabajo (opcional) */
};

/* ───────────── 6 · Proceso · CONFIRMAR (sin plazos ni cantidad de revisiones) ───────────── */
export const process = {
  title: "Cómo trabajamos",
  steps: [
    { n: "01", title: "Compartís tu proyecto", text: "Me contás qué necesitás mostrar y me pasás la información que tengas." },
    { n: "02", title: "Definimos el alcance", text: "Acordamos las vistas, lo que incluye cada imagen y el presupuesto." },
    { n: "03", title: "Desarrollo y revisión", text: "Voy desarrollando las imágenes y revisamos juntos los avances." },
    { n: "04", title: "Recibís los archivos", text: "Entrego los archivos finales acordados." },
  ],
  note: "Alcance, tiempos y condiciones se acuerdan en cada proyecto.",
};

/* ───────────── 7 · Contacto ───────────── */
export const contactContent = {
  kicker: "Contacto",
  title: "Contame tu proyecto.",
  text: "Con unas líneas alcanza para empezar la conversación. La consulta se abre en WhatsApp con el mensaje ya armado: la revisás y la enviás vos.",
  projectTypes: ["Vivienda", "Edificio", "Interiorismo", "Comercial / local", "Otro"],
  quantities: ["1 a 3", "4 a 6", "7 a 10", "Más de 10", "A definir"],
};

export const nav = [
  { href: "#proyectos", label: "Proyectos" },
  { href: "#servicios", label: "Servicios" },
  { href: "#proceso", label: "Proceso" },
  { href: "#contacto", label: "Contacto" },
];

/* ───────────── helpers ───────────── */
export const whatsappConfigured = site.contact.whatsapp.replace(/\D/g, "").length >= 8;
export const emailConfigured = /.+@.+\..+/.test(site.contact.email);
export const instagramConfigured = site.contact.instagram.trim().length > 0;

export const whatsappUrl = (text: string) =>
  `https://wa.me/${site.contact.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
