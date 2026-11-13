import { BuscadorProgramas } from "@/components/programas/BuscadorProgramas";
import { obtenerLugares, programasVisibles } from "@/lib/cafes-vivos";

export const metadata = { title: "Programas adaptados para el finde", description: "Programas de todo tipo en cafés de CABA, con las condiciones de accesibilidad de cada uno." };

export default async function Pagina() {
  const lugares = await obtenerLugares();
  return <BuscadorProgramas lugares={lugares} programas={programasVisibles(lugares)} />;
}
