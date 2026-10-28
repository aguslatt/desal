import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { seccionesDe } from "@/components/ficha/seccionesDe";
import { Secciones } from "@/components/ficha/Secciones";
import { TusCondiciones } from "@/components/ficha/TusCondiciones";
import { EtiquetaPatrocinado } from "@/components/lugares/TarjetaLugar";
import { AccionesPlan } from "@/components/planes/AccionesPlan";
import { Foto } from "@/components/ui/Foto";
import { Icon } from "@/components/ui/Icon";
import { lugarPorId, planes, planPorId, reportesDemo } from "@/lib/datos";
import { discrepancias } from "@/lib/discrepancia";
import { diaCorto, franja } from "@/lib/fecha";
import { planComoLugar } from "@/lib/planes";

export function generateStaticParams() {
  return planes.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const p = planPorId(id);
  return { title: p ? p.titulo : "Plan no encontrado", description: p?.descripcion };
}

export default async function Plan({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const plan = planPorId(id);
  const lugar = plan && lugarPorId(plan.lugarId);
  if (!plan || !lugar) notFound();
  const merged = planComoLugar(plan, lugar);
  // Los reportes contradicen datos del café, salvo los que el plan define por su cuenta.
  const discIds = discrepancias(lugar, reportesDemo).map((d) => d.condicionId).filter((c) => !(c in plan.datos));
  const foto = lugar.fotos[1] ?? lugar.fotos[0];

  return (
    <div className="flex flex-col gap-10 [&>*]:min-w-0">
      <nav aria-label="Migas de pan">
        <Link href="/planes" className="tap inline-flex items-center gap-1 font-bold">
          <span className="rotate-180"><Icon name="flecha" /></span> Volver a los planes
        </Link>
      </nav>

      <header className="card grid overflow-hidden lg:grid-cols-[1.15fr_1fr]">
        <div className="p-6 sm:p-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip chip-mint">{plan.tipo}</span>
            <span className="font-bold text-muted">{plan.precio}</span>
            {lugar.patrocinado && <EtiquetaPatrocinado />}
          </div>
          <h1 className="mt-4 text-4xl leading-[1.05] sm:text-6xl">{plan.titulo}</h1>
          <p className="mt-4 max-w-prose text-xl text-muted">{plan.descripcion}</p>
          <dl className="mt-6 grid gap-x-8 gap-y-3 sm:grid-cols-2">
            <div><dt className="font-bold">Cuándo</dt><dd>{diaCorto(plan.fecha)}, {franja(plan.desde, plan.hasta)}</dd></div>
            <div><dt className="font-bold">Dónde</dt><dd><Link href={`/lugares/${lugar.id}`} className="tap inline-flex items-center font-bold">{lugar.nombre}</Link><br />{lugar.barrio}. {lugar.direccion}.</dd></div>
            <div><dt className="font-bold">Precio</dt><dd>{plan.precio}</dd></div>
            <div><dt className="font-bold">Reserva</dt><dd>{plan.reserva ? "Con reserva previa" : "Sin reserva"}</dd></div>
          </dl>
        </div>
        <Foto tipo={foto.tipo} alt={foto.alt} src={foto.src} srcSet={foto.srcSet} prioridad sizes="(min-width: 1024px) 45vw, 100vw" rubro={lugar.rubro} semilla={lugar.id} className="min-h-64 !rounded-none lg:h-full" />
      </header>

      <AccionesPlan planId={plan.id} titulo={plan.titulo} lugarId={lugar.id} lugarNombre={lugar.nombre} />

      <TusCondiciones lugar={merged} discrepa={discIds} />

      <p className="max-w-prose rounded-2xl border-2 border-line p-4 text-muted">
        Las condiciones del plan se suman a las del café. Lo que depende del momento (intérprete de LSA, ruido, concurrencia, luz) solo vale si el plan lo dice. Cuando un dato figura en los dos, vale el del plan.
      </p>

      <Secciones secciones={seccionesDe(merged, discIds)} />
    </div>
  );
}
