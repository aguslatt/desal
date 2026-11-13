import Link from "next/link";
import { EstadoBadge } from "@/components/ui/EstadoBadge";
import { Icon } from "@/components/ui/Icon";
import { condicion } from "@/lib/catalogo";
import { MINIMO_BUSQUEDAS } from "@/lib/analitica";
import { PERIODOS, type DatosPanel } from "@/lib/analitica-datos";
import { formatearFecha } from "@/lib/fecha";
import { GraficoLineas, Leyenda, MapaCalor } from "./Graficos";
import { Aviso } from "./Campos";

const TIPO_CONTACTO: Record<string, string> = { telefono: "Llamadas", correo: "Correos", web: "Sitio web", otro: "Otros" };

function Variacion({ v, anterior }: { v: number | null; anterior: number }) {
  if (v === null) return <span className="text-sm text-muted">{anterior === 0 ? "Sin datos del período anterior" : ""}</span>;
  if (v === 0) return <span className="text-sm font-bold text-muted">Igual que el período anterior</span>;
  return (
    <span className={`inline-flex items-center gap-1 text-sm font-bold ${v > 0 ? "text-ok" : "text-no"}`}>
      <span aria-hidden="true">{v > 0 ? "▲" : "▼"}</span>
      {Math.abs(v)} % {v > 0 ? "más" : "menos"} que el período anterior
    </span>
  );
}

/**
 * Analítica de un café, estilo Google Analytics pero de Umbral: visitas, qué buscan las personas, contactos,
 * horarios con más movimiento y reportes. Todo anónimo, y cada gráfico tiene su tabla de texto.
 */
export function PanelAnalitica({ datos, base, dias, comoAdmin }: { datos: DatosPanel; base: string; dias: number; comoAdmin?: boolean }) {
  const { lugar, analitica: a, esEjemplo, discrepancias: disc } = datos;
  const fichas = a.kpis.find((k) => k.clave === "fichas")!;
  const serie = [
    { nombre: "Visitas a tu ficha", valores: a.porDia.map((d) => d.fichas) },
    { nombre: "Visitas a tus programas", valores: a.porDia.map((d) => d.programas), discontinua: true },
  ];
  const maxBus = Math.max(1, ...a.busquedas.map((b) => b.n));
  const mejorar = a.busquedas.filter((b) => b.estado !== "confirmado").slice(0, 3);

  return (
    <div className="flex flex-col gap-12">
      <header>
        {comoAdmin && <p className="chip chip-violet mb-3">Vista de la administración</p>}
        <h1 className="text-4xl leading-tight font-bold sm:text-5xl">{comoAdmin ? `Métricas de ${lugar.nombre}` : "Mis métricas"}</h1>
        <p className="mt-3 max-w-prose text-xl text-muted">
          {comoAdmin ? "Así ve este café su panel." : `Cómo le va a ${lugar.nombre} en Umbral.`} Todo es anónimo: nunca mostramos datos de personas.
        </p>
        <nav aria-label="Período" className="mt-5">
          <ul className="flex flex-wrap gap-2">
            {PERIODOS.map((p) => (
              <li key={p}>
                <Link href={`${base}?dias=${p}`} aria-current={p === dias ? "page" : undefined} className={`tap chip no-underline ${p === dias ? "bg-accent text-[var(--accent-text)] border-2 border-accent" : "chip-violet"}`}>
                  Últimos {p} días
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-muted">Del {formatearFecha(a.desde)} al {formatearFecha(a.hasta)}, hora de Buenos Aires.</p>
        </nav>
      </header>

      {esEjemplo && (
        <Aviso tipo="info">Estás viendo datos de ejemplo: todavía hay pocas visitas reales a esta ficha. Apenas haya suficientes, vas a ver tus números.</Aviso>
      )}

      {disc.length > 0 && (
        <section aria-labelledby="p-disc" className="rounded-[var(--radius)] border-2 border-[var(--warn)] bg-[var(--warn-bg)] p-6 text-[var(--warn)]">
          <h2 id="p-disc" className="flex items-center gap-2 text-xl font-bold"><Icon name="alerta" size={1.4} /> Hay reportes que contradicen lo que publicaste</h2>
          <ul className="mt-3 list-disc pl-6">
            {disc.map((d) => <li key={d.condicionId}>{d.reportes} visitantes reportaron algo distinto sobre “{condicion(d.condicionId).etiqueta}” entre el {formatearFecha(d.desde)} y el {formatearFecha(d.hasta)}. Revisalo y actualizá el dato si cambió.</li>)}
          </ul>
        </section>
      )}

      <section aria-labelledby="p-resumen">
        <h2 id="p-resumen" className="display text-2xl font-bold">Resumen</h2>
        <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {a.kpis.map((k) => (
            <li key={k.clave} className="card min-w-0 p-5">
              <p className="display text-4xl font-bold">{k.actual}</p>
              <p className="mt-1 font-bold">{k.etiqueta}</p>
              <p className="mt-2"><Variacion v={k.variacion} anterior={k.anterior} /></p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="p-visitas">
        <h2 id="p-visitas" className="display text-2xl font-bold">Visitas por día</h2>
        <div className="card mt-4 p-5">
          <Leyenda series={serie} />
          <div className="mt-3"><GraficoLineas fechas={a.porDia.map((d) => d.fecha)} series={serie} /></div>
          <details className="mt-4">
            <summary className="tap flex cursor-pointer items-center font-bold">Ver los datos en una tabla</summary>
            <div className="mt-3 max-h-96 overflow-auto">
              <table className="w-full border-collapse text-left">
                <caption className="sr-only">Visitas por día a tu ficha y a tus programas</caption>
                <thead><tr className="border-b-2 border-line"><th scope="col" className="py-1 pr-3">Día</th><th scope="col" className="py-1 pr-3">Tu ficha</th><th scope="col" className="py-1">Tus programas</th></tr></thead>
                <tbody>
                  {a.porDia.map((d) => (
                    <tr key={d.fecha} className="border-b border-[var(--border-soft)]"><th scope="row" className="py-1 pr-3 font-normal">{formatearFecha(d.fecha)}</th><td className="py-1 pr-3 font-bold">{d.fichas}</td><td className="py-1 font-bold">{d.programas}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>
        {fichas.actual === 0 && !esEjemplo && <p className="mt-3 text-muted">Todavía no hubo visitas a tu ficha en este período.</p>}
      </section>

      <section aria-labelledby="p-buscan">
        <h2 id="p-buscan" className="display text-2xl font-bold">Qué buscan las personas que llegan a tu ficha</h2>
        <p className="mt-2 max-w-prose text-muted">Son las condiciones que marcaron antes de entrar. Si buscan algo que todavía no tenés confirmado, es una guía concreta de qué mejorar o qué relevar.</p>
        {!a.busquedasVisibles ? (
          <p className="card mt-4 p-5">Todavía hay pocas visitas con condiciones marcadas ({a.visitasConCondiciones} de las {MINIMO_BUSQUEDAS} necesarias). Para cuidar el anonimato, mostramos esto recién cuando hay suficientes.</p>
        ) : (
          <>
            {mejorar.length > 0 && (
              <p className="mt-4 rounded-2xl border-2 border-accent bg-surface-2 p-4 font-bold">
                Para mejorar: {mejorar.map((m) => condicion(m.id).corta).join(", ")}. {mejorar.length === 1 ? "Es una" : "Son"} de las condiciones que más buscan y todavía no {mejorar.length === 1 ? "la tenés" : "las tenés"} confirmada{mejorar.length === 1 ? "" : "s"}.
              </p>
            )}
            <div className="card mt-4 overflow-x-auto p-5">
              <table className="w-full min-w-[34rem] border-collapse text-left">
                <caption className="sr-only">Condiciones más buscadas por quienes llegaron a tu ficha, y su estado en tu café</caption>
                <thead><tr className="border-b-2 border-line"><th scope="col" className="py-2 pr-3">Condición</th><th scope="col" className="py-2 pr-3">Personas</th><th scope="col" className="py-2 pr-3"><span className="sr-only">Proporción</span></th><th scope="col" className="py-2">En tu café</th></tr></thead>
                <tbody>
                  {a.busquedas.slice(0, 10).map((b) => (
                    <tr key={b.id} className="border-b border-[var(--border-soft)] align-middle">
                      <th scope="row" className="py-2 pr-3 text-left font-normal">{condicion(b.id).etiqueta}</th>
                      <td className="py-2 pr-3 font-bold">{b.n}</td>
                      <td className="w-1/4 py-2 pr-3" aria-hidden="true"><div className="h-3 rounded-full bg-surface-2"><div className="h-3 rounded-full bg-accent" style={{ width: `${(b.n / maxBus) * 100}%` }} /></div></td>
                      <td className="py-2"><EstadoBadge estado={b.estado} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <section aria-labelledby="p-horarios">
        <h2 id="p-horarios" className="display text-2xl font-bold">Cuándo hay más interés en tu ficha</h2>
        <p className="mt-2 max-w-prose text-muted">Visitas por día de la semana y franja horaria. Cuanto más oscuro, más visitas; el número está en cada casilla.</p>
        <div className="card mt-4 p-5"><MapaCalor calor={a.calor} max={a.calorMax} /></div>
      </section>

      <section aria-labelledby="p-contactos" className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 id="p-contactos" className="display text-2xl font-bold">Contactos</h2>
          <div className="card mt-4 p-5">
            {a.contactos.length === 0 ? (
              <p className="text-muted">Todavía nadie tocó “llamar” o “escribir” en tu ficha en este período.</p>
            ) : (
              <table className="w-full border-collapse text-left">
                <caption className="sr-only">Contactos recibidos por tipo</caption>
                <thead><tr className="border-b-2 border-line"><th scope="col" className="py-1 pr-3">Tipo</th><th scope="col" className="py-1 text-right">Cantidad</th></tr></thead>
                <tbody>{a.contactos.map((c) => <tr key={c.tipo} className="border-b border-[var(--border-soft)]"><th scope="row" className="py-1 pr-3 font-normal">{TIPO_CONTACTO[c.tipo] ?? c.tipo}</th><td className="py-1 text-right font-bold">{c.n}</td></tr>)}</tbody>
              </table>
            )}
          </div>
        </div>
        <div>
          <h2 id="p-reportes" className="display text-2xl font-bold">Reportes de visitantes</h2>
          <div className="card mt-4 p-5">
            {a.reportes.length === 0 ? (
              <p className="text-muted">No recibiste reportes en este período.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-[var(--border-soft)]">
                {a.reportes.slice(0, 8).map((r) => (
                  <li key={r.id} className="py-3 first:pt-0 last:pb-0">
                    <p className="font-bold">{formatearFecha(r.fecha)} · {r.tipo === "dato" ? "Dato incorrecto" : "Cómo les fue"}{r.horario ? ` · ${r.horario}` : ""}</p>
                    {r.tipo === "dato" && r.corrige && <p className="text-sm text-muted">Sobre: {condicion(r.corrige).etiqueta}</p>}
                    {r.difiere === "si" && <p className="text-sm font-bold text-[var(--warn)]">Encontró algo distinto de lo publicado.</p>}
                    {r.comentario && <p className="mt-1 text-muted">“{r.comentario}”</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <p className="max-w-prose rounded-2xl border-2 border-line p-4 text-sm text-muted">
        Cómo cuidamos la privacidad: no guardamos nombres, IP ni identificadores. Los números son totales; lo que buscan las personas aparece solo cuando hay al menos {MINIMO_BUSQUEDAS} visitas con condiciones marcadas, y los comentarios de los reportes los escriben las propias personas.
      </p>
    </div>
  );
}
