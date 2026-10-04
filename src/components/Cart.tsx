"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { gsap, registerGsap } from "@/lib/gsap";
import { bySlug, img } from "@/content/pieces";
import { Ph } from "./ui/Mask";

export type CartItem = { slug: string; size: number | null; qty: number };

type Ctx = {
  items: CartItem[];
  count: number;
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (slug: string, size: number | null, from?: HTMLElement | null) => void;
  remove: (i: number) => void;
  registerTarget: (el: HTMLElement | null) => void;
};

const C = createContext<Ctx | null>(null);
export const useCart = () => {
  const c = useContext(C);
  if (!c) throw new Error("useCart fuera de CartProvider");
  return c;
};

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const target = useRef<HTMLElement | null>(null);

  useEffect(() => {
    try { const s = localStorage.getItem("desal-cart"); if (s) setItems(JSON.parse(s)); } catch {}
  }, []);
  useEffect(() => { try { localStorage.setItem("desal-cart", JSON.stringify(items)); } catch {} }, [items]);

  const registerTarget = useCallback((el: HTMLElement | null) => { target.current = el; }, []);

  const add = useCallback((slug: string, size: number | null, from?: HTMLElement | null) => {
    registerGsap();
    const commit = () => {
      setItems((cur) => {
        const i = cur.findIndex((x) => x.slug === slug && x.size === size);
        if (i >= 0) return cur.map((x, k) => (k === i ? { ...x, qty: x.qty + 1 } : x));
        return [...cur, { slug, size, qty: 1 }];
      });
      const t = target.current;
      if (t) gsap.fromTo(t, { scale: 1.35 }, { scale: 1, duration: 0.6, ease: "elastic.out(1,0.4)" });
    };
    const t = target.current;
    const p = bySlug(slug);
    if (!from || !t || !p || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { commit(); return; }

    // La pieza "vuela" físicamente al contador: arco con gravedad, se encoge y entra.
    const a = from.getBoundingClientRect();
    const b = t.getBoundingClientRect();
    const size0 = Math.min(a.width, a.height, 150);
    const ghost = document.createElement("img");
    ghost.src = img(p, "a").src;
    Object.assign(ghost.style, {
      position: "fixed", zIndex: "9600", left: `${a.left + a.width / 2 - size0 / 2}px`, top: `${a.top + a.height / 2 - size0 / 2}px`,
      width: `${size0}px`, height: `${size0}px`, objectFit: "contain", pointerEvents: "none", willChange: "transform",
    } as CSSStyleDeclaration);
    document.body.appendChild(ghost);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2);
    const dy = b.top + b.height / 2 - (a.top + a.height / 2);
    const tl = gsap.timeline({ onComplete: () => { ghost.remove(); commit(); } });
    tl.to(ghost, { scale: 1.12, rotate: -8, duration: 0.18, ease: "power2.out" })
      .to(ghost, { x: dx, duration: 0.8, ease: "power2.inOut" }, "a")
      .to(ghost, { y: dy - 120, duration: 0.34, ease: "power2.out" }, "a")
      .to(ghost, { y: dy, duration: 0.46, ease: "power2.in" }, "a+=0.34")
      .to(ghost, { scale: 0.08, rotate: 140, duration: 0.8, ease: "power3.in" }, "a");
  }, []);

  const remove = useCallback((i: number) => setItems((c) => c.filter((_, k) => k !== i)), []);
  const count = items.reduce((n, x) => n + x.qty, 0);
  const value = useMemo(() => ({ items, count, open, setOpen, add, remove, registerTarget }), [items, count, open, add, remove, registerTarget]);
  return <C.Provider value={value}>{children}</C.Provider>;
}

/** Contador con dígitos que ruedan. */
export function RollingCount({ n }: { n: number }) {
  const el = useRef<HTMLSpanElement>(null);
  const prev = useRef(n);
  useEffect(() => {
    if (prev.current === n || !el.current) { prev.current = n; return; }
    const dir = n > prev.current ? 1 : -1;
    gsap.fromTo(el.current, { yPercent: dir * 100 }, { yPercent: 0, duration: 0.5, ease: "power3.out" });
    prev.current = n;
  }, [n]);
  return (
    <span className="digit num"><span ref={el}>{n}</span></span>
  );
}

export function CartDrawer() {
  const { items, open, setOpen, remove } = useCart();
  const panel = useRef<HTMLDivElement>(null);
  const veil = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { if (open) setMounted(true); }, [open]);
  useEffect(() => {
    if (!mounted) return;
    registerGsap();
    const mobile = window.matchMedia("(max-width: 767px)").matches;
    if (open) {
      gsap.fromTo(veil.current, { opacity: 0 }, { opacity: 1, duration: 0.4 });
      gsap.fromTo(panel.current, mobile ? { yPercent: 100 } : { xPercent: 100 }, { xPercent: 0, yPercent: 0, duration: 0.7, ease: "expo.out" });
    } else {
      gsap.to(veil.current, { opacity: 0, duration: 0.3 });
      gsap.to(panel.current, mobile ? { yPercent: 100, duration: 0.5, ease: "expo.in" } : { xPercent: 100, duration: 0.5, ease: "expo.in", onComplete: () => setMounted(false) });
      if (mobile) setTimeout(() => setMounted(false), 520);
    }
  }, [open, mounted]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [setOpen]);

  if (!mounted) return null;
  return (
    <div className="fixed inset-0 z-[8600]" role="dialog" aria-label="Bolsa">
      <div ref={veil} className="absolute inset-0 bg-ink/30" onClick={() => setOpen(false)} data-cursor="link" />
      <div ref={panel} className="bg-marfil absolute bottom-0 right-0 flex max-h-[88svh] w-full flex-col border-t border-ink md:top-0 md:max-h-none md:w-[440px] md:border-l md:border-t-0">
        <div className="flex items-center justify-between border-b border-ink/30 px-5 py-4">
          <span className="label">Bolsa ({items.reduce((n, i) => n + i.qty, 0)})</span>
          <button className="label" onClick={() => setOpen(false)}>Cerrar ✕</button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-2" data-lenis-prevent>
          {items.length === 0 && (
            <p className="serif-text py-10 text-[22px] leading-tight">Todavía no hay joyas.<br /><span className="serif-i">Todo empieza con uno.</span></p>
          )}
          {items.map((it, i) => {
            const p = bySlug(it.slug);
            if (!p) return null;
            const im = img(p, "a");
            return (
              <div key={`${it.slug}-${it.size}-${i}`} className="flex items-center gap-4 border-b border-ink/20 py-4">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center bg-marfil">
                  <img src={im.src} width={im.w} height={im.h} alt="" className="max-h-20 max-w-20 object-contain" />
                </div>
                <div className="flex-1">
                  <div className="serif text-[26px]">{p.label}<span className="serif-i"> Nº{p.no}</span></div>
                  <div className="label mt-2 opacity-70">{it.size != null ? `Talle ${it.size} · ` : ""}x{it.qty} · $ <Ph>—</Ph></div>
                </div>
                <button className="label opacity-60 hover:opacity-100" onClick={() => remove(i)}>Quitar</button>
              </div>
            );
          })}
        </div>
        <div className="border-t border-ink/30 px-5 py-4">
          <div className="label mb-3 flex justify-between"><span>Subtotal</span><Ph /></div>
          <button disabled className="label w-full cursor-not-allowed bg-ink py-4 text-paper opacity-90">Finalizar compra — próximamente</button>
          <p className="label label-sm mt-3 opacity-50">v1: sin checkout. Los precios son placeholder.</p>
        </div>
      </div>
    </div>
  );
}
