"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { gsap, registerGsap } from "@/lib/gsap";
import { useCart, RollingCount } from "./Cart";
import { Roll, TLink } from "./ui/TLink";
import { collections } from "@/content/pieces";
import { copy } from "@/content/copy";
import { scrollToTarget } from "@/lib/scroll";

const links = [
  { label: "Objetos", href: "/#objetos" },
  { label: "Colecciones", href: "/#colecciones" },
  { label: "Mundo", href: "/#mundo" },
  { label: "Hecho a mano", href: "/#hecho-a-mano" },
];

export function Nav() {
  const { count, setOpen, registerTarget } = useCart();
  const [menu, setMenu] = useState(false);
  const pathname = usePathname();
  const sheet = useRef<HTMLDivElement>(null);

  useEffect(() => { setMenu(false); }, [pathname]);

  useEffect(() => {
    registerGsap();
    const el = sheet.current;
    if (!el) return;
    if (menu) {
      gsap.set(el, { display: "block" });
      gsap.fromTo(el, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: 0.8, ease: "expo.inOut" });
      gsap.fromTo(el.querySelectorAll(".mask-in"), { yPercent: 110 }, { yPercent: 0, duration: 0.9, stagger: 0.07, ease: "power4.out", delay: 0.25 });
    } else {
      gsap.to(el, { clipPath: "inset(0 0 100% 0)", duration: 0.6, ease: "expo.inOut", onComplete: () => { gsap.set(el, { display: "none" }); } });
    }
  }, [menu]);

  const go = () => setMenu(false);

  return (
    <>
      {/* Desktop: barra superior en difference (se lee sobre hueso y sobre el mineral del footer) */}
      <header className="pointer-events-none fixed inset-x-0 top-0 z-[8000] hidden items-start justify-between px-[var(--gutter)] pt-5 text-white mix-blend-difference md:flex">
        <TLink href="/" label="Inicio" className="serif pointer-events-auto text-[26px] leading-none" aria-label="DE SAL — inicio">DE SAL</TLink>
        <nav className="pointer-events-auto flex items-center gap-8 pt-1">
          {links.map((l) => (
            <TLink key={l.href} href={l.href} className="label"><Roll>{l.label}</Roll></TLink>
          ))}
          <button className="label flex items-center gap-1" onClick={() => setOpen(true)} aria-label={`Bolsa, ${count} objetos`}>
            <span className="lnk"><span>Bolsa</span><span>Bolsa</span></span>
            <span ref={(el) => registerTarget(el)} className="inline-block">(<RollingCount n={count} />)</span>
          </button>
        </nav>
      </header>

      {/* Mobile: barra inferior al alcance del pulgar */}
      <div className="fixed inset-x-0 bottom-0 z-[8000] grid h-14 grid-cols-3 items-center border-t border-tinta/60 bg-hueso md:hidden">
        <button className="label h-full text-left pl-[var(--gutter)]" onClick={() => setMenu((v) => !v)} aria-expanded={menu}>{menu ? "Cerrar ✕" : "Menú"}</button>
        <TLink href="/" label="Inicio" className="serif text-center text-[22px] leading-none" aria-label="DE SAL — inicio">DE SAL</TLink>
        <button className="label h-full pr-[var(--gutter)] text-right" onClick={() => setOpen(true)} aria-label={`Bolsa, ${count} objetos`}>
          Bolsa <span ref={(el) => { if (window.matchMedia("(max-width: 767px)").matches) registerTarget(el); }} className="inline-block">(<RollingCount n={count} />)</span>
        </button>
      </div>

      {/* Menú: hoja completa con titulares monumentales */}
      <div ref={sheet} className="tex-sand fixed inset-0 z-[7900] hidden pb-14 md:hidden" style={{ clipPath: "inset(0 0 100% 0)" }}>
        <div className="flex h-full flex-col justify-between px-[var(--gutter)] pb-8 pt-16">
          <nav className="flex flex-col gap-1">
            {links.map((l, i) => (
              <TLink key={l.href} href={l.href} label={l.label} onClick={go} className="block">
                <span className="mask"><span className="mask-in serif block text-[17vw] leading-[0.92]"><span className="label mr-3 align-top">0{i + 1}</span>{l.label.toUpperCase()}</span></span>
              </TLink>
            ))}
          </nav>
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-x-5 gap-y-1">
              {collections.map((c) => <span key={c.id} className="label opacity-60">{c.name}</span>)}
            </div>
            <a href={copy.instagramUrl} target="_blank" rel="noreferrer" className="label">Instagram {copy.instagram} ↗</a>
          </div>
        </div>
      </div>
    </>
  );
}

export function scrollTop() { scrollToTarget(0); }
