import { requerirSesion } from "@/lib/panel-sesion";

export const metadata = { title: "Mis métricas" };

export default async function PanelCafe() {
  await requerirSesion("cafe");
  return <h1 className="text-4xl font-bold">Mis métricas</h1>;
}
