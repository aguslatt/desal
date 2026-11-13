import { FormClave } from "@/components/panel/Cuentas";
import { requerirSesion } from "@/lib/panel-sesion";

export const metadata = { title: "Cambiar clave" };

export default async function Clave() {
  const s = await requerirSesion("cafe", { permitirCambiar: true });
  return (
    <div>
      <h1 className="mb-6 text-4xl leading-tight font-bold">Cambiar clave</h1>
      <FormClave obligatorio={!!s.cambiar} />
    </div>
  );
}
