import { redirect } from "next/navigation";
import { getSesion } from "@/lib/panel-sesion";

export default async function Panel() {
  const s = await getSesion();
  if (!s) redirect("/panel/ingresar");
  redirect(s.rol === "admin" ? "/panel/admin" : "/panel/cafe");
}
