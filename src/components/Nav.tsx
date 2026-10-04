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
  { label: "Joyas", href: "/#joyas" },
  { label: "Colecciones", href: "/#colecciones" },
  { label: "Hecho a mano", href: "/#hecho-a-mano" },
  { label: "Comunidad", href: "/#comunidad" },
];

export function Nav() {
  const { count, setOpen, registerTarget } = useCart();
  const [menu, setMenu] = useState(false);
  const pathname = usePathname();
  const sheet = useRef<HTMLDivElement>(null);
  const header = useRef<HTMLElement>(null);

  useEffect(() => { setMenu(false); }, [pathname]);

  // el header toma el color de la sección que tiene debajo (data-tone="light|dark": claro = texto hueso)
  useEffect(() => {
    let raf = 0, tones: HTMLElement[] = [];
    const collect = () => { tones = Array.from(document.querySelectorAll<HTMLElement>("[data-tone]")); };
    const run = () => {
      raf = 0;
      let tone = "dark";
      for (const el of tones) { const r = el.getBoundingClientRect(); if (r.top <= 44 && r.bottom >= 44) tone = el.dataset.tone ?? tone; }
      if (header.current) header.current.style.color = tone === "light" ? "#e4dfc1" : "#0c0a08";
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(run); };
    const t = setTimeout(() => { collect(); run(); }, 200);
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => { clearTimeout(t); window.removeEventListener("scroll", on); window.removeEventListener("resize", on); cancelAnimationFrame(raf); };
  }, [pathname]);

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
      {/* Desktop: barra superior que cambia de tinta según la sección */}
      <header ref={header} className="pointer-events-none fixed inset-x-0 top-0 z-[8000] hidden items-start justify-between px-[var(--gutter)] pt-5 transition-colors duration-300 md:flex" style={{ color: "#e4dfc1" }}>
        <TLink href="/" label="Inicio" className="pointer-events-auto block" aria-label="DE SAL studio — inicio">
          <span className="serif block text-[26px]" style={{ lineHeight: 0.9 }}>DE SAL</span>
          <span className="serif-i serif block pl-[34px] text-[13px]" style={{ lineHeight: 1 }}>studio</span>
        </TLink>
        <nav className="pointer-events-auto flex items-center gap-8 pt-1">
          {links.map((l) => (
            <TLink key={l.href} href={l.href} className="label"><Roll>{l.label}</Roll></TLink>
          ))}
          <button className="label flex items-center gap-1" onClick={() => setOpen(true)} aria-label={`Bolsa, ${count} joyas`}>
            <span className="lnk"><span>Bolsa</span><span>Bolsa</span></span>
            <span ref={(el) => registerTarget(el)} className="inline-block">(<RollingCount n={count} />)</span>
          </button>
        </nav>
      </header>

      {/* Mobile: barra inferior al alcance del pulgar */}
      <div className="fixed inset-x-0 bottom-0 z-[8000] grid h-14 grid-cols-3 items-center bg-[#050403] text-[#e4dfc1] md:hidden">
        <button className="label h-full text-left pl-[var(--gutter)]" onClick={() => setMenu((v) => !v)} aria-expanded={menu}>{menu ? "Cerrar ✕" : "Menú"}</button>
        <TLink href="/" label="Inicio" className="serif text-center text-[20px]" style={{ lineHeight: 1 }} aria-label="DE SAL studio — inicio">DE SAL</TLink>
        <button className="label h-full pr-[var(--gutter)] text-right" onClick={() => setOpen(true)} aria-label={`Bolsa, ${count} joyas`}>
          Bolsa <span ref={(el) => { if (window.matchMedia("(max-width: 767px)").matches) registerTarget(el); }} className="inline-block">(<RollingCount n={count} />)</span>
        </button>
      </div>

      {/* Menú: hoja completa con titulares monumentales */}
      <div ref={sheet} className="theme-red themed fixed inset-0 z-[7900] hidden pb-14 md:hidden" style={{ clipPath: "inset(0 0 100% 0)" }}>
        <div className="flex h-full flex-col justify-between px-[var(--gutter)] pb-8 pt-16">
          <nav className="flex flex-col gap-1">
            {links.map((l, i) => (
              <TLink key={l.href} href={l.href} label={l.label} onClick={go} className="block">
                <span className="mask"><span className="mask-in serif block text-[16vw]" style={{ lineHeight: 0.95 }}><span className="label mr-3 align-top">0{i + 1}</span>{l.label.toUpperCase()}</span></span>
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
