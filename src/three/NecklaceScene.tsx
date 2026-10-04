"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  CatmullRomCurve3, Color, DoubleSide, ExtrudeGeometry, Group, InstancedMesh, Mesh, MeshPhysicalMaterial, Object3D, ShapePath,
  TorusGeometry, Vector3, type BufferGeometry,
} from "three";
import glyphs from "./glyphs.json";
import { Studio } from "./Studio";

type Cmd = (string | number)[];
const cache = new Map<string, { geo: BufferGeometry; adv: number }>();

/** Letra extruida con bisel (Inter Black) → joya: borde redondeado, grosor de colgante. */
function letter(ch: string) {
  if (cache.has(ch)) return cache.get(ch)!;
  const g = (glyphs as Record<string, { adv: number; cmds: Cmd[] }>)[ch];
  if (!g) return null;
  const sp = new ShapePath();
  for (const c of g.cmds) {
    const t = c[0] as string, n = c.slice(1) as number[];
    if (t === "M") sp.moveTo(n[0], -n[1]);
    else if (t === "L") sp.lineTo(n[0], -n[1]);
    else if (t === "Q") sp.quadraticCurveTo(n[0], -n[1], n[2], -n[3]);
    else if (t === "C") sp.bezierCurveTo(n[0], -n[1], n[2], -n[3], n[4], -n[5]);
  }
  const shapes = sp.toShapes();
  const geo = new ExtrudeGeometry(shapes, { depth: 0.08, bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.03, bevelSegments: 6, curveSegments: 14 });
  geo.computeBoundingBox();
  const bb = geo.boundingBox!;
  geo.translate(-(bb.min.x + bb.max.x) / 2, -bb.max.y, -0.04); // cuelga desde arriba, centrada
  geo.computeVertexNormals();
  const res = { geo, adv: bb.max.x - bb.min.x };
  cache.set(ch, res);
  return res;
}

const goldMat = () => {
  return new MeshPhysicalMaterial({ color: new Color("#ffbe4f"), metalness: 1, roughness: 0.15, envMapIntensity: 1.35, clearcoat: 0.2 });
};

const SCALE = 1.5; // tamaño de las letras (1 em = 1.5 unidades)
const GAP = 0.09;
const K = 0.12; // curvatura de la cadena (parábola)

function Chain({ text, length }: { text: string; length: number }) {
  const g = useRef<Group>(null);
  const { viewport, pointer } = useThree();
  const mat = useMemo(goldMat, []);
  const ringGeo = useMemo(() => new TorusGeometry(0.075, 0.02, 12, 24), []);
  const linkGeo = useMemo(() => { const t = new TorusGeometry(0.085, 0.021, 10, 24); t.scale(1, 1.55, 1); return t; }, []);
  const letterRefs = useRef<(Group | null)[]>([]);
  const state = useRef<{ s: number; a: number; v: number; ch: string }[]>([]);
  const links = useRef<InstancedMesh>(null);
  const sm = useRef({ x: 0, vx: 0 });
  const dummy = useMemo(() => new Object3D(), []);

  const chars = Array.from(text).filter((c) => (glyphs as Record<string, unknown>)[c]);
  const items = chars.map((c) => letter(c)!).filter(Boolean);
  const widths = items.map((it) => it.adv * SCALE + GAP);
  const total = widths.reduce((a, b) => a + b, 0) - GAP;
  let acc = -total / 2;
  const xs = widths.map((w) => { const x = acc + (w - GAP) / 2; acc += w; return x; });

  // cadena en U; el "largo" estira los extremos
  const half = Math.max(2.4, total / 2 + 1.3) * (0.85 + length * 0.3);
  const curve = useMemo(() => {
    const pts: Vector3[] = [];
    for (let i = -24; i <= 24; i++) { const x = (i / 24) * half; pts.push(new Vector3(x, K * x * x, 0)); }
    return new CatmullRomCurve3(pts);
  }, [half]);
  const nLinks = Math.round(curve.getLength() / 0.2);

  useEffect(() => {
    // las letras nuevas "caen" con rebote
    const st = state.current;
    chars.forEach((c, i) => { if (!st[i] || st[i].ch !== c) st[i] = { s: 0.2, a: 0.5, v: 0, ch: c }; });
    st.length = chars.length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  useFrame((s, rawDt) => {
    const dt = Math.min(rawDt, 1 / 30); // el resorte es estable solo con pasos chicos
    const t = s.clock.elapsedTime;
    sm.current.vx = Math.max(-40, Math.min(40, (pointer.x - sm.current.x) / Math.max(dt, 0.001)));
    sm.current.x = pointer.x;
    const st = state.current;
    letterRefs.current.forEach((lg, i) => {
      if (!lg || !st[i]) return;
      const o = st[i];
      // péndulo: el mouse empuja, la gravedad devuelve
      o.v += (-30 * o.a - 3.2 * o.v + sm.current.vx * 0.012 * (0.4 + i * 0.05)) * dt;
      o.a += o.v * dt;
      o.a = Math.max(-0.9, Math.min(0.9, o.a));
      o.s += (1 - o.s) * Math.min(1, dt * 7);
      const tilt = Math.atan(2 * K * xs[i]);
      lg.rotation.z = -tilt * 0.12 + o.a + Math.sin(t * 0.9 + i) * 0.012; // cuelgan por gravedad (casi verticales)
      lg.scale.setScalar(o.s);
      lg.position.y = K * xs[i] * xs[i] - 0.06;
    });
    const gr = g.current!;
    gr.rotation.y += ((pointer.x * 0.35) - gr.rotation.y) * 0.06;
    gr.rotation.x += ((-pointer.y * 0.12) - gr.rotation.x) * 0.06;
    gr.scale.setScalar(Math.min(1.25, (viewport.width * 0.92) / (half * 2)));
    gr.position.y = -0.25;
  });

  // eslabones alternados a lo largo de la curva
  useEffect(() => {
    const m = links.current;
    if (!m) return;
    const p = new Vector3(), tg = new Vector3();
    for (let i = 0; i < nLinks; i++) {
      const u = i / (nLinks - 1);
      curve.getPointAt(u, p); curve.getTangentAt(u, tg);
      dummy.position.copy(p);
      dummy.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), tg);
      dummy.rotateY(i % 2 ? Math.PI / 2 : 0);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.count = nLinks;
    m.instanceMatrix.needsUpdate = true;
  }, [curve, nLinks, dummy]);

  return (
    <group ref={g}>
      <instancedMesh ref={links} args={[linkGeo, mat, 400]} />
      {items.map((it, i) => (
        <group key={`${i}-${chars[i]}`} ref={(el) => { letterRefs.current[i] = el; }} position={[xs[i], K * xs[i] * xs[i] - 0.06, 0]}>
          <mesh geometry={ringGeo} material={mat} position={[0, 0.07, 0]} rotation={[0, Math.PI / 2, 0]} />
          <mesh geometry={it.geo} material={mat} scale={SCALE} position={[0, -0.02, 0]} />
        </group>
      ))}
    </group>
  );
}

export default function NecklaceScene({ text, length, onReady }: { text: string; length: number; onReady: () => void }) {
  return (
    <Canvas dpr={[1, 1.7]} camera={{ fov: 28, position: [0, 0, 9] }} gl={{ alpha: true, antialias: true }} style={{ touchAction: "pan-y" }} onCreated={() => setTimeout(onReady, 300)}>
      <Studio />
      <Chain text={text} length={length} />
    </Canvas>
  );
}
void DoubleSide; void Mesh;
