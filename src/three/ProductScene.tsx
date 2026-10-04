"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type { Group } from "three";
import { PieceModel, type PieceKind } from "./PieceModel";
import { Studio } from "./Studio";

const POSE: Record<PieceKind, [number, number, number]> = {
  cuffstar: [0.95, -0.45, 0.2], rib: [1.0, 0.0, 0.1], molten: [0.95, -0.35, 0.15], mark: [0.5, 0.1, 0],
};

/** Pieza a pantalla casi completa: responde al cursor y se orbita arrastrando, con inercia. Sin gizmos ni ejes: editorial, no configurador. */
function Obj({ kind }: { kind: PieceKind }) {
  const g = useRef<Group>(null);
  const { viewport, pointer, gl } = useThree();
  const drag = useRef({ down: false, x: 0, y: 0, vx: 0, vy: 0, yaw: 0, pitch: 0 });
  const sm = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const el = gl.domElement, d = drag.current;
    const down = (e: PointerEvent) => { d.down = true; d.x = e.clientX; d.y = e.clientY; };
    const move = (e: PointerEvent) => { if (!d.down) return; d.vx = (e.clientX - d.x) * 0.006; d.vy = (e.clientY - d.y) * 0.004; d.x = e.clientX; d.y = e.clientY; d.yaw += d.vx; d.pitch += d.vy; };
    const up = () => { d.down = false; };
    el.addEventListener("pointerdown", down); window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
    return () => { el.removeEventListener("pointerdown", down); window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  }, [gl]);

  useFrame((s, dt) => {
    const o = g.current, d = drag.current;
    if (!o) return;
    if (!d.down) { d.yaw += d.vx; d.pitch += d.vy; d.vx *= 0.94; d.vy *= 0.94; d.pitch *= 0.98; }
    sm.current.x += (pointer.x - sm.current.x) * Math.min(1, dt * 3);
    sm.current.y += (pointer.y - sm.current.y) * Math.min(1, dt * 3);
    const t = s.clock.elapsedTime;
    const [rx, ry, rz] = POSE[kind];
    o.rotation.set(rx + d.pitch + sm.current.y * -0.2 + Math.sin(t * 0.5) * 0.02, ry + d.yaw + sm.current.x * 0.35, rz);
    o.position.y = Math.sin(t * 0.7) * 0.04;
    const base = viewport.width / viewport.height > 1 ? 1.4 : (viewport.width / (2.6 * 0.95)) * 0.7;
    o.scale.setScalar(base * 1);
  });
  return <group ref={g}><PieceModel kind={kind} /></group>;
}

export default function ProductScene({ kind, onReady }: { kind: PieceKind; onReady: () => void }) {
  return (
    <Canvas dpr={[1, 1.75]} camera={{ fov: 28, position: [0, 0, 8] }} gl={{ alpha: true, antialias: true }} style={{ touchAction: "pan-y" }}
      onCreated={() => setTimeout(onReady, 250)}>
      <Studio />
      <Obj kind={kind} />
    </Canvas>
  );
}
