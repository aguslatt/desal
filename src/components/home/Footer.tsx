"use client";

import { collections, piecesOf } from "@/content/pieces";
import { copy } from "@/content/copy";
import { markImg } from "@/content/pieces";
import { scrollToTarget } from "@/lib/scroll";
import { Ph } from "../ui/Mask";
import { Roll, TLink } from "../ui/TLink";

/** 07 — Footer: enlaces claros arriba, DE SAL enorme (siempre junto) abajo, con la marca de oro flotando. */
export function Footer() {
  const m = markImg();
  return (
    <footer id="footer" data-tone="light" className="sheet theme-black themed relative overflow-hidden pt-[10svh]" aria-label="DE SAL studio">
      <div className="grid grid-cols-2 gap-x-6 gap-y-10 px-[var(--gutter)] md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <p className="serif-text text-[22px] leading-tight md:text-[26px]">Joyas hechas a mano.</p>
          <a href={copy.instagramUrl} target="_blank" rel="noreferrer" data-cursor="link" className="label u-line mt-5 inline-block">Instagram {copy.instagram} ↗</a>
        </div>
        <nav aria-label="Joyas">
          <p className="label mb-4 opacity-60">Joyas</p>
          <ul className="flex flex-col gap-2">
            {collections.map((c) => (
              <li key={c.id}><TLink href={`/piece/${piecesOf(c.id)[0].slug}`} label={c.name} className="serif-text text-[18px]"><Roll>{c.name.charAt(0) + c.name.slice(1).toLowerCase()}</Roll></TLink></li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Ayuda">
          <p className="label mb-4 opacity-60">Ayuda</p>
          <ul className="flex flex-col gap-2 text-[18px]">
            {["Envíos", "Cambios", "Contacto"].map((t) => <li key={t} className="serif-text">{t} <Ph /></li>)}
          </ul>
        </nav>
        <nav aria-label="Sitio" className="max-md:hidden">
          <p className="label mb-4 opacity-60">Sitio</p>
          <ul className="flex flex-col gap-2">
            {[["Lo nuevo", "/#joyas"], ["Colecciones", "/#colecciones"], ["Hecho a mano", "/#hecho-a-mano"], ["Comunidad", "/#comunidad"]].map(([t, h]) => (
              <li key={h}><TLink href={h} label={t} className="serif-text text-[18px]"><Roll>{t}</Roll></TLink></li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="relative mt-[8svh] md:mt-[10svh]">
        <img src={m.src} width={m.w} height={m.h} alt="" loading="lazy" className="pointer-events-none absolute right-[8vw] top-[-6vw] z-[2] w-[22vw] md:right-[10vw] md:top-[-8vw] md:w-[13vw]" style={{ animation: "mark-float 7s ease-in-out infinite", filter: "drop-shadow(0 24px 20px rgba(0,0,0,.5))" }} />
        <div className="serif select-none whitespace-nowrap px-[2.4vw] text-[25.5vw] text-rojo" style={{ lineHeight: 0.78, transform: "translateY(7%)" }} aria-hidden>DE SAL</div>
        <span className="serif-i serif absolute bottom-[26%] right-[5vw] z-[2] text-[5vw] md:text-[4vw]" style={{ lineHeight: 1 }} aria-hidden>studio</span>
      </div>
      <div className="label relative z-[3] flex items-center justify-between bg-[#050403] px-[var(--gutter)] py-4 opacity-90">
        <span>© DE SAL studio · v1 · piezas y datos <span className="ph">placeholder</span></span>
        <button onClick={() => scrollToTarget(0)} className="u-line" data-cursor="link">Volver arriba ↑</button>
      </div>
      <style>{`@keyframes mark-float{0%,100%{transform:translateY(0) rotate(-6deg)}50%{transform:translateY(-16px) rotate(6deg)}}`}</style>
    </footer>
  );
}
