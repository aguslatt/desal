"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { use3D } from "@/lib/device";
import { useCart } from "../Cart";
import { Ph } from "../ui/Mask";

const NecklaceScene = dynamic(() => import("@/three/NecklaceScene"), { ssr: false });
const IDEAS = ["AMOR", "LUNA", "SOL", "MAR", "VIDA"];
const LENGTHS = [{ cm: "40 cm", k: 0 }, { cm: "45 cm", k: 0.5 }, { cm: "50 cm", k: 1 }];
const clean = (s: string) => s.toUpperCase().replace(/[^A-ZÑ0-9]/g, "").slice(0, 10);

/**
 * Collares con letras: escribís las letras y ves el collar armarse en 3D (las letras caen, se mecen con el mouse).
 * Es un servicio real de DESAL: se agrega a la bolsa con el texto elegido.
 */
export function Necklace() {
  const ok3d = use3D();
  const [text, setText] = useState("AMOR");
  const [len, setLen] = useState(1);
  const [ready, setReady] = useState(false);
  const [added, setAdded] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const { add } = useCart();

  const buy = () => {
    if (!text) return;
    add("collar-letras", null, stage.current, `${text} · ${LENGTHS[len].cm}`);
    setAdded(true); setTimeout(() => setAdded(false), 1800);
  };

  return (
    <section id="collares" data-tone="light" className="sheet theme-hondo themed px-[var(--gutter)] pb-[12svh] pt-[10svh] md:pb-[14svh] md:pt-[12svh]" aria-label="Collares con letras">
      <div className="mb-8 md:mb-12">
        <p className="mb-3 text-[14px] opacity-80">Collares con letras · hechos a pedido</p>
        <h2 className="title max-w-[16ch]">Escribí tu collar.</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-[1.35fr_1fr] md:gap-5">
        {/* vista previa en vivo */}
        <div ref={stage} className="round-lg relative min-h-[52svh] overflow-hidden md:min-h-[68svh]" style={{ backgroundImage: "radial-gradient(60% 60% at 50% 52%, #8c2a1c 0%, #5a1510 60%, #2e0a07 100%)" }}>
          {!ok3d || !ready ? (
            <div className="absolute inset-0 grid place-items-center"><span className="serif text-[18vw] text-[#e8c26a] md:text-[9vw]" style={{ lineHeight: 1 }}>{text || "…"}</span></div>
          ) : null}
          {ok3d && <div className="absolute inset-0" style={{ opacity: ready ? 1 : 0, transition: "opacity .6s" }}><NecklaceScene text={text} length={LENGTHS[len].k} onReady={() => setReady(true)} /></div>}
          <span className="pill pill-ink absolute left-4 top-4">vista previa en vivo</span>
          <span className="pill pill-ink absolute bottom-4 left-4">mové el mouse: las letras se mecen</span>
        </div>

        {/* controles */}
        <div className="round-lg flex flex-col justify-between gap-7 bg-[#e4dfc1] p-6 text-[#0c0a08] md:p-9">
          <div className="flex flex-col gap-6">
            <label className="block">
              <span className="label opacity-60">1 · Tus letras (hasta 10)</span>
              <input value={text} onChange={(e) => setText(clean(e.target.value))} maxLength={10} inputMode="text" autoCapitalize="characters" spellCheck={false}
                aria-label="Letras del collar" data-cursor="link"
                className="serif mt-3 w-full rounded-full border-[1.5px] border-black/30 bg-transparent px-6 py-4 text-[28px] tracking-[-0.03em] outline-none transition-colors placeholder:opacity-30 focus:border-black md:text-[34px]" placeholder="TU NOMBRE" />
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <span className="label mr-1 opacity-60">Ideas</span>
              {IDEAS.map((w) => <button key={w} onClick={() => setText(w)} data-cursor="link" className="pill pill-line transition-colors hover:bg-black hover:text-[#e4dfc1]">{w}</button>)}
            </div>
            <div>
              <span className="label opacity-60">2 · Largo de cadena <span className="ph">medidas por definir</span></span>
              <div className="mt-3 flex gap-2" role="radiogroup" aria-label="Largo de cadena">
                {LENGTHS.map((l, i) => (
                  <button key={l.cm} role="radio" aria-checked={len === i} onClick={() => setLen(i)} data-cursor="link"
                    className="label h-11 flex-1 rounded-full border-[1.5px] border-black/30 transition-all hover:border-black aria-checked:border-black aria-checked:bg-black aria-checked:text-[#e4dfc1]">{l.cm}</button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <div className="label mb-4 flex items-center justify-between border-t border-black/20 pt-4"><span className="opacity-60">Precio</span><span>$ <Ph>—</Ph></span></div>
            <button onClick={buy} disabled={!text} data-magnetic data-cursor="link" className="btn btn-dark w-full disabled:opacity-40">{added ? "Agregado ✓" : text ? `Agregar “${text}” a la bolsa` : "Escribí tus letras"}</button>
            <p className="label mt-3 opacity-60">Hecho a mano · se prepara a pedido <Ph>plazo por definir</Ph></p>
          </div>
        </div>
      </div>
    </section>
  );
}
