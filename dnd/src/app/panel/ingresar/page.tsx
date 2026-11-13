import { redirect } from "next/navigation";
import { FormIngreso } from "@/components/panel/FormIngreso";
import { getSesion } from "@/lib/panel-sesion";

export const metadata = { title: "Ingresar" };

export default async function Ingresar({ searchParams }: { searchParams: Promise<{ motivo?: string }> }) {
  if (await getSesion()) redirect("/panel");
  const { motivo } = await searchParams;
  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-4xl leading-tight font-bold">Ingresar al panel</h1>
      <p className="mt-3 mb-8 text-muted">Para la administración de Umbral y para los cafés con plan Pro. Si sos un café y todavía no tenés cuenta, escribinos desde “Para cafés”.</p>
      <FormIngreso motivo={motivo} />
    </div>
  );
}
