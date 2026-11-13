import Link from "next/link";
import { Aviso } from "@/components/panel/Campos";
import { ConfirmarAccion } from "@/components/panel/ConfirmarAccion";
import { cafesAdmin } from "@/lib/cafes-vivos";
import { listarCuentas } from "@/lib/cuentas";
import { requerirSesion } from "@/lib/panel-sesion";
import { accionCafe } from "../../acciones";

export const metadata = { title: "Cafés" };

export default async function Cafes({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  await requerirSesion("admin");
  const { ok } = await searchParams;
  const [cafes, cuentas] = await Promise.all([cafesAdmin(), listarCuentas()]);
  const conCuenta = new Set(cuentas.map((c) => c.cafeId));
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl leading-tight font-bold sm:text-5xl">Cafés</h1>
          <p className="mt-3 max-w-prose text-muted">Los cafés que se ven en la app. Ocultar un café lo saca de la app sin borrarlo; eliminarlo lo borra.</p>
        </div>
        <Link href="/panel/admin/cafes/nuevo" className="btn">Agregar un café</Link>
      </header>
      {ok && <Aviso tipo="ok">{ok}</Aviso>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[46rem] border-collapse text-left">
          <caption className="sr-only">Cafés de Umbral</caption>
          <thead>
            <tr className="border-b-2 border-line"><th scope="col" className="py-2 pr-3">Café</th><th scope="col" className="py-2 pr-3">Barrio</th><th scope="col" className="py-2 pr-3">Estado</th><th scope="col" className="py-2 pr-3">Cuenta Pro</th><th scope="col" className="py-2">Acciones</th></tr>
          </thead>
          <tbody>
            {cafes.map(({ lugar, estado, editado }) => (
              <tr key={lugar.id} className="border-b border-[var(--border-soft)] align-top">
                <th scope="row" className="py-3 pr-3 text-left">
                  <Link href={`/panel/admin/cafes/${lugar.id}`} className="font-bold">{lugar.nombre}</Link>
                  <span className="block text-sm font-normal text-muted">{lugar.estilo}{lugar.patrocinado ? " · Patrocinado" : ""}{editado ? " · Editado" : ""}</span>
                </th>
                <td className="py-3 pr-3">{lugar.barrio}</td>
                <td className="py-3 pr-3"><span className={`chip ${estado === "activo" ? "chip-mint" : "chip-violet"}`}>{estado === "activo" ? "Visible" : "Oculto"}</span></td>
                <td className="py-3 pr-3">{conCuenta.has(lugar.id) ? "Sí" : "No"}</td>
                <td className="py-3">
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/panel/admin/cafes/${lugar.id}`} className="btn btn-ghost !min-h-11 !px-4 !py-1.5 text-sm">Editar<span className="sr-only"> {lugar.nombre}</span></Link>
                    <Link href={`/panel/admin/cafes/${lugar.id}/metricas`} className="btn btn-ghost !min-h-11 !px-4 !py-1.5 text-sm">Métricas<span className="sr-only"> de {lugar.nombre}</span></Link>
                    <form action={accionCafe}>
                      <input type="hidden" name="id" value={lugar.id} />
                      <input type="hidden" name="op" value={estado === "activo" ? "ocultar" : "mostrar"} />
                      <button type="submit" className="btn btn-ghost !min-h-11 !px-4 !py-1.5 text-sm">{estado === "activo" ? "Ocultar" : "Mostrar"}<span className="sr-only"> {lugar.nombre}</span></button>
                    </form>
                    <ConfirmarAccion
                      boton={<>Eliminar<span className="sr-only"> {lugar.nombre}</span></>}
                      titulo={`¿Eliminar ${lugar.nombre}?`}
                      descripcion="Se saca de la app y de este panel. Si tiene una cuenta Pro, la cuenta queda sin café. Esta acción no se puede deshacer."
                      confirmar="Sí, eliminar el café"
                      action={accionCafe}
                      campos={{ id: lugar.id, op: "eliminar" }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
