"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { type Group, type PointLight } from "three";
import { PieceModel } from "./PieceModel";
import { Studio } from "./Studio";

export type HeroState = { p: number; intro: number };

const smooth = (t: number) => t * t * (3 - 2 * t);

/** La joya: sale de la costra con el scroll, responde al cursor con inercia, el reflejo cambia con el ángulo. */
function Jewel({ state }: { state: React.RefObject<HeroState> }) {
  const g = useRef<Group>(null);
  const light = useRef<PointLight>(null);
  const { viewport, pointer } = useThree();
  const sm = useRef({ x: 0, y: 0 });

  useFrame((s, dt) => {
    const grp = g.current;
    if (!grp) return;
    const { p, intro } = state.current;
    // inercia del cursor
    sm.current.x += (pointer.x - sm.current.x) * Math.min(1, dt * 3.2);
    sm.current.y += (pointer.y - sm.current.y) * Math.min(1, dt * 3.2);
    const t = s.clock.elapsedTime;
    const e = smooth(Math.min(1, p));
    const land = viewport.width / viewport.height > 1;
    const base = land ? 0.86 : (viewport.width / (2.6 * 0.9)) * 0.66;
    grp.scale.setScalar(base * (1 + 0.08 * e));
    // sube desde abajo al cargar y se eleva apenas con el scroll
    grp.position.x = land ? viewport.width * 0.19 : 0;
    grp.position.y = (land ? -0.5 : 0.05) + 0.35 * e - 2.2 * (1 - intro) + Math.sin(t * 0.8) * 0.04;
    grp.rotation.x = 0.95 - 0.35 * e + sm.current.y * -0.22 + Math.sin(t * 0.5) * 0.02;
    grp.rotation.y = -0.5 + e * 1.9 + sm.current.x * 0.42 + Math.cos(t * 0.4) * 0.03;
    grp.rotation.z = 0.25 - 0.2 * e + sm.current.x * 0.05;
    if (light.current) {
      light.current.position.set(sm.current.x * 5, sm.current.y * 3 + 1, 4);
    }
  });

  return (
    <>
      <pointLight ref={light} intensity={34} distance={14} decay={2} color="#fff3dc" />
      <group ref={g}>
        <PieceModel kind="ring" />
      </group>
    </>
  );
}

function Ready({ onReady }: { onReady: () => void }) {
  const n = useRef(0);
  useFrame(() => { if (++n.current === 4) onReady(); });
  return null;
}

export default function HeroScene({ state, active, onReady }: { state: React.RefObject<HeroState>; active: boolean; onReady: () => void }) {
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
        <Jewel state={state} />
        <Ready onReady={onReady} />
      </Canvas>
    </div>
  );
}
