export type Estado = "confirmado" | "no_disponible" | "sin_info";

export type DimensionId =
  | "movilidad"
  | "vision"
  | "audicion"
  | "intelectual"
  | "psicosocial"
  | "visceral"
  | "alimentacion";

/** Por ahora Umbral se enfoca en cafés. El modelo admite otros rubros: sumalos acá y en catalogo.ts. */
export type Rubro = "cafe";

export type Estilo =
  | "De barrio"
  | "Café de especialidad"
  | "Café con jardín"
  | "Café-librería"
  | "Café cultural"
  | "Café-bar"
  | "Panadería con salón";

export interface Dimension {
  id: DimensionId;
  nombre: string;
  descripcion: string;
}

export interface Condicion {
  id: string;
  dimension: DimensionId;
  /** Hecho observable, redactado en positivo. Ej: "Ingreso sin escalones". */
  etiqueta: string;
  /** Versión corta para frases ("sin escalones en el ingreso"). */
  corta: string;
  /** Si el dato lleva un valor (cm, horarios, etc.). */
  valor?: { unidad?: string; ejemplo: string };
  /** Para valores numéricos: mínimo para considerar que la condición se cumple. */
  minimo?: number;
  /** Pregunta del reporte post-visita y qué respuesta contradice un dato confirmado. */
  reporte?: { pregunta: string; contradiceConRespuesta: "si" | "no" };
  /** Depende del horario o del evento (LSA, ruido, concurrencia): un plan no lo hereda del café, lo tiene que declarar. */
  dependeDelMomento?: boolean;
  /** Versión en lectura fácil y pictograma ARASAAC (palabra clave). */
  facil: string;
  picto?: string;
}

export type FuenteTipo = "equipo" | "comercio" | "visitantes";

export interface Fuente {
  tipo: FuenteTipo;
  /** ISO yyyy-mm-dd. Fecha de relevamiento, de carga o del último reporte. */
  fecha: string;
  /** Solo para visitantes: cantidad de reportes que lo confirman. */
  cantidad?: number;
}

export interface Dato {
  estado: Estado;
  valor?: string | number;
  fuente?: Fuente;
}

export type Nivel = 1 | 2 | 3;

export interface MomentoTranquilo {
  franja: string;
  ruido: Nivel;
  concurrencia: Nivel;
}

export type FotoTipo = "vereda" | "ingreso" | "interior" | "mesa" | "bano" | "fachada";

export interface Foto {
  tipo: FotoTipo;
  alt: string;
  src?: string;
  /** Versiones de distinto ancho, ej. "/f-480.webp 480w, /f-960.webp 960w". */
  srcSet?: string;
  /** id en fotos.json (autor y licencia), si la foto requiere atribución. */
  credito?: string;
}

export interface PasoRecorrido extends Foto {
  titulo: string;
  descripcion: string;
}

export interface Lugar {
  id: string;
  nombre: string;
  rubro: Rubro;
  /** Estilo de café: sirve para filtrar y para mostrar en tarjetas y fichas. */
  estilo: Estilo;
  barrio: string;
  /** Referencia de ubicación (en la demo no usamos direcciones reales). */
  direccion: string;
  lat: number;
  lng: number;
  descripcion: string;
  horarios: string;
  contacto: { telefono?: string; email?: string; web?: string };
  patrocinado: boolean;
  fotos: Foto[];
  recorrido: PasoRecorrido[];
  momentos: MomentoTranquilo[];
  /** Condiciones no listadas se consideran "sin_info". */
  datos: Record<string, Dato>;
}

export type TipoPlan = "Música" | "Taller" | "Charla" | "Cata" | "Juegos" | "Lectura" | "Cine" | "Feria" | "Paseo" | "Brunch";

/** Un plan lo organiza un café. Sus condiciones se suman a las del café (las del plan mandan). */
export interface Plan {
  id: string;
  titulo: string;
  tipo: TipoPlan;
  lugarId: string;
  /** yyyy-mm-dd */
  fecha: string;
  desde: string;
  hasta: string;
  precio: "Gratis" | "Con consumición";
  reserva: boolean;
  descripcion: string;
  datos: Record<string, Dato>;
}

export type Respuesta = "si" | "no" | "no_se" | "no_aplica";

export interface Reporte {
  id: string;
  lugarId: string;
  fecha: string;
  /** "visita" = Contar cómo te fue. "dato" = Reportar un dato incorrecto. */
  tipo?: "visita" | "dato";
  horario?: string;
  respuestas: Record<string, Respuesta>;
  /** ¿Encontraste algo diferente de lo publicado? */
  difiere?: Respuesta;
  /** Solo "dato": condición que se reporta como incorrecta. */
  corrige?: string;
  comentario?: string;
  /** Hay una foto adjunta (simulada en el MVP: no se sube el archivo). */
  conFoto?: boolean;
}

export interface Coincidencia {
  total: number;
  cumple: number;
  sinInfo: number;
  noDisponible: number;
  /** 0 = cumple todo, 1 = hay condiciones sin información, 2 = algo no disponible. */
  grupo: 0 | 1 | 2;
  detalle: Record<string, Estado>;
}

export interface Discrepancia {
  condicionId: string;
  reportes: number;
  desde: string;
  hasta: string;
}
