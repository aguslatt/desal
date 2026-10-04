"use client";

import { useMemo } from "react";
import {
  Box3,
  Color,
  Group,
  Mesh,
  MeshPhysicalMaterial,
    TorusGeometry,
  Vector2,
  Vector3,
} from "three";
import { cabochon, curves, drop, gauss, nugget, roundedBlock, splat, sweep } from "./geometry";
import { surfaceMaps } from "./surface";

export type PieceKind = "ring" | "signet" | "hoops" | "pendant" | "nugget" | "cuff" | "mark";

const metal = (color: string, rough: number) => {
  const { rough: rm, normal } = surfaceMaps();
  return new MeshPhysicalMaterial({
    color: new Color(color), metalness: 1, roughness: rough, roughnessMap: rm, normalMap: normal,
    normalScale: new Vector2(0.18, 0.18), envMapIntensity: 1.15, clearcoat: 0.12, clearcoatRoughness: 0.2,
  });
};
// oro: base F0 real del oro (≈ #ffd98a tras tone mapping); plata: casi blanca
const gold = () => metal("#ffbe4f", 0.3);
const silver = () => metal("#f3f1ec", 0.36);
// piedras: lisas, profundas, con coat y reflejo (sin transmisión: estable con fondo transparente)
const stone = (c: string) =>
  new MeshPhysicalMaterial({
    color: new Color(c), roughness: 0.04, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.02,
    envMapIntensity: 1.3, sheen: 0, ior: 1.62, specularIntensity: 1,
  });

function mesh(g: ConstructorParameters<typeof Mesh>[0], m: ConstructorParameters<typeof Mesh>[1]) {
  return new Mesh(g, m);
}

/** Construye cada pieza (procedural, PLACEHOLDER: no son piezas reales de DE SAL). */
function build(kind: PieceKind, seed = 1): Group {
  const root = new Group();
  const G = gold(), S = silver();

  if (kind === "ring") {
    const R = 1;
    const band = sweep({
      closed: true,
      path: curves.circle(R),
      rN: (t) => 0.17 + 0.22 * gauss(t, 0.25, 0.085) + 0.05 * gauss(t, 0.75, 0.2),
      rB: (t) => 0.27 + 0.2 * gauss(t, 0.25, 0.1),
      seed,
      lump: 0.18,
      hammer: 0.01,
      hammerFreq: 3.2,
    });
    root.add(mesh(band, G));
    const st = mesh(cabochon(seed + 2, 0.27, 0.72), stone("#075a33"));
    st.position.set(0.02, R + 0.19, 0.04);
    st.rotation.x = -Math.PI / 2;
    root.add(st);
  }

  if (kind === "signet") {
    const R = 0.95;
    root.add(
      mesh(
        sweep({
          closed: true,
          path: curves.circle(R),
          rN: (t) => 0.1 + 0.05 * gauss(t, 0.75, 0.2),
          rB: (t) => 0.3 + 0.1 * gauss(t, 0.25, 0.1),
          seed,
          lump: 0.1,
          hammer: 0.008,
        }),
        S,
      ),
    );
    const block = mesh(roundedBlock(1.7, 0.34, 1.4, 0.13, 110, seed, 0.028), S);
    block.position.set(0, R + 0.16, 0);
    block.rotation.y = 0.06;
    root.add(block);
  }

  if (kind === "hoops") {
    const mk = (s: number) =>
      sweep({
        closed: false,
        path: curves.arc(0.9, 0.5),
        rN: (t) => 0.07 + 0.17 * Math.pow(Math.sin(Math.PI * t), 1.3),
        rB: (t) => 0.09 + 0.15 * Math.pow(Math.sin(Math.PI * t), 1.4),
        seed: s,
        lump: 0.22,
        hammer: 0.008,
        hammerFreq: 3.5,
        segU: 280,
      });
    const a = mesh(mk(seed), G);
    a.position.set(-1.0, 0.08, 0);
    a.rotation.z = 0.22;
    const b = mesh(mk(seed + 5), G);
    b.position.set(1.0, -0.08, -0.1);
    b.rotation.set(0, -0.7, -0.18);
    b.scale.set(0.94, 0.94, 0.94);
    root.add(a, b);
  }

  if (kind === "pendant") {
    const body = mesh(drop(seed), G);
    body.rotation.y = 0.4;
    root.add(body);
    const bail = mesh(new TorusGeometry(0.2, 0.05, 24, 64), G);
    bail.position.set(0, 1.2, 0);
    bail.rotation.y = Math.PI / 2;
    root.add(bail);
    const cord = (side: number) =>
      mesh(
        sweep({
          closed: false,
          path: (t) => [side * (0.04 + 1.9 * t * t) * 1, 1.38 + 3.2 * Math.pow(t, 0.8)],
          rN: () => 0.028,
          rB: () => 0.028,
          seed,
          segU: 120,
          segV: 12,
        }),
        G,
      );
    root.add(cord(-1), cord(1));
  }

  if (kind === "nugget") {
    const c1 = new Vector3(0.28, 0.2, 0.62), c2 = new Vector3(-0.52, -0.08, 0.5);
    const g = nugget(seed, [
      { c: c1, r: 0.27 },
      { c: c2, r: 0.2 },
    ]);
    root.add(mesh(g, G));
    const s1 = mesh(cabochon(seed + 1, 0.3, 0.9), stone("#8e0f26"));
    s1.position.copy(c1).add(new Vector3(0, 0, 0.1));
    s1.lookAt(c1.clone().multiplyScalar(3));
    const s2 = mesh(cabochon(seed + 2, 0.23, 0.9), stone("#0b5f78"));
    s2.position.copy(c2).add(new Vector3(0, 0, 0.08));
    s2.lookAt(c2.clone().multiplyScalar(3));
    root.add(s1, s2);
  }

  if (kind === "cuff") {
    root.add(
      mesh(
        sweep({
          closed: false,
          path: curves.arc(1, 0.95),
          rN: (t) => 0.055 + 0.05 * Math.sin(Math.PI * t),
          rB: (t) => 0.42 + 0.22 * Math.sin(Math.PI * t) ** 0.7,
          seed,
          lump: 0.14,
          hammer: 0.012,
          hammerFreq: 3,
          segU: 300,
          segV: 56,
        }),
        S,
      ),
    );
  }

  if (kind === "mark") {
    root.add(mesh(splat(seed), G));
  }

  // centrar y normalizar tamaño
  const box = new Box3().setFromObject(root);
  const size = box.getSize(new Vector3());
  const center = box.getCenter(new Vector3());
  const k = 2.6 / Math.max(size.x, size.y, size.z);
  const wrap = new Group();
  root.position.sub(center);
  wrap.add(root);
  wrap.scale.setScalar(k);
  return wrap;
}

export function PieceModel({ kind, seed = 1 }: { kind: PieceKind; seed?: number }) {
  const obj = useMemo(() => build(kind, seed), [kind, seed]);
  return <primitive object={obj} />;
}
