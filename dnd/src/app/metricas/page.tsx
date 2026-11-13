import type { Metadata } from "next";
import { MetricasGlobales } from "@/components/MetricasGlobales";

export const metadata: Metadata = { title: "Métricas", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function Metricas() {
  return <MetricasGlobales />;
}
