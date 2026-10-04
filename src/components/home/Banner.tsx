"use client";

import { pieces } from "@/content/pieces";
import { copy } from "@/content/copy";
import { PhotoCover } from "../ui/PhotoCover";
import { TLink } from "../ui/TLink";

/** Banner editorial: una foto real grande + un mensaje + una acción (como en las referencias). */
export function Banner() {
  return (
    <section data-tone="dark" className="sheet theme-marfil themed px-[var(--gutter)] pb-[12svh] pt-[8svh] md:pb-[14svh] md:pt-[10svh]" aria-label={copy.banner.title}>
      <div className="relative">
        <PhotoCover piece={pieces[1]} zoom={1.05} hover={1.04} className="aspect-[4/5] md:aspect-[21/9]" rounded="round-lg" />
        <span aria-hidden className="round-lg pointer-events-none absolute inset-0" style={{ backgroundImage: "linear-gradient(to top, rgba(8,6,4,.72) 0%, rgba(8,6,4,.12) 55%, rgba(8,6,4,0) 100%)" }} />
        <div className="absolute inset-x-6 bottom-6 flex flex-wrap items-end justify-between gap-5 text-[#e4dfc1] md:inset-x-10 md:bottom-10">
          <div>
            <p className="mb-2 text-[14px] opacity-80">{copy.banner.kicker}</p>
            <h2 className="title max-w-[14ch]">{copy.banner.title}</h2>
          </div>
          <TLink href="/#hecho-a-mano" label="Hecho a mano" data-magnetic className="btn btn-light">{copy.banner.cta}</TLink>
        </div>
      </div>
    </section>
  );
}
