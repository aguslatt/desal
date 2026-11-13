import { Buscador } from "@/components/lugares/Buscador";
import { barriosDe, idsConDiscrepancia, obtenerLugares } from "@/lib/cafes-vivos";

export const metadata = { title: "Cafés" };

export default async function Pagina() {
  const lugares = await obtenerLugares();
  return <Buscador lugares={lugares} barrios={barriosDe(lugares)} conDiscrepancia={idsConDiscrepancia(lugares)} />;
}
