"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { type Group, type PointLight } from "three";
import { PieceModel, type PieceKind } from "./PieceModel";
import { animateDrips, buildGoldWordmark, WORD_W } from "./goldWordmark";
import { Studio } from "./Studio";

export type HeroState = { p: number; intro: number };

const smooth = (t: number) => t * t * (3 - 2 * t);

/** La joya: sale de la costra con el scroll, responde al cursor con inercia, el reflejo cambia con el ángulo. */
function Jewel({ state, kind }: { state: React.RefObject<HeroState>; kind: PieceKind }) {
  const g = useRef<Group>(null);
  const light = useRef<PointLight>(null);
  const { viewport, pointer, gl } = useThree();
  const sm = useRef({ x: 0, y: 0 });
  const drag = useRef({ down: false, x: 0, y: 0, vx: 0, vy: 0, yaw: 0, pitch: 0 });

  useEffect(() => {
    const el = gl.domElement, d = drag.current;
    const down = (e: PointerEvent) => { d.down = true; d.x = e.clientX; d.y = e.clientY; };
    const move = (e: PointerEvent) => { if (!d.down) return; d.vx = (e.clientX - d.x) * 0.007; d.vy = (e.clientY - d.y) * 0.004; d.x = e.clientX; d.y = e.clientY; d.yaw += d.vx; d.pitch += d.vy; };
    const up = () => { d.down = false; };
    el.addEventListener("pointerdown", down); window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
    return () => { el.removeEventListener("pointerdown", down); window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  }, [gl]);

  useFrame((s, dt) => {
    const grp = g.current;
    if (!grp) return;
    const { p, intro } = state.current;
    // inercia del cursor
    sm.current.x += (pointer.x - sm.current.x) * Math.min(1, dt * 3.2);
    sm.current.y += (pointer.y - sm.current.y) * Math.min(1, dt * 3.2);
    const dr = drag.current;
    if (!dr.down) { dr.yaw += dr.vx; dr.pitch += dr.vy; dr.vx *= 0.94; dr.vy *= 0.94; dr.pitch *= 0.985; }
    const t = s.clock.elapsedTime;
    const e = smooth(Math.min(1, p));
    const land = viewport.width / viewport.height > 1;
    const base = land ? Math.min(0.62, (viewport.height / 2.6) * 0.42) : (viewport.width / (2.6 * 0.9)) * 0.5;
    grp.scale.setScalar(base * (1 + 0.08 * e));
    // sube desde abajo al cargar y se eleva apenas con el scroll
    grp.position.x = land ? viewport.width * 0.27 : 0;
    grp.position.y = (land ? -viewport.height * 0.25 : 0.2) + 0.35 * e - 2.2 * (1 - intro) + Math.sin(t * 0.8) * 0.04;
    grp.rotation.x = 0.95 - 0.35 * e + sm.current.y * -0.22 + Math.sin(t * 0.5) * 0.02 + dr.pitch;
    grp.rotation.y = -0.45 + e * 1.4 + sm.current.x * 0.42 + Math.cos(t * 0.4) * 0.03 + dr.yaw;
    grp.rotation.z = 0.25 - 0.2 * e + sm.current.x * 0.05;
    if (light.current) {
      light.current.position.set(sm.current.x * 5, sm.current.y * 3 + 1, 4);
    }
  });

  return (
    <>
      <pointLight ref={light} intensity={34} distance={14} decay={2} color="#fff3dc" />
      <group ref={g}>
        <PieceModel kind={kind} />
      </group>
    </>
  );
}

/** DESAL gigante en oro martillado (el mismo metal de los anillos): letras infladas, gotas de metal fundido que cuelgan y caen. Se inclina con el mouse. */
function GoldWord({ state }: { state: React.RefObject<HeroState> }) {
  const g = useRef<Group>(null);
  const { viewport, pointer } = useThree();
  const built = useMemo(() => buildGoldWordmark(), []);
  useEffect(() => () => built.dispose(), [built]);
  useFrame((s) => {
    const gr = g.current;
    if (!gr) return;
    animateDrips(built.drips, s.clock.elapsedTime);
    const { p, intro } = state.current;
    const w = Math.min(viewport.width * 0.88, viewport.height * 1.75);
    gr.scale.setScalar(w / WORD_W);
    gr.position.y = viewport.height * (0.5 - (viewport.width > viewport.height ? 0.32 : 0.25)) - (1 - intro) * 1.4 + p * 0.5;
    gr.rotation.y += (pointer.x * 0.16 - gr.rotation.y) * 0.06;
    gr.rotation.x += (-pointer.y * 0.08 - gr.rotation.x) * 0.06;
  });
  return <group ref={g}><primitive object={built.root} /></group>;
}

function Ready({ onReady }: { onReady: () => void }) {
  const n = useRef(0);
  useFrame(() => { if (++n.current === 4) onReady(); });
  return null;
}

export default function HeroScene({ state, active, onReady, kind = "cuffstar" }: { state: React.RefObject<HeroState>; active: boolean; onReady: () => void; kind?: PieceKind }) {
  // limpia el contexto al desmontar (evita warnings de contextos perdidos al navegar)
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => () => { ref.current?.querySelector("canvas")?.getContext("webgl2")?.getExtension("WEBGL_lose_context")?.loseContext(); }, []);
  return (
    <div ref={ref} className="absolute inset-0">
      <Canvas
        dpr={[1, 1.75]}
        frameloop={active ? "always" : "never"}
        camera={{ fov: 28, position: [0, 0, 8], near: 0.1, far: 40 }}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        style={{ touchAction: "pan-y" }}
      >
        <Studio />
        <GoldWord state={state} />
        <Jewel state={state} kind={kind} />
        <Ready onReady={onReady} />
      </Canvas>
    </div>
  );
}
