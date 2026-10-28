import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Recorrido } from "@/components/ficha/Recorrido";
import { lugarPorId, lugares } from "@/lib/datos";

export function generateStaticParams() {
  return lugares.map((l) => ({ slug: l.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Recorrido visual de ${lugarPorId(slug)?.nombre ?? "un lugar"}` };
}

export default async function Pagina({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lugar = lugarPorId(slug);
  if (!lugar) notFound();
  if (lugar.recorrido.length === 0) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="text-4xl font-bold">Recorrido visual de {lugar.nombre}</h1>
        <p className="mt-4 text-lg">Todavía no tenemos el recorrido de este lugar. Si ya fuiste, podés ayudarnos contando cómo te fue.</p>
        <p className="mt-6">
          <Link href={`/lugares/${lugar.id}/reporte`} className="btn">Contar cómo te fue</Link>{" "}
          <Link href={`/lugares/${lugar.id}`} className="btn btn-ghost">Volver a la ficha</Link>
        </p>
      </div>
    );
  }
  return <Recorrido lugarId={lugar.id} nombre={lugar.nombre} pasos={lugar.recorrido} rubro={lugar.rubro} />;
}
