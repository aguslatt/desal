import Link from "next/link";
import { notFound } from "next/navigation";
import { PanelAnalitica } from "@/components/panel/PanelAnalitica";
import { cargarPanel, periodoValido } from "@/lib/analitica-datos";
import { requerirSesion } from "@/lib/panel-sesion";

export const metadata = { title: "Métricas de un café" };

export default async function MetricasDeCafe({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ dias?: string }> }) {
  await requerirSesion("admin");
  const { id } = await params;
  const { dias } = await searchParams;
  const datos = await cargarPanel(id, periodoValido(dias));
  if (!datos) notFound();
  return (
    <div className="flex flex-col gap-6">
      <Link href="/panel/admin/cafes" className="tap inline-flex items-center font-bold">← Volver a los cafés</Link>
      <PanelAnalitica datos={datos} base={`/panel/admin/cafes/${id}/metricas`} dias={periodoValido(dias)} comoAdmin />
    </div>
  );
}
