import type { Metadata } from "next";
import Link from "next/link";
import { cafesAdmin } from "@/lib/cafes-vivos";
import { getSesion } from "@/lib/panel-sesion";
import { salirAccion } from "./acciones";

export const metadata: Metadata = { title: { default: "Panel", template: "%s · Panel de Umbral" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const s = await getSesion();
  const nombreCafe = s?.rol === "cafe" ? (await cafesAdmin()).find((c) => c.lugar.id === s.cafeId)?.lugar.nombre : undefined;
  const enlaces =
    s?.rol === "admin"
      ? [["/panel/admin", "Resumen"], ["/panel/admin/cafes", "Cafés"], ["/panel/admin/cuentas", "Cuentas de cafés"], ["/panel/admin/metricas", "Métricas de la plataforma"]]
      : s?.rol === "cafe"
        ? [["/panel/cafe", "Mis métricas"], ["/panel/cafe/clave", "Cambiar clave"]]
        : [];
  return (
    <div>
      {s && (
        <div className="card mb-8 flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="text-sm font-bold text-muted">{s.rol === "admin" ? "Administración principal" : `Panel de ${nombreCafe ?? "tu café"}`}</p>
            <p className="font-bold">{s.u}</p>
          </div>
          <nav aria-label="Panel" className="order-last w-full sm:order-none sm:w-auto">
            <ul className="flex flex-wrap gap-1">
              {enlaces.map(([href, t]) => (
                <li key={href}><Link href={href} className="tap inline-flex items-center rounded-full px-4 font-bold no-underline hover:bg-surface-2">{t}</Link></li>
              ))}
            </ul>
          </nav>
          <form action={salirAccion}><button type="submit" className="btn btn-ghost !min-h-11 !px-4 !py-1.5 text-sm">Salir</button></form>
        </div>
      )}
      {children}
    </div>
  );
}
