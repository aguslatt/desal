import { AccionesCuenta, FormCuenta } from "@/components/panel/Cuentas";
import { cafesAdmin } from "@/lib/cafes-vivos";
import { listarCuentas } from "@/lib/cuentas";
import { formatearFecha } from "@/lib/fecha";
import { requerirSesion } from "@/lib/panel-sesion";

export const metadata = { title: "Cuentas de cafés" };

export default async function Cuentas() {
  await requerirSesion("admin");
  const [cafes, cuentas] = await Promise.all([cafesAdmin(), listarCuentas()]);
  const nombre = new Map(cafes.map((c) => [c.lugar.id, c.lugar.nombre]));
  const sinCuenta = cafes.filter((c) => !cuentas.some((x) => x.cafeId === c.lugar.id)).map((c) => ({ id: c.lugar.id, nombre: c.lugar.nombre }));
  return (
    <div className="flex flex-col gap-10">
      <header>
        <h1 className="text-4xl leading-tight font-bold sm:text-5xl">Cuentas de cafés</h1>
        <p className="mt-3 max-w-prose text-muted">Cada café que paga el plan Pro tiene su propia cuenta y ve solo sus métricas. Vos creás la cuenta, le pasás la clave provisoria y podés suspender el acceso cuando quieras.</p>
      </header>
      <FormCuenta cafes={sinCuenta} />
      <section aria-labelledby="lista-cuentas">
        <h2 id="lista-cuentas" className="display text-2xl font-bold">Cuentas creadas</h2>
        {cuentas.length === 0 ? (
          <p className="mt-3 text-muted">Todavía no creaste ninguna cuenta.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[44rem] border-collapse text-left">
              <caption className="sr-only">Cuentas de cafés</caption>
              <thead><tr className="border-b-2 border-line"><th scope="col" className="py-2 pr-3">Correo</th><th scope="col" className="py-2 pr-3">Café</th><th scope="col" className="py-2 pr-3">Estado</th><th scope="col" className="py-2 pr-3">Creada</th><th scope="col" className="py-2">Acciones</th></tr></thead>
              <tbody>
                {cuentas.map((c) => (
                  <tr key={c.id} className="border-b border-[var(--border-soft)] align-top">
                    <th scope="row" className="py-3 pr-3 text-left font-bold">{c.email}</th>
                    <td className="py-3 pr-3">{nombre.get(c.cafeId) ?? "Café eliminado"}</td>
                    <td className="py-3 pr-3"><span className={`chip ${c.estado === "activa" ? "chip-mint" : "chip-violet"}`}>{c.estado === "activa" ? "Activa" : "Suspendida"}</span>{c.debeCambiar && <span className="block text-sm text-muted">Clave provisoria sin cambiar</span>}</td>
                    <td className="py-3 pr-3">{formatearFecha(c.creada.slice(0, 10))}</td>
                    <td className="py-3"><AccionesCuenta email={c.email} estado={c.estado} /></td>
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
