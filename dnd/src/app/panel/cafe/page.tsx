import { notFound } from "next/navigation";
import { Aviso } from "@/components/panel/Campos";
import { PanelAnalitica } from "@/components/panel/PanelAnalitica";
import { cargarPanel, periodoValido } from "@/lib/analitica-datos";
import { requerirSesion } from "@/lib/panel-sesion";

export const metadata = { title: "Mis métricas" };

export default async function PanelCafe({ searchParams }: { searchParams: Promise<{ dias?: string; ok?: string }> }) {
  const s = await requerirSesion("cafe");
  const { dias, ok } = await searchParams;
  const datos = await cargarPanel(s.cafeId!, periodoValido(dias));
  if (!datos) notFound();
  return (
    <div className="flex flex-col gap-8">
      {ok === "clave" && <Aviso tipo="ok">Listo: cambiaste tu clave.</Aviso>}
      <PanelAnalitica datos={datos} base="/panel/cafe" dias={periodoValido(dias)} />
    </div>
  );
}
