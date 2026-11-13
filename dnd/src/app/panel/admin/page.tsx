import Link from "next/link";
import { cafesAdmin } from "@/lib/cafes-vivos";
import { listarCuentas } from "@/lib/cuentas";
import { programas } from "@/lib/datos";
import { requerirSesion } from "@/lib/panel-sesion";
import { store } from "@/lib/store";

export const metadata = { title: "Administración" };

export default async function Admin() {
  await requerirSesion("admin");
  const [cafes, cuentas, leads] = await Promise.all([cafesAdmin(), listarCuentas(), store().listar("leads")]);
  const activos = cafes.filter((c) => c.estado === "activo").length;
  const tiles = [
    [String(activos), "Cafés visibles en la app", "/panel/admin/cafes"],
    [String(cafes.length - activos), "Cafés ocultos", "/panel/admin/cafes"],
    [String(cuentas.filter((c) => c.estado === "activa").length), "Cuentas de cafés activas", "/panel/admin/cuentas"],
    [String(leads.length), "Cafés interesados en el plan Pro", "/panel/admin/metricas"],
    [String(programas.length), "Programas publicados", "/programas"],
  ] as const;
  return (
    <div className="flex flex-col gap-10">
      <header>
        <h1 className="text-4xl leading-tight font-bold sm:text-5xl">Administración</h1>
        <p className="mt-3 max-w-prose text-xl text-muted">Desde acá agregás y sacás cafés, creás las cuentas de los cafés que pagan el plan Pro y mirás las métricas de toda la plataforma.</p>
      </header>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {tiles.map(([n, t, href]) => (
          <li key={t} className="card min-w-0 p-5"><p className="display text-4xl font-bold">{n}</p><p className="mt-1 text-muted"><Link href={href}>{t}</Link></p></li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-3">
        <Link href="/panel/admin/cafes/nuevo" className="btn">Agregar un café</Link>
        <Link href="/panel/admin/cuentas" className="btn btn-ghost">Crear cuenta de un café Pro</Link>
      </div>
    </div>
  );
}
