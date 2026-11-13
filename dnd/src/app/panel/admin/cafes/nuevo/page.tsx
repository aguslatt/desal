import Link from "next/link";
import { FormCafe } from "@/components/panel/FormCafe";
import { barriosDe, obtenerLugares } from "@/lib/cafes-vivos";
import { fotosCreditos } from "@/lib/fotos";
import { requerirSesion } from "@/lib/panel-sesion";

export const metadata = { title: "Agregar un café" };

export default async function Nuevo() {
  await requerirSesion("admin");
  const barrios = barriosDe(await obtenerLugares());
  return (
    <div>
      <Link href="/panel/admin/cafes" className="tap inline-flex items-center font-bold">← Volver a los cafés</Link>
      <h1 className="mt-4 mb-8 text-4xl leading-tight font-bold sm:text-5xl">Agregar un café</h1>
      <FormCafe valores={{}} fotos={fotosCreditos} barrios={barrios} />
    </div>
  );
}
