import { condiciones, ESTILOS } from "./catalogo";
import { fotosCreditos, imagen } from "./fotos";
import type { Dato, Estado, FuenteTipo, Lugar, MomentoTranquilo, Nivel, PasoRecorrido } from "./types";

/**
 * Formulario de alta y edición de un café (panel de administración).
 * Todo es texto plano que llega de un <form>; acá se valida y se arma el `Lugar` que usa el resto de la app.
 */
export type EntradaCafe = Record<string, string | undefined>;
export type ErroresCafe = Record<string, string>;

export const FRANJAS_FORM = ["Mañana (9 a 12 h)", "Mediodía (12 a 15 h)", "Tarde (15 a 19 h)", "Noche (19 a 23 h)"] as const;
export const FUENTES: { v: FuenteTipo; t: string }[] = [
  { v: "equipo", t: "Relevamiento del equipo" },
  { v: "comercio", t: "Informado por el café" },
  { v: "visitantes", t: "Visitantes" },
];

export const slugificar = (t: string) =>
  t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const numero = (s?: string) => (s === undefined || s.trim() === "" ? NaN : Number(s.replace(",", ".")));
const limpio = (s?: string) => (s ?? "").trim();

export interface OpcionesValidacion {
  /** ids ya usados (activos, ocultos o eliminados): un café nuevo no puede repetirlos */
  idsOcupados: Set<string>;
  /** al editar, el id del café que se edita */
  idEditado?: string;
  /** hoy, para no aceptar fechas futuras */
  ahora?: Date;
}

export function validarCafe(e: EntradaCafe, op: OpcionesValidacion): { ok: true; lugar: Lugar } | { ok: false; errores: ErroresCafe } {
  const err: ErroresCafe = {};
  const ahora = op.ahora ?? new Date();
  const hoyISO = ahora.toISOString().slice(0, 10);

  const nombre = limpio(e.nombre);
  if (nombre.length < 3 || nombre.length > 80) err.nombre = "El nombre tiene que tener entre 3 y 80 caracteres.";
  const id = op.idEditado ?? slugificar(nombre);
  if (!err.nombre) {
    if (!id) err.nombre = "El nombre tiene que incluir letras o números.";
    else if (!op.idEditado && op.idsOcupados.has(id)) err.nombre = "Ya hay un café con ese nombre. Elegí otro.";
  }

  const estilo = limpio(e.estilo);
  if (!(ESTILOS as string[]).includes(estilo)) err.estilo = "Elegí el estilo de café.";
  const barrio = limpio(e.barrio);
  if (barrio.length < 2 || barrio.length > 40) err.barrio = "Escribí el barrio (entre 2 y 40 caracteres).";
  const direccion = limpio(e.direccion);
  if (direccion.length < 3 || direccion.length > 120) err.direccion = "Escribí la dirección o una referencia (entre 3 y 120 caracteres).";
  const lat = numero(e.lat);
  const lng = numero(e.lng);
  if (!(lat > -34.71 && lat < -34.52)) err.lat = "La latitud tiene que estar dentro de CABA (entre -34,71 y -34,52).";
  if (!(lng > -58.54 && lng < -58.33)) err.lng = "La longitud tiene que estar dentro de CABA (entre -58,54 y -58,33).";
  const descripcion = limpio(e.descripcion);
  if (descripcion.length < 10 || descripcion.length > 400) err.descripcion = "La descripción tiene que tener entre 10 y 400 caracteres.";
  const horarios = limpio(e.horarios);
  if (horarios.length < 3 || horarios.length > 100) err.horarios = "Escribí los horarios (entre 3 y 100 caracteres).";
  const telefono = limpio(e.telefono);
  if (telefono && !/^[\d\s()+\-.]{6,30}$/.test(telefono)) err.telefono = "El teléfono solo puede tener números, espacios, + y guiones.";
  const email = limpio(e.email);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) err.email = "Escribí un correo válido (nombre@ejemplo.com).";
  const web = limpio(e.web);
  if (web && !/^https:\/\/[^\s]+\.[^\s]{2,}$/.test(web)) err.web = "La web tiene que empezar con https://";

  // Fotos: se eligen de la biblioteca (con licencia y crédito) y el texto alternativo sale de la foto.
  const fotos: Lugar["fotos"] = [];
  for (const slot of ["fachada", "interior", "mesa"] as const) {
    const fid = limpio(e[`foto_${slot}`]);
    const f = fotosCreditos.find((x) => x.id === fid);
    if (!f) err[`foto_${slot}`] = "Elegí una foto de la lista.";
    else fotos.push({ tipo: slot, alt: `${f.alt}. Foto ilustrativa: no es ${nombre || "este café"}.`, ...imagen(f.id), credito: f.id });
  }

  // Condiciones de accesibilidad: lo que no se carga queda "Sin información", nunca "sí".
  const datos: Record<string, Dato> = {};
  for (const c of condiciones) {
    const estado = (limpio(e[`c_${c.id}_estado`]) || "sin_info") as Estado;
    if (!["confirmado", "no_disponible", "sin_info"].includes(estado)) {
      err[`c_${c.id}`] = "Estado no válido.";
      continue;
    }
    if (estado === "sin_info") continue;
    const fuente = limpio(e[`c_${c.id}_fuente`]) as FuenteTipo;
    const fecha = limpio(e[`c_${c.id}_fecha`]);
    const valor = limpio(e[`c_${c.id}_valor`]);
    const cant = numero(e[`c_${c.id}_cant`]);
    if (!FUENTES.some((f) => f.v === fuente)) err[`c_${c.id}`] = "Elegí quién aportó el dato.";
    else if (!ISO.test(fecha) || Number.isNaN(Date.parse(fecha))) err[`c_${c.id}`] = "Elegí la fecha del dato.";
    else if (fecha > hoyISO) err[`c_${c.id}`] = "La fecha del dato no puede ser futura.";
    else if (fuente === "visitantes" && !(Number.isInteger(cant) && cant >= 1)) err[`c_${c.id}`] = "Indicá cuántos visitantes lo reportaron (1 o más).";
    else if (c.minimo !== undefined && estado === "confirmado" && !(numero(valor) > 0)) err[`c_${c.id}`] = `Indicá el valor en ${c.valor?.unidad ?? "número"} (por ejemplo ${c.valor?.ejemplo}).`;
    else if (valor.length > 100) err[`c_${c.id}`] = "El valor es demasiado largo (máximo 100 caracteres).";
    else {
      datos[c.id] = {
        estado,
        ...(valor ? { valor: (c.minimo !== undefined || c.valor?.unidad) && Number.isFinite(numero(valor)) ? numero(valor) : valor } : {}),
        fuente: { tipo: fuente, fecha, ...(fuente === "visitantes" ? { cantidad: cant } : {}) },
      };
    }
  }

  const momentos: MomentoTranquilo[] = FRANJAS_FORM.map((franja, i) => {
    const nivel = (k: string): Nivel => {
      const n = Number(e[`mom_${i}_${k}`] || 2);
      return (n === 1 || n === 3 ? n : 2) as Nivel;
    };
    return { franja, ruido: nivel("ruido"), concurrencia: nivel("gente") };
  });

  if (Object.keys(err).length > 0) return { ok: false, errores: err };

  const lugar: Lugar = {
    id,
    nombre,
    rubro: "cafe",
    estilo: estilo as Lugar["estilo"],
    barrio,
    direccion,
    lat,
    lng,
    descripcion,
    horarios,
    contacto: { ...(telefono ? { telefono } : {}), ...(email ? { email } : {}), ...(web ? { web } : {}) },
    patrocinado: e.patrocinado === "on",
    fotos,
    recorrido: [],
    momentos,
    datos,
  };
  if (e.recorrido === "on") lugar.recorrido = generarRecorrido(lugar);
  return { ok: true, lugar };
}

/**
 * Recorrido visual de cinco pasos escrito a partir de los datos del café: si hay escalones, lo dice;
 * si no se relevó, lo dice. Así el texto nunca contradice lo cargado.
 */
export function generarRecorrido(l: Lugar): PasoRecorrido[] {
  const st = (id: string) => l.datos[id]?.estado ?? "sin_info";
  const t = (id: string, si: string, no: string, sin: string) => (st(id) === "confirmado" ? si : st(id) === "no_disponible" ? no : sin);
  const unir = (...p: string[]) => p.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
  const ancho = l.datos.ancho_puerta;
  return [
    {
      tipo: "vereda", titulo: "Llegás a la vereda", alt: `Ilustración de ejemplo de la vereda frente a ${l.nombre}.`,
      descripcion: unir(`Llegás por la calle de ${l.direccion}.`, t("estacionamiento", "Hay estacionamiento cerca.", "No hay estacionamiento cerca.", "No tenemos datos de estacionamiento.")),
    },
    {
      tipo: "ingreso", titulo: "El ingreso", alt: `Ilustración de ejemplo de la puerta de ingreso de ${l.nombre}.`,
      descripcion: unir(
        t("ingreso_sin_escalones", "La puerta está a nivel de la vereda, sin escalones.", "Hay escalones para entrar.", "Todavía no relevamos si hay escalones."),
        t("rampa", `Rampa: ${l.datos.rampa?.valor ?? "disponible"}.`, "No hay rampa.", ""),
        ancho?.estado === "confirmado" ? `La puerta mide ${ancho.valor} cm.` : "",
      ),
    },
    {
      tipo: "interior", titulo: "Adentro del local", alt: `Ilustración de ejemplo del salón de ${l.nombre}, con las mesas y los pasillos.`,
      descripcion: unir(t("circulacion_libre", "Los pasillos están libres y se puede circular sin chocar con muebles.", "Los pasillos son angostos o están ocupados.", "No relevamos el ancho de los pasillos."), t("buena_iluminacion", "Hay buena iluminación.", "La luz es escasa.", "")),
    },
    {
      tipo: "mesa", titulo: "Tu mesa", alt: `Ilustración de ejemplo de una mesa de ${l.nombre}.`,
      descripcion: t("mesas_altura", "Hay mesas a altura accesible.", "No hay mesas a altura accesible.", "No tenemos datos sobre la altura de las mesas."),
    },
    {
      tipo: "bano", titulo: "El baño", alt: `Ilustración de ejemplo del baño de ${l.nombre}.`,
      descripcion: unir(t("bano_accesible", "El baño tiene barras y espacio para girar.", "El baño no es accesible.", "No relevamos el baño."), t("bano_cerca", "Queda cerca del ingreso.", "", "")),
    },
  ];
}

/** Valores iniciales del formulario a partir de un café existente (para editar). */
export function entradaDesde(l: Lugar): EntradaCafe {
  const e: EntradaCafe = {
    nombre: l.nombre, estilo: l.estilo, barrio: l.barrio, direccion: l.direccion, lat: String(l.lat), lng: String(l.lng),
    descripcion: l.descripcion, horarios: l.horarios, telefono: l.contacto.telefono, email: l.contacto.email, web: l.contacto.web,
    patrocinado: l.patrocinado ? "on" : undefined, recorrido: l.recorrido.length > 0 ? "on" : undefined,
  };
  for (const f of l.fotos) e[`foto_${f.tipo}`] = f.credito;
  l.momentos.forEach((m, i) => { e[`mom_${i}_ruido`] = String(m.ruido); e[`mom_${i}_gente`] = String(m.concurrencia); });
  for (const [id, d] of Object.entries(l.datos)) {
    e[`c_${id}_estado`] = d.estado;
    if (d.valor !== undefined) e[`c_${id}_valor`] = String(d.valor);
    if (d.fuente) { e[`c_${id}_fuente`] = d.fuente.tipo; e[`c_${id}_fecha`] = d.fuente.fecha; if (d.fuente.cantidad) e[`c_${id}_cant`] = String(d.fuente.cantidad); }
  }
  return e;
}
