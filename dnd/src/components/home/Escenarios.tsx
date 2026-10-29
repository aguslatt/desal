"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { track } from "@/lib/analytics";
import { condicion } from "@/lib/catalogo";
import { guardar } from "@/lib/prefs";

/** Escenarios cotidianos que precargan condiciones concretas. Nunca se pregunta por un diagnóstico. */
const ESCENARIOS = [
  { titulo: "Quiero entrar sin vueltas", texto: "Sin escalones, con la puerta ancha y un baño que se pueda usar.", ids: ["ingreso_sin_escalones", "ancho_puerta", "bano_accesible"], tono: "bg-surface-2 border-accent text-accent" },
  { titulo: "Prefiero escribir", texto: "Atención por escrito, avisos visuales y, si se puede, personal con LSA.", ids: ["atencion_escrito", "avisos_visuales", "lsa"], tono: "bg-mint-bg border-mint text-mint" },
  { titulo: "Busco tranquilidad", texto: "Música baja, un espacio tranquilo y horarios con poca gente.", ids: ["musica_baja", "espacio_tranquilo", "baja_concurrencia"], tono: "bg-surface-2 border-accent text-accent" },
  { titulo: "Necesito ver antes", texto: "Carta en lectura fácil, fotos para anticipar la visita y reserva.", ids: ["carta_facil", "visita_anticipada", "reserva"], tono: "bg-mint-bg border-mint text-mint" },
  { titulo: "Cuido lo que como", texto: "Opciones sin TACC o veganas, alérgenos informados y texturas a pedido.", ids: ["preparaciones", "alergenos", "texturas"], tono: "bg-surface-2 border-accent text-accent" },
  { titulo: "Me canso rápido", texto: "Baño cerca, lugares para descansar y distancias cortas.", ids: ["bano_cerca", "lugares_descanso", "distancias_cortas"], tono: "bg-mint-bg border-mint text-mint" },
];

export function Escenarios() {
  const router = useRouter();
  const elegir = (ids: string[], titulo: string) => {
    guardar({ necesidades: ids, onboarding: "listo" });
    track("filtro_usado", { filtro: "escenario", valor: titulo });
    router.push("/lugares");
  };
  return (
    <ul className="stagger grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {ESCENARIOS.map((e, i) => (
        <li key={e.titulo} style={{ "--i": i } as React.CSSProperties}>
          <button type="button" onClick={() => elegir(e.ids, e.titulo)} className="card card-hover group flex h-full w-full cursor-pointer flex-col items-start gap-3 p-6 text-left">
            <span aria-hidden="true" className={`display inline-flex size-11 items-center justify-center rounded-2xl border-2 text-lg font-extrabold ${e.tono}`}>{i + 1}</span>
            <span className="display text-xl leading-tight font-bold">{e.titulo}</span>
            <span className="text-muted">{e.texto}</span>
            <span className="mt-auto flex flex-wrap gap-1.5 pt-1">
              {e.ids.map((id) => (
                <span key={id} className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-bold text-muted">{condicion(id).corta}</span>
              ))}
            </span>
            <span className="inline-flex items-center gap-1.5 font-bold text-accent">
              Ver cafés <Icon name="flecha" />
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
