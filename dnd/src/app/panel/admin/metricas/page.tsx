import { MetricasGlobales } from "@/components/MetricasGlobales";
import { requerirSesion } from "@/lib/panel-sesion";

export const metadata = { title: "Métricas de la plataforma" };

export default async function MetricasPanel() {
  await requerirSesion("admin");
  return (
    <div>
      <h1 className="mb-8 text-4xl leading-tight font-bold sm:text-5xl">Métricas de la plataforma</h1>
      <MetricasGlobales conTitulo={false} />
    </div>
  );
}
