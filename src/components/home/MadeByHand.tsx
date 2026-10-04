"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, registerGsap } from "@/lib/gsap";
import { use3D, prefersReduced } from "@/lib/device";
import { copy } from "@/content/copy";
import { still, pieces } from "@/content/pieces";
import { Ph } from "../ui/Mask";
import type { ProcessState } from "@/three/ProcessScene";

const ProcessScene = dynamic(() => import("@/three/ProcessScene"), { ssr: false });
const fb = still(pieces[2]);

/**
 * 05 — Hecho a mano, CONTADO POR EL OBJETO: al scrollear, un anillo pasa de cera → metal fundido → limado → pulido
 * (material, rugosidad y piedras cambian en tiempo real). Es el proceso, no un texto sobre el proceso.
 */
export function MadeByHand() {
  const run = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const state = useRef<ProcessState>({ p: 0 });
  const [step, setStep] = useState(0);
  const [active, setActive] = useState(false);
  const [ready, setReady] = useState(false);
  const bigRef = useRef<HTMLDivElement>(null);
  const ok3d = use3D();
  const h = copy.hand;

  useEffect(() => {
    registerGsap();
    const st = state.current;
    const t = ScrollTrigger.create({
      trigger: run.current, start: "top top", end: "bottom bottom", scrub: prefersReduced() ? false : 0.35,
      onUpdate: (s) => { st.p = s.progress; setStep(Math.min(3, Math.floor(s.progress * 4 - 0.001 + 0.001))); },
    });
    const v = ScrollTrigger.create({ trigger: run.current, start: "top bottom", end: "bottom top", onToggle: (s) => setActive(s.isActive) });
    return () => { t.kill(); v.kill(); };
  }, []);

  useEffect(() => {
    if (!bigRef.current) return;
    gsap.fromTo(bigRef.current, { yPercent: 40, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.6, ease: "power3.out" });
  }, [step]);

  const s = h.steps[step];

  return (
    <section id="hecho-a-mano" data-tone="light" className="sheet theme-red themed" aria-label="Hecho a mano">
      <div ref={run} className="relative" style={{ height: "430svh" }}>
        <div className="sticky top-0 grid h-svh min-h-[620px] grid-rows-[1fr_auto] gap-4 px-[var(--gutter)] pb-[7.5rem] pt-[88px] md:grid-cols-2 md:grid-rows-1 md:gap-8 md:pb-10 md:pt-[96px]">
          {/* texto del paso */}
          <div className="order-2 flex flex-col justify-between md:order-1">
            <div className="hidden md:block">
              <p className="mb-3 text-[14px] opacity-80">Hecho a mano</p>
              <h2 className="title">{h.title}</h2>
            </div>
            <div>
              <div className="overflow-hidden"><div ref={bigRef} key={step} className="title !text-[clamp(56px,9vw,150px)]" style={{ lineHeight: 0.9 }}>{s.t}</div></div>
              <p className="serif-text mt-3 max-w-md text-[17px] leading-snug md:text-[22px]">{s.d} <Ph /></p>
              <div className="mt-5 flex items-center gap-2" role="list" aria-label="Pasos">
                {h.steps.map((x, i) => (
                  <span key={x.n} role="listitem" className={`label grid h-9 place-items-center rounded-full border-[1.5px] px-4 transition-all duration-500 ${i === step ? "border-transparent bg-ink text-paper" : i < step ? "border-ink/60 bg-ink/15" : "border-ink/40 opacity-60"}`}>{x.n}</span>
                ))}
              </div>
              <p className="label mt-4 hidden opacity-60 md:block"><span className="ph">{h.footnote}</span> · seguí scrolleando ↓</p>
            </div>
          </div>

          {/* el objeto */}
          <div ref={stage} data-cursor="drag" className="round-lg relative order-1 min-h-0 overflow-hidden md:order-2" style={{ backgroundImage: "radial-gradient(58% 58% at 50% 54%, #c4402a 0%, #7a1a12 58%, #3f0d09 100%)" }}>
            <div className="absolute inset-0 flex items-center justify-center" style={{ opacity: ready ? 0 : 1, transition: "opacity .5s" }}>
              {fb && <img src={fb.src} width={fb.w} height={fb.h} alt="" loading="lazy" className="w-[60%]" />}
            </div>
            {ok3d && <div className="absolute inset-0" style={{ opacity: ready ? 1 : 0, transition: "opacity .6s" }}>
              <ReadyGate onReady={() => setReady(true)} />
              <ProcessScene state={state} active={active} />
            </div>}
            <span className="pill pill-ink absolute left-4 top-4">paso {s.n} / 04</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/** pequeño retardo para mostrar el 3D cuando ya renderizó */
function ReadyGate({ onReady }: { onReady: () => void }) {
  useEffect(() => { const t = setTimeout(onReady, 600); return () => clearTimeout(t); }, [onReady]);
  return null;
}
