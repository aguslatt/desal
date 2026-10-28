import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PaginaReporte } from "@/components/reporte/Pagina";
import { lugarPorId, lugares } from "@/lib/datos";

export function generateStaticParams() {
  return lugares.map((l) => ({ slug: l.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Contar cómo te fue en ${lugarPorId(slug)?.nombre ?? "un lugar"}` };
}

export default async function Pagina({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lugar = lugarPorId(slug);
  if (!lugar) notFound();
  return (
    <PaginaReporte lugarId={lugar.id} nombre={lugar.nombre} />
  );
}
