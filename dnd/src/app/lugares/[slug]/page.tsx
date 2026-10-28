import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FichaVista } from "@/components/FichaVista";
import { Acciones } from "@/components/ficha/Acciones";
import { MomentosTranquilos } from "@/components/ficha/MomentosTranquilos";
import { seccionesDe } from "@/components/ficha/seccionesDe";
import { Secciones } from "@/components/ficha/Secciones";
import { TusCondiciones } from "@/components/ficha/TusCondiciones";
import { EtiquetaPatrocinado } from "@/components/lugares/TarjetaLugar";
import { Foto } from "@/components/ui/Foto";
import { Icon } from "@/components/ui/Icon";
import { condicion } from "@/lib/catalogo";
import { lugarPorId, lugares, planes, reportesDemo } from "@/lib/datos";
import { discrepancias } from "@/lib/discrepancia";
import { diaCorto, formatearFecha, franja } from "@/lib/fecha";

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
  const discIds = disc.map((d) => d.condicionId);
  const secciones = seccionesDe(lugar, discIds);
  const planesDelCafe = planes.filter((p) => p.lugarId === lugar.id);

  return (
    <div className="flex flex-col gap-10 [&>*]:min-w-0">
      <FichaVista lugarId={lugar.id} />
      <nav aria-label="Migas de pan">
        <Link href="/lugares" className="tap inline-flex items-center gap-1 font-bold">
          <span className="rotate-180"><Icon name="flecha" /></span> Volver a los lugares
        </Link>
      </nav>

      <header className="card grid overflow-hidden lg:grid-cols-[1.15fr_1fr]">
        <div className="p-6 sm:p-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip chip-violet">{lugar.estilo}</span>
            <span className="font-bold text-muted">{lugar.barrio}</span>
            {lugar.patrocinado && <EtiquetaPatrocinado />}
          </div>
          <h1 className="mt-4 text-4xl leading-[1.05] sm:text-6xl">{lugar.nombre}</h1>
          <p className="mt-4 max-w-prose text-xl text-muted">{lugar.descripcion}</p>
          <dl className="mt-6 grid gap-x-8 gap-y-3 sm:grid-cols-2">
            <div><dt className="font-bold">Ubicación</dt><dd>{lugar.barrio}, CABA. {lugar.direccion}.</dd></div>
            <div><dt className="font-bold">Horarios</dt><dd>{lugar.horarios}</dd></div>
            {lugar.contacto.telefono && <div><dt className="font-bold">Teléfono</dt><dd>{lugar.contacto.telefono}</dd></div>}
            {lugar.contacto.email && <div><dt className="font-bold">Correo</dt><dd>{lugar.contacto.email}</dd></div>}
          </dl>
        </div>
        <Foto tipo={lugar.fotos[0].tipo} alt={lugar.fotos[0].alt} src={lugar.fotos[0].src} srcSet={lugar.fotos[0].srcSet} prioridad sizes="(min-width: 1024px) 45vw, 100vw" rubro={lugar.rubro} semilla={lugar.id} className="min-h-64 !rounded-none lg:h-full" />
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
        <p className="mt-1 text-sm text-muted">Son fotos ilustrativas de lugares parecidos, no de este local. <Link href="/creditos">Créditos de las fotos</Link>.</p>
        <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {lugar.fotos.slice(1).map((f) => (
            <li key={f.alt}><Foto tipo={f.tipo} alt={f.alt} src={f.src} srcSet={f.srcSet} sizes="(min-width: 640px) 50vw, 100vw" rubro={lugar.rubro} semilla={lugar.id} className="aspect-[4/3]" /></li>
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

      {planesDelCafe.length > 0 && (
        <section aria-labelledby="planes-cafe">
          <h2 id="planes-cafe" className="text-2xl font-bold">Planes en este café</h2>
          <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {planesDelCafe.map((p) => (
              <li key={p.id} className="card card-hover p-5">
                <p className="chip chip-mint">{p.tipo}</p>
                <h3 className="mt-2 text-xl leading-tight"><Link href={`/planes/${p.id}`} className="text-ink no-underline hover:underline">{p.titulo}</Link></h3>
                <p className="mt-1 text-muted">{diaCorto(p.fecha)} · {franja(p.desde, p.hasta)}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <MomentosTranquilos momentos={lugar.momentos} />

      <Secciones secciones={secciones} />
    </div>
  );
}
