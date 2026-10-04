import { notFound } from "next/navigation";
import { RenderStage } from "./RenderStage";

// Ruta de uso interno: la usa scripts/render-pieces.mjs para generar los renders PLACEHOLDER.
export default async function RenderPage({ params, searchParams }: {
  params: Promise<{ kind: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  if (process.env.NODE_ENV === "production" && !process.env.ENABLE_RENDER_ROUTE) notFound();
  const { kind } = await params;
  const { view } = await searchParams;
  return <RenderStage kind={kind} view={view ?? "a"} />;
}
