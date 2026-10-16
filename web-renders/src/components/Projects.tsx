"use client";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { projects, projectsCta } from "@/content/site";
import Rv from "./Rv";
import Sample from "./Sample";

const pad = (n: number) => String(n + 1).padStart(2, "0");
const FILTERS = ["Todos", "Exteriores", "Interiores"] as const;
type Filter = (typeof FILTERS)[number];

const Icon = {
  close: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" /></svg>,
  prev: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 4l-8 8 8 8" /></svg>,
  next: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4l8 8-8 8" /></svg>,
};

export default function Projects() {
  const [filter, setFilter] = useState<Filter>("Todos");
  const list = useMemo(() => projects.filter((p) => filter === "Todos" || p.category === filter), [filter]);

  const [pi, setPi] = useState<number | null>(null); // índice dentro de `list`
  const [si, setSi] = useState(0);
  const [anim, setAnim] = useState(0);
  const dlg = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);

  const rail = useRef<HTMLDivElement>(null);
  const prog = useRef<HTMLElement>(null);
  const drag = useRef({ down: false, x: 0, left: 0, moved: false });

  const p = pi === null ? null : list[pi] ?? null;

  /* ── carrusel: progreso, flechas, arrastre con mouse ── */
  const updateProg = useCallback(() => {
    const r = rail.current;
    if (!r || !prog.current) return;
    const max = r.scrollWidth - r.clientWidth;
    const ratio = r.clientWidth / r.scrollWidth;
    const pos = max > 0 ? r.scrollLeft / max : 0;
    prog.current.style.width = `${Math.max(ratio, 0.12) * 100}%`;
    prog.current.style.left = `${pos * (1 - Math.max(ratio, 0.12)) * 100}%`;
  }, []);
  useEffect(() => {
    updateProg();
    window.addEventListener("resize", updateProg);
    return () => window.removeEventListener("resize", updateProg);
  }, [updateProg, list]);

  const scrollBy = (dir: 1 | -1) => {
    const r = rail.current;
    if (!r) return;
    const card = r.querySelector<HTMLElement>(".card");
    r.scrollBy({ left: dir * ((card?.offsetWidth ?? 320) + 16), behavior: "smooth" });
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || !rail.current) return;
    drag.current = { down: true, x: e.clientX, left: rail.current.scrollLeft, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d.down || !rail.current) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 6 && !d.moved) {
      d.moved = true;
      rail.current.classList.add("drag");
    }
    if (d.moved) rail.current.scrollLeft = d.left - dx;
  };
  const endDrag = () => {
    drag.current.down = false;
    if (drag.current.moved) {
      requestAnimationFrame(() => rail.current?.classList.remove("drag"));
    }
  };

  /* ── visor ── */
  const open = (i: number, el: HTMLElement) => {
    if (drag.current.moved) {
      drag.current.moved = false;
      return;
    }
    opener.current = el;
    setPi(i);
    setSi(0);
    setAnim((a) => a + 1);
  };

  useEffect(() => {
    const d = dlg.current;
    if (!d) return;
    if (pi !== null && !d.open) {
      d.showModal();
      document.documentElement.style.overflow = "hidden";
    }
    if (pi === null && d.open) d.close();
  }, [pi]);

  const close = useCallback(() => {
    document.documentElement.style.overflow = "";
    setPi(null);
    requestAnimationFrame(() => opener.current?.focus({ preventScroll: true }));
  }, []);

  const go = useCallback(
    (dir: 1 | -1) => {
      if (pi === null || !list[pi]) return;
      const n = list[pi].shots.length;
      setSi((s) => (s + dir + n) % n);
      setAnim((a) => a + 1);
    },
    [pi, list],
  );
  const goProject = useCallback(
    (dir: 1 | -1) => {
      setPi((cur) => (cur === null ? cur : (cur + dir + list.length) % list.length));
      setSi(0);
      setAnim((a) => a + 1);
    },
    [list.length],
  );

  useEffect(() => {
    if (pi === null) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [pi, go]);

  return (
    <section id="proyectos" className="panel panel-dark work" aria-labelledby="proyectos-t">
      <div className="wrap">
        <div className="sec-head">
          <Rv>
            <p className="label acc kicker">Selección · {String(list.length).padStart(2, "0")}</p>
            <h2 id="proyectos-t" className="display sec-title">Proyectos</h2>
          </Rv>
          <Rv delay={0.1}>
            <div className="filters glass-d" role="group" aria-label="Filtrar proyectos">
              {FILTERS.map((f) => (
                <button key={f} aria-pressed={filter === f} onClick={() => { setFilter(f); rail.current?.scrollTo({ left: 0 }); }}>{f}</button>
              ))}
            </div>
          </Rv>
        </div>
      </div>

      <div
        ref={rail}
        className="rail"
        onScroll={updateProg}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        role="list"
        aria-label="Proyectos"
      >
        {list.map((pr, i) => (
          <article key={pr.slug} className="card" role="listitem">
            <button
              className="card-btn"
              aria-haspopup="dialog"
              aria-label={`Abrir ${pr.title}: ${pr.shots.length} ${pr.shots.length === 1 ? "imagen" : "imágenes"}`}
              onClick={(e) => open(i, e.currentTarget)}
              draggable={false}
            >
              <Image
                src={pr.shots[0].src}
                alt={pr.shots[0].alt}
                fill
                sizes="(min-width: 900px) 34vw, 80vw"
                quality={75}
                placeholder="blur"
                loading={i < 2 ? "eager" : "lazy"}
                draggable={false}
                style={{ objectPosition: pr.focus ?? "50% 50%" }}
              />
              <span className="card-idx glass-d num">{pad(i)}</span>
              <span className="card-sample"><Sample show={pr.sample} /></span>
              <span className="card-info glass-d">
                <span>
                  <h3>{pr.title}</h3>
                  <p>{pr.space}</p>
                </span>
                <span className="plus" aria-hidden="true">+</span>
              </span>
            </button>
          </article>
        ))}
      </div>

      <div className="rail-bar">
        <div className="rail-prog" aria-hidden="true"><i ref={prog} /></div>
        <button className="round" onClick={() => scrollBy(-1)} aria-label="Proyectos anteriores">{Icon.prev}</button>
        <button className="round" onClick={() => scrollBy(1)} aria-label="Proyectos siguientes">{Icon.next}</button>
      </div>

      <Rv className="work-cta">
        <div>
          <h3 className="display">{projectsCta.title}</h3>
          <p>{projectsCta.text}</p>
        </div>
        <a href="#contacto" className="btn btn-dark">{projectsCta.button} <span className="arr" aria-hidden="true">→</span></a>
      </Rv>

      {/* ───────── Vista ampliada ───────── */}
      <dialog
        ref={dlg}
        className="lb"
        aria-label={p ? `${p.title} — vista ampliada` : "Vista ampliada"}
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
        onClick={(e) => {
          if (e.target === dlg.current) close();
        }}
      >
        {p && (
          <div className="lb-shell">
            <div
              className="lb-stage"
              onTouchStart={(e) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
              onTouchEnd={(e) => {
                const t = touch.current;
                touch.current = null;
                if (!t) return;
                const dx = e.changedTouches[0].clientX - t.x;
                const dy = e.changedTouches[0].clientY - t.y;
                if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) go(dx < 0 ? 1 : -1);
              }}
            >
              <figure className="lb-fig" data-anim="1" key={`${pi}-${si}-${anim}`}>
                <Image src={p.shots[si].src} alt={p.shots[si].alt} fill sizes="(min-width: 900px) 72vw, 100vw" quality={82} placeholder="blur" loading="eager" />
              </figure>
              <div className="lb-top">
                <p className="lb-count glass-d num" style={{ margin: 0 }} aria-live="polite">
                  {pad(pi!)} / {pad(list.length - 1)} <span className="mute-d">· {si + 1}/{p.shots.length}</span>
                </p>
                <button className="round glass-d" onClick={close} aria-label="Cerrar vista ampliada" autoFocus>{Icon.close}</button>
              </div>
              <div className="lb-sample"><Sample show={p.sample} /></div>
              {p.shots.length > 1 && (
                <div className="lb-arrows">
                  <button className="round glass-d" onClick={() => go(-1)} aria-label="Imagen anterior">{Icon.prev}</button>
                  <button className="round glass-d" onClick={() => go(1)} aria-label="Imagen siguiente">{Icon.next}</button>
                </div>
              )}
            </div>

            <div className="lb-info">
              <p className="label acc" style={{ margin: 0 }}>{p.kind}</p>
              <h2 className="display">{p.title}</h2>
              <div className="lb-meta">
                <span>{p.space}</span>
                {p.shots[si].note && <span>· {p.shots[si].note}</span>}
              </div>
              {p.description && <p className="lb-desc">{p.description}</p>}
              {p.shots.length > 1 && (
                <div className="lb-thumbs" role="group" aria-label="Imágenes del proyecto">
                  {p.shots.map((s, k) => (
                    <button
                      key={k}
                      className="lb-thumb"
                      aria-label={`Ver imagen ${k + 1}${s.note ? `: ${s.note}` : ""}`}
                      aria-current={k === si}
                      onClick={() => {
                        setSi(k);
                        setAnim((a) => a + 1);
                      }}
                    >
                      <Image src={s.src} alt="" fill sizes="64px" quality={60} />
                    </button>
                  ))}
                </div>
              )}
              <div className="lb-foot">
                <a href="#contacto" className="btn btn-cu" onClick={close}>Quiero algo así <span className="arr" aria-hidden="true">→</span></a>
                <div className="lb-navp">
                  <button onClick={() => goProject(-1)}>← Anterior</button>
                  <button onClick={() => goProject(1)}>Siguiente →</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </dialog>
    </section>
  );
}
