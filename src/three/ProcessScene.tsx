"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Color, Mesh, MeshPhysicalMaterial, type Group } from "three";
import { Studio } from "./Studio";
import { buildPiece } from "./PieceModel";

export type ProcessState = { p: number };

// cera → fundición → lima → pulido: material y rugosidad del metal por etapa
const KEYS = [
  { c: "#dcd0ab", metal: 0.0, rough: 0.78, gems: 0 }, // cera
  { c: "#6d4a22", metal: 1.0, rough: 0.9, gems: 0 }, // fundición (bronce sin trabajar)
  { c: "#e3aa3d", metal: 1.0, rough: 0.5, gems: 0.35 }, // lima (mate)
  { c: "#ffbe4f", metal: 1.0, rough: 0.2, gems: 1 }, // pulido
];

function Ring({ state }: { state: React.RefObject<ProcessState> }) {
  const g = useRef<Group>(null);
  const { viewport, pointer } = useThree();
  const obj = useMemo(() => {
    const o = buildPiece("molten");
    const metals: MeshPhysicalMaterial[] = [];
    const gems: Mesh[] = [];
    o.traverse((m) => {
      const mesh = m as Mesh;
      if (!mesh.isMesh) return;
      const mat = mesh.material as MeshPhysicalMaterial;
      if (mat.flatShading) { gems.push(mesh); (mesh.userData as { s: number }).s = mesh.scale.x; }
      else { mat.roughnessMap = mat.roughnessMap; metals.push(mat); }
    });
    return { o, metals, gems };
  }, []);
  const tmp = useMemo(() => new Color(), []);
  const sm = useRef(0);

  useFrame((s, dt) => {
    const p = state.current.p;
    const f = Math.min(2.9999, p * 3), i = Math.floor(f), t = f - i;
    const a = KEYS[i], b = KEYS[i + 1];
    const ease = t * t * (3 - 2 * t);
    const col = tmp.set(a.c).lerp(new Color(b.c), ease);
    const metal = a.metal + (b.metal - a.metal) * ease, rough = a.rough + (b.rough - a.rough) * ease;
    obj.metals.forEach((m) => { m.color.copy(col); m.metalness = metal; m.roughness = rough; m.clearcoat = metal > 0.9 && rough < 0.3 ? 0.2 : 0; });
    const gs = a.gems + (b.gems - a.gems) * ease;
    obj.gems.forEach((m) => m.scale.setScalar(((m.userData as { s: number }).s) * Math.max(0.001, gs)));
    sm.current += (pointer.x - sm.current) * Math.min(1, dt * 3);
    const gr = g.current!;
    gr.rotation.set(0.95 + pointer.y * -0.15, -0.35 + p * Math.PI * 2.2 + sm.current * 0.4, 0.15);
    gr.position.y = Math.sin(s.clock.elapsedTime * 0.8) * 0.05;
    gr.scale.setScalar(Math.min(1.12, viewport.width / (2.6 * 0.95)) * 0.98);
  });
  return <group ref={g}><primitive object={obj.o} /></group>;
}

export default function ProcessScene({ state, active }: { state: React.RefObject<ProcessState>; active: boolean }) {
  return (
    <Canvas dpr={[1, 1.6]} frameloop={active ? "always" : "never"} camera={{ fov: 28, position: [0, 0, 8] }} gl={{ alpha: true, antialias: true }} style={{ touchAction: "pan-y" }}>
      <Studio />
      <Ring state={state} />
    </Canvas>
  );
}
