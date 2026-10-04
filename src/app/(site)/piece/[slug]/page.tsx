import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { bySlug, pieces } from "@/content/pieces";
import { PieceView } from "@/components/pdp/PieceView";

export const generateStaticParams = () => pieces.map((p) => ({ slug: p.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = bySlug((await params).slug);
  return { title: p ? `${p.label} Nº${p.no} — DESAL` : "DESAL" };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const p = bySlug((await params).slug);
  if (!p) notFound();
  return <PieceView piece={p} />;
}
