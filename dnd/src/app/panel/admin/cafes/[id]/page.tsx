import Link from "next/link";
import { notFound } from "next/navigation";
import { FormCafe } from "@/components/panel/FormCafe";
import { entradaDesde } from "@/lib/cafe-form";
import { barriosDe, cafesAdmin } from "@/lib/cafes-vivos";
import { fotosCreditos } from "@/lib/fotos";
import { requerirSesion } from "@/lib/panel-sesion";

export const metadata = { title: "Editar café" };

export default async function Editar({ params }: { params: Promise<{ id: string }> }) {
  await requerirSesion("admin");
  const { id } = await params;
  const todos = await cafesAdmin();
  const cafe = todos.find((c) => c.lugar.id === id);
  if (!cafe) notFound();
  return (
    <div>
      <Link href="/panel/admin/cafes" className="tap inline-flex items-center font-bold">← Volver a los cafés</Link>
      <h1 className="mt-4 mb-8 text-4xl leading-tight font-bold sm:text-5xl">Editar {cafe.lugar.nombre}</h1>
      <FormCafe valores={entradaDesde(cafe.lugar)} fotos={fotosCreditos} barrios={barriosDe(todos.map((c) => c.lugar))} idEditado={id} />
    </div>
  );
}
