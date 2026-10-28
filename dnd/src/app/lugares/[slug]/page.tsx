import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FichaVista } from "@/components/FichaVista";
import { Acciones } from "@/components/ficha/Acciones";
import { MomentosTranquilos } from "@/components/ficha/MomentosTranquilos";
import { Secciones } from "@/components/ficha/Secciones";
import { TusCondiciones } from "@/components/ficha/TusCondiciones";
import { EtiquetaPatrocinado } from "@/components/lugares/TarjetaLugar";
import { Foto } from "@/components/ui/Foto";
import { Icon } from "@/components/ui/Icon";
import { condicion, RUBROS } from "@/lib/catalogo";
import { lugarPorId, lugares, reportesDemo } from "@/lib/datos";
import { discrepancias } from "@/lib/discrepancia";
import { formatearFecha } from "@/lib/fecha";

export function generateStaticParams() {
  return lugares.map((l) => ({ slug: l.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const l = lugarPorId(slug);
  return { title: l ? l.nombre : "Lugar no encontrado", description: l?.descripcion };
}

export default async function Ficha({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lugar = lugarPorId(slug);
  if (!lugar) notFound();
  const disc = discrepancias(lugar, reportesDemo);

  return (
    <div className="flex flex-col gap-10">
      <FichaVista lugarId={lugar.id} />
      <nav aria-label="Migas de pan">
        <Link href="/lugares" className="tap inline-flex items-center gap-1 font-bold">
          <span className="rotate-180"><Icon name="flecha" /></span> Volver a los lugares
        </Link>
      </nav>

      <header>
        <div className="flex flex-wrap items-center gap-2 font-bold text-muted">
          {RUBROS[lugar.rubro]} · {lugar.barrio}
          {lugar.patrocinado && <EtiquetaPatrocinado />}
        </div>
        <h1 className="mt-2 text-4xl leading-tight font-bold sm:text-6xl">{lugar.nombre}</h1>
        <p className="mt-4 max-w-prose text-xl text-muted">{lugar.descripcion}</p>
        <dl className="mt-6 grid gap-x-8 gap-y-2 sm:grid-cols-2">
          <div><dt className="font-bold">Ubicación</dt><dd>{lugar.barrio}, CABA. {lugar.direccion}.</dd></div>
          <div><dt className="font-bold">Horarios</dt><dd>{lugar.horarios}</dd></div>
          {lugar.contacto.telefono && <div><dt className="font-bold">Teléfono</dt><dd>{lugar.contacto.telefono}</dd></div>}
          {lugar.contacto.email && <div><dt className="font-bold">Correo</dt><dd>{lugar.contacto.email}</dd></div>}
        </dl>
      </header>

      <Acciones id={lugar.id} nombre={lugar.nombre} tieneRecorrido={lugar.recorrido.length > 0} />

      {disc.length > 0 && (
        <section aria-labelledby="disc" className="rounded-[var(--radius)] border-2 border-[var(--warn)] bg-[var(--warn-bg)] p-6 text-[var(--warn)]">
          <h2 id="disc" className="flex items-center gap-2 text-xl font-bold">
            <Icon name="alerta" size={1.4} /> Hay reportes que contradicen lo publicado
          </h2>
          <ul className="mt-3 list-disc pl-6">
            {disc.map((d) => (
              <li key={d.condicionId}>
                {d.reportes} visitantes reportaron algo distinto sobre “{condicion(d.condicionId).etiqueta}” entre el {formatearFecha(d.desde)} y el {formatearFecha(d.hasta)}.
                Tomá este dato con cuidado y confirmalo con el lugar antes de ir.
              </li>
            ))}
          </ul>
        </section>
      )}

      <TusCondiciones lugar={lugar} discrepa={disc.map((d) => d.condicionId)} />

      <section aria-labelledby="fotos">
        <h2 id="fotos" className="text-2xl font-bold">Fotos</h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-3">
          {lugar.fotos.map((f) => (
            <li key={f.alt}><Foto tipo={f.tipo} alt={f.alt} src={f.src} className="aspect-[4/3]" /></li>
          ))}
        </ul>
      </section>

      {lugar.recorrido.length > 0 && (
        <section aria-labelledby="rec" className="card flex flex-wrap items-center justify-between gap-4 p-6">
          <div className="max-w-prose">
            <h2 id="rec" className="text-2xl font-bold">Recorrido visual</h2>
            <p className="mt-1 text-muted">{lugar.recorrido.length} pasos con foto y descripción, de la vereda a la mesa y el baño.</p>
          </div>
          <Link href={`/lugares/${lugar.id}/recorrido`} className="btn"><Icon name="ojo" /> Abrir el recorrido</Link>
        </section>
      )}

      <MomentosTranquilos momentos={lugar.momentos} />

      <Secciones lugar={lugar} discrepa={disc.map((d) => d.condicionId)} />
    </div>
  );
}
