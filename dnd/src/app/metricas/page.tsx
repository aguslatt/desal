import type { Metadata } from "next";
import { condiciones } from "@/lib/catalogo";
import { lugares } from "@/lib/datos";
import { resumir, type Conteo } from "@/lib/metricas";
import { store } from "@/lib/store";

export const metadata: Metadata = { title: "Métricas", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const etiquetaCond = (id: string) => condiciones.find((c) => c.id === id)?.etiqueta ?? id;
const nombreLugar = (id: string) => lugares.find((l) => l.id === id)?.nombre ?? id;

function Tabla({ titulo, filas, columna, vacio = "Todavía no hay datos." }: { titulo: string; filas: Conteo[]; columna: string; vacio?: string }) {
  return (
    <div className="card p-5">
      <h3 className="text-lg font-bold">{titulo}</h3>
      {filas.length === 0 ? (
        <p className="mt-2 text-muted">{vacio}</p>
      ) : (
        <table className="mt-3 w-full border-collapse text-left">
          <thead>
            <tr className="border-b-2 border-line"><th scope="col" className="py-1 pr-3">{columna}</th><th scope="col" className="py-1 text-right">Veces</th></tr>
          </thead>
          <tbody>
            {filas.slice(0, 10).map((f) => (
              <tr key={f.clave} className="border-b border-[var(--border-soft)]">
                <th scope="row" className="py-1 pr-3 font-normal">{f.clave}</th>
                <td className="py-1 text-right font-bold">{f.n}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function Dato({ valor, texto }: { valor: string | number; texto: string }) {
  return (
    <li className="card p-5">
      <p className="text-4xl font-bold">{valor}</p>
      <p className="mt-1 text-muted">{texto}</p>
    </li>
  );
}

export default async function Metricas() {
  const s = store();
  const [eventos, leads, reportes] = await Promise.all([s.listar("eventos"), s.listar("leads"), s.listar("reportes")]);
  const r = resumir(eventos, leads, reportes);
  const persistente = s.nombre === "Supabase";

  return (
    <div className="flex flex-col gap-12">
      <header>
        <h1 className="text-4xl font-bold sm:text-5xl">Métricas</h1>
        <p className="mt-3 max-w-prose text-muted">
          Totales de eventos anónimos. No guardamos ningún dato personal de las personas que usan la app: solo qué se hizo, no quién.
        </p>
        <p className={`mt-4 max-w-prose rounded-lg border-2 p-3 font-bold ${persistente ? "border-ok text-ok" : "border-[var(--warn)] bg-[var(--warn-bg)] text-[var(--warn)]"}`}>
          Almacenamiento: {s.nombre}.
          {!persistente && " Sin base de datos conectada, los totales pueden estar incompletos y se pierden cuando el servidor se reinicia."}
        </p>
      </header>

      <section aria-labelledby="m-uso">
        <h2 id="m-uso" className="text-2xl font-bold">Uso de la app</h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Dato valor={r.onboarding.completado} texto="Completaron “Mis necesidades”" />
          <Dato valor={r.onboarding.salteado} texto="Saltearon “Mis necesidades”" />
          <Dato valor={r.onboarding.tasa === null ? "—" : `${r.onboarding.tasa} %`} texto="Completaron sobre el total que pasó por ahí" />
          <Dato valor={r.filtros.total} texto="Veces que se usó un filtro" />
          <Dato valor={r.fichas.total} texto="Fichas vistas" />
          <Dato valor={r.recorridos} texto="Recorridos visuales abiertos" />
          <Dato valor={r.reportes.eventos} texto="Reportes enviados" />
          <Dato valor={r.reportes.guardados} texto="Reportes guardados en la base" />
        </ul>
      </section>

      <section aria-labelledby="m-filtros">
        <h2 id="m-filtros" className="text-2xl font-bold">Filtros usados</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Tabla titulo="Tipo de filtro" columna="Filtro" filas={r.filtros.porTipo} />
          <Tabla titulo="Condiciones más marcadas" columna="Condición" filas={r.filtros.condiciones.map((c) => ({ ...c, clave: etiquetaCond(c.clave) }))} />
          <Tabla titulo="Rubros" columna="Rubro" filas={r.filtros.rubros} />
          <Tabla titulo="Barrios" columna="Barrio" filas={r.filtros.barrios} />
        </div>
      </section>

      <section aria-labelledby="m-fichas">
        <h2 id="m-fichas" className="text-2xl font-bold">Fichas más vistas</h2>
        <div className="mt-4 max-w-2xl">
          <Tabla titulo="Por lugar" columna="Lugar" filas={r.fichas.porLugar.map((c) => ({ ...c, clave: nombreLugar(c.clave) }))} />
        </div>
      </section>

      <section aria-labelledby="m-com">
        <h2 id="m-com" className="text-2xl font-bold">Comercios</h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-3">
          <Dato valor={r.comercios.proClics} texto="Clics en “Quiero el plan Pro” o en relevamientos" />
          <Dato valor={r.comercios.formularios} texto="Formularios de comercio enviados" />
          <Dato valor={r.comercios.leadsGuardados} texto="Comercios guardados en la base" />
        </ul>
        {r.comercios.formularios > 0 && r.comercios.proClics > 0 && (
          <p className="mt-3 text-muted">De cada 100 clics, {Math.round((r.comercios.formularios / r.comercios.proClics) * 100)} terminaron en un formulario enviado.</p>
        )}
        {leads.length > 0 && (
          <div className="card mt-4 overflow-x-auto p-5">
            <h3 className="text-lg font-bold">Comercios interesados</h3>
            <table className="mt-3 w-full min-w-[32rem] border-collapse text-left">
              <thead><tr className="border-b-2 border-line"><th scope="col" className="py-1 pr-3">Local</th><th scope="col" className="py-1 pr-3">Rubro</th><th scope="col" className="py-1 pr-3">Interés</th><th scope="col" className="py-1">Contacto</th></tr></thead>
              <tbody>
                {(leads as { id: string; nombre: string; rubro: string; interes: string; contacto: string }[]).slice(-50).reverse().map((l) => (
                  <tr key={l.id} className="border-b border-[var(--border-soft)]">
                    <th scope="row" className="py-1 pr-3 font-normal">{l.nombre}</th><td className="py-1 pr-3">{l.rubro}</td>
                    <td className="py-1 pr-3">{l.interes === "relevamiento" ? "Relevamiento" : "Plan Pro"}</td><td className="py-1">{l.contacto}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
