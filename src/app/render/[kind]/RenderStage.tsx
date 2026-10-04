"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type { Group } from "three";
import { PieceModel, type PieceKind } from "@/three/PieceModel";
import { Studio } from "@/three/Studio";

// Poses por vista. a: 3/4 principal · b: ángulo alternativo · c: macro (se recorta en el script)
const POSES: Record<string, Record<string, { r: [number, number, number]; cam: number }>> = {
  cuffstar: { a: { r: [0.95, -0.45, 0.2], cam: 6.4 }, b: { r: [0.3, 0.7, 0.1], cam: 6.4 }, c: { r: [1.1, -0.2, 0.1], cam: 2.6 } },
  rib: { a: { r: [1.0, 0.0, 0.1], cam: 6.4 }, b: { r: [0.4, 0.8, 0.0], cam: 6.4 }, c: { r: [1.2, 0.1, 0], cam: 2.6 } },
  molten: { a: { r: [0.95, -0.35, 0.15], cam: 6.4 }, b: { r: [0.3, 0.8, 0.1], cam: 6.4 }, c: { r: [1.1, -0.2, 0], cam: 2.5 } },
  mark: { a: { r: [0.85, 0.25, 0.15], cam: 5.2 }, b: { r: [0.2, 0.5, 0.2], cam: 5.2 }, c: { r: [0.5, 0.1, 0], cam: 2.4 } },
};

function Ready() {
  const n = useRef(0);
  useFrame(() => {
    if (++n.current === 6) (window as unknown as { __ready: boolean }).__ready = true;
  });
  return null;
}

function Rig({ cam }: { cam: number }) {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(0, 0, cam);
    camera.lookAt(0, 0, 0);
  }, [camera, cam]);
  return null;
}

export function RenderStage({ kind, view }: { kind: string; view: string }) {
  const pose = POSES[kind]?.[view] ?? POSES.cuffstar.a;
  const g = useRef<Group>(null);
  return (
    <div style={{ position: "fixed", inset: 0, background: "transparent" }}>
      <style>{"html,body{background:transparent!important}"}</style>
      <Canvas
        dpr={1}
        camera={{ fov: 30, position: [0, 0, pose.cam], near: 0.1, far: 50 }}
        gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }}
        style={{ background: "transparent" }}
      >
        <Rig cam={pose.cam} />
        <Studio />
        <group ref={g} rotation={pose.r}>
          <PieceModel kind={kind as PieceKind} />
        </group>
        <Ready />
      </Canvas>
    </div>
  );
}
