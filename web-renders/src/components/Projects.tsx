"use client";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { projects, projectsCta, type Project } from "@/content/site";
import Rv from "./Rv";
import Sample from "./Sample";

const pad = (n: number) => String(n + 1).padStart(2, "0");

const Icon = {
  close: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" /></svg>,
  prev: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 4l-8 8 8 8" /></svg>,
  next: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4l8 8-8 8" /></svg>,
};

export default function Projects() {
  const [pi, setPi] = useState<number | null>(null); // proyecto abierto
  const [si, setSi] = useState(0); // imagen abierta
  const [anim, setAnim] = useState(0);
  const dlg = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);

  const p: Project | null = pi === null ? null : projects[pi];

  const open = (i: number, el: HTMLElement) => {
    opener.current = el;
    setPi(i);
    setSi(0);
    setAnim((a) => a + 1);
  };

  // abrir/cerrar el <dialog> modal (foco atrapado y Esc nativos)
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
      if (pi === null) return;
      const n = projects[pi].shots.length;
      setSi((s) => (s + dir + n) % n);
      setAnim((a) => a + 1);
    },
    [pi],
  );
  const goProject = useCallback(
    (dir: 1 | -1) => {
      setPi((cur) => (cur === null ? cur : (cur + dir + projects.length) % projects.length));
      setSi(0);
      setAnim((a) => a + 1);
    },
    [],
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
    <section id="proyectos" className="sec sec-ink" aria-labelledby="proyectos-t">
      <div className="wrap">
        <div className="sec-head">
          <Rv>
            <p className="label acc sec-kicker">Selección</p>
            <h2 id="proyectos-t" className="display sec-title">Proyectos</h2>
          </Rv>
          <Rv delay={0.1}>
            <p className="label num mute-d" style={{ margin: 0 }}>{projects.length < 10 ? `0${projects.length}` : projects.length} — proyectos</p>
          </Rv>
        </div>

        <div className="grid12 pgrid">
          {projects.map((pr, i) => (
            <article key={pr.slug} className={`pitem tile a-${pr.layout}`}>
              <button
                className="tile-img"
                aria-haspopup="dialog"
                aria-label={`Abrir ${pr.title}: ${pr.shots.length} imágenes`}
                onClick={(e) => open(i, e.currentTarget)}
              >
                <Rv as="span" kind="img" className="media">
                  <Image
                    src={pr.shots[0].src}
                    alt={pr.shots[0].alt}
                    fill
                    sizes="(min-width: 900px) 60vw, 100vw"
                    quality={75}
                    placeholder="blur"
                    loading="lazy"
                    style={{ objectPosition: pr.focus ?? "50% 50%" }}
                  />
                  <Sample show={pr.sample} />
                  <span className="open-hint" aria-hidden="true">Ver proyecto <span>+</span></span>
                </Rv>
              </button>
              <Rv className="cap" delay={0.1}>
                <span className="label num idx">{pad(i)}</span>
                <h3>
                  <button className="tile-title" onClick={(e) => open(i, e.currentTarget)}>{pr.title}</button>
                </h3>
                <p>{pr.space} · {pr.kind}</p>
              </Rv>
            </article>
          ))}

          <Rv className="pcta">
            <h3 className="display">¿Tenés un proyecto <em>en mente?</em> Hablemos.</h3>
            <p>{projectsCta.text}</p>
            <a href="#contacto" className="btn btn-cu">{projectsCta.button} <span className="arr" aria-hidden="true">→</span></a>
          </Rv>
        </div>
      </div>

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
              <div className="lb-top">
                <p className="label num" style={{ margin: 0 }} aria-live="polite">
                  {pad(pi!)} / {pad(projects.length - 1)}
                  <span className="mute-d"> · imagen {si + 1} de {p.shots.length}</span>
                </p>
                <button className="ibtn" onClick={close} aria-label="Cerrar vista ampliada" autoFocus>{Icon.close}</button>
              </div>

              <figure className="lb-fig" data-anim="1" key={`${pi}-${si}-${anim}`}>
                <Image
                  src={p.shots[si].src}
                  alt={p.shots[si].alt}
                  fill
                  sizes="(min-width: 900px) 72vw, 100vw"
                  quality={82}
                  placeholder="blur"
                  loading="eager"
                />
              </figure>
              <div className="lb-sample"><Sample show={p.sample} /></div>

              {p.shots.length > 1 && (
                <div className="lb-arrows">
                  <button className="ibtn" onClick={() => go(-1)} aria-label="Imagen anterior">{Icon.prev}</button>
                  <button className="ibtn" onClick={() => go(1)} aria-label="Imagen siguiente">{Icon.next}</button>
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
                      <Image src={s.src} alt="" fill sizes="72px" quality={60} />
                    </button>
                  ))}
                </div>
              )}
              <div className="lb-foot">
                <a
                  href="#contacto"
                  className="btn btn-cu"
                  onClick={() => {
                    close();
                  }}
                >
                  Quiero algo así <span className="arr" aria-hidden="true">→</span>
                </a>
                <div className="lb-navp">
                  <button onClick={() => goProject(-1)}>← Proyecto anterior</button>
                  <button onClick={() => goProject(1)}>Siguiente proyecto →</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </dialog>
    </section>
  );
}
