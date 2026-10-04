"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { InstancedMesh, Object3D, type Group, type PointLight } from "three";
import { mulberry32 } from "@/lib/noise";
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
    const base = land ? 1.0 : (viewport.width / (2.6 * 0.9)) * 0.92;
    grp.scale.setScalar(base * (0.96 + 0.1 * e));
    // hundida → emergida (el "intro" la sube desde más abajo al cargar)
    grp.position.y = -0.7 * (1 - e) * intro - 1.9 * (1 - intro) + 0.2 * e + (land ? 0 : -0.55) + Math.sin(t * 0.8) * 0.03 * e;
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

/** Cristales de sal: cubos mínimos que derivan. Caen más rápido cuando se scrollea (la joya "suelta" sal). */
function Crystals({ state, count = 90 }: { state: React.RefObject<HeroState>; count?: number }) {
  const mesh = useRef<InstancedMesh>(null);
  const prev = useRef(0);
  const dummy = useMemo(() => new Object3D(), []);
  const data = useMemo(() => {
    const r = mulberry32(7);
    return Array.from({ length: count }, () => ({
      x: (r() - 0.5) * 12, y: (r() - 0.5) * 7, z: -2 + r() * 5.5,
      s: 0.012 + r() ** 2.5 * 0.07, rx: r() * 6, ry: r() * 6, vx: (r() - 0.5) * 0.08, vy: -(0.05 + r() * 0.12), sp: 0.2 + r(),
    }));
  }, [count]);

  useFrame((_, dt) => {
    const m = mesh.current;
    if (!m) return;
    const { p } = state.current;
    const v = Math.min(3, Math.abs(p - prev.current) / Math.max(dt, 0.001) * 0.9);
    prev.current = p;
    data.forEach((d, i) => {
      d.y += (d.vy * (1 + v * 5)) * dt;
      d.x += d.vx * dt;
      d.rx += dt * d.sp; d.ry += dt * d.sp * 0.7;
      if (d.y < -4) { d.y = 4; d.x = (Math.random() - 0.5) * 12; }
      dummy.position.set(d.x, d.y, d.z);
      dummy.rotation.set(d.rx, d.ry, 0);
      dummy.scale.setScalar(d.s);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#f7f3ea" roughness={0.25} metalness={0.1} envMapIntensity={1.2} />
    </instancedMesh>
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
        <Crystals state={state} />
        <Ready onReady={onReady} />
      </Canvas>
    </div>
  );
}
