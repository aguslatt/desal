"use client";

import { useMemo } from "react";
import { Box3, Color, Group, Mesh, MeshPhysicalMaterial, TorusGeometry, Vector2, Vector3 } from "three";
import { blob, bezel, curves, gauss, gem, moltenStar, roundGem, splat, sweep } from "./geometry";
import { surfaceMaps } from "./surface";

/** Diseños reales de DE SAL modelados a partir de las fotos del taller (aproximaciones; no son escaneos). */
export type PieceKind = "cuffstar" | "rib" | "molten" | "mark";

const metal = (color: string, rough: number, normal = 0.18) => {
  const { rough: rm, normal: nm } = surfaceMaps();
  return new MeshPhysicalMaterial({
    color: new Color(color), metalness: 1, roughness: rough, roughnessMap: rm, normalMap: nm,
    normalScale: new Vector2(normal, normal), envMapIntensity: 1.15, clearcoat: 0.1, clearcoatRoughness: 0.25,
  });
};
const GOLD = "#ffbe4f";
const gemMat = (c: string, faceted = true) =>
  new MeshPhysicalMaterial({
    color: new Color(c), roughness: 0.03, metalness: 0.1, flatShading: faceted, clearcoat: 1, clearcoatRoughness: 0.02,
    envMapIntensity: 2.6, ior: 1.6, specularIntensity: 1, iridescence: 0.2, iridescenceIOR: 1.4,
  });

const mesh = (g: ConstructorParameters<typeof Mesh>[0], m: ConstructorParameters<typeof Mesh>[1]) => new Mesh(g, m);

function build(kind: PieceKind, seed = 1): Group {
  const root = new Group();

  if (kind === "cuffstar") {
    // Anillo ancho tipo manguito: lámina satinada, bordes de corte a mano, estrella fundida pulida con piedra celeste
    const R = 1;
    const satin = metal(GOLD, 0.42, 0.1);
    root.add(mesh(sweep({
      closed: true, path: curves.circle(R), rN: () => 0.045, rB: (t) => 0.64 + 0.04 * gauss(t, 0.25, 0.2),
      seed, sq: 8, lump: 0.03, wave: { amp: 0.035, freq: 3 }, hammer: 0.004, hammerFreq: 3, segU: 420, segV: 72,
    }), satin));
    const star = mesh(moltenStar(seed, R), metal(GOLD, 0.16, 0.06));
    star.position.set(0.02, R + 0.03, 0.03);
    star.rotation.y = 0.35;
    root.add(star);
    const st = mesh(roundGem(), gemMat("#4aa3dc"));
    st.scale.setScalar(0.22);
    st.position.set(0.03, R + 0.12, 0.03);
    root.add(st);
  }

  if (kind === "rib") {
    // Anillo "costillas": columna fundida sobre el dedo y cuatro arcos que lo abrazan; tres piedras celestes
    const R = 1;
    const ribMat = metal(GOLD, 0.22, 0.22);
    [-0.5, -0.17, 0.17, 0.5].forEach((z, i) => {
      const rib = mesh(sweep({
        closed: true, path: curves.circle(R), rN: (t) => 0.07 + 0.06 * gauss(t, 0.25, 0.1), rB: (t) => 0.07 + 0.05 * gauss(t, 0.25, 0.1),
        seed: seed + i, lump: 0.22, hammer: 0.02, hammerFreq: 3.5, segU: 300, segV: 28,
      }), ribMat);
      rib.position.z = z;
      root.add(rib);
    });
    const spine = mesh(blob(0.26, 0.11, 1.0, seed, 0.14), ribMat);
    spine.position.set(0, R + 0.05, 0);
    root.add(spine);
    // aletas (extremos de cada costilla fundidos contra la columna)
    [-0.5, -0.17, 0.17, 0.5].forEach((z, i) => {
      const w = mesh(blob(0.32, 0.075, 0.07, seed + i * 3, 0.12), ribMat);
      w.position.set(0, R + 0.04, z);
      root.add(w);
    });
    const tail = mesh(blob(0.34, 0.09, 0.2, seed + 9, 0.16), ribMat);
    tail.position.set(0, R + 0.03, -1.0);
    root.add(tail);
    const head = mesh(blob(0.2, 0.1, 0.17, seed + 4, 0.14), ribMat);
    head.position.set(0, R + 0.05, 0.98);
    root.add(head);
    [-0.34, -0.02, 0.3].forEach((z) => {
      const s = mesh(roundGem(), gemMat("#4aa3dc"));
      s.scale.setScalar(0.1);
      s.position.set(0, R + 0.14, z);
      root.add(s);
    });
  }

  if (kind === "molten") {
    // Anillo fundido con amatista y piedra blanca engastadas en una masa irregular
    const R = 1;
    const m = metal(GOLD, 0.2, 0.2);
    root.add(mesh(sweep({
      closed: true, path: curves.circle(R),
      rN: (t) => 0.1 + 0.07 * gauss(t, 0.25, 0.16), rB: (t) => 0.27 + 0.12 * gauss(t, 0.25, 0.14),
      seed, sq: 2.8, lump: 0.1, wave: { amp: 0.1, freq: 3 }, hammer: 0.012, hammerFreq: 4, segU: 420,
    }), m));
    const mass = mesh(blob(0.78, 0.2, 0.34, seed, 0.16), m);
    mass.position.set(0, R + 0.1, 0);
    root.add(mass);
    const mkRim = (x: number, r: number) => {
      const rim = mesh(new TorusGeometry(r, 0.045, 18, 40), m);
      rim.rotation.x = Math.PI / 2;
      rim.position.set(x, R + 0.27, 0.01);
      root.add(rim);
    };
    mkRim(-0.27, 0.19); mkRim(0.3, 0.21);
    const am = mesh(roundGem(), gemMat("#7b3fb8"));
    am.scale.setScalar(0.34); am.position.set(-0.27, R + 0.25, 0.01); root.add(am);
    const wh = mesh(roundGem(), gemMat("#f4f1ff"));
    wh.scale.setScalar(0.37); wh.position.set(0.3, R + 0.25, 0.01); root.add(wh);
  }

  if (kind === "mark") {
    root.add(mesh(splat(seed), metal(GOLD, 0.3)));
  }

  const box = new Box3().setFromObject(root);
  const size = box.getSize(new Vector3());
  const center = box.getCenter(new Vector3());
  const wrap = new Group();
  root.position.sub(center);
  wrap.add(root);
  wrap.scale.setScalar(2.6 / Math.max(size.x, size.y, size.z));
  return wrap;
}

export function PieceModel({ kind, seed = 1 }: { kind: PieceKind; seed?: number }) {
  const obj = useMemo(() => build(kind, seed), [kind, seed]);
  return <primitive object={obj} />;
}

void bezel; void gem;
