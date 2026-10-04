import {
  BoxGeometry,
  BufferGeometry,
  Float32BufferAttribute,
  IcosahedronGeometry,
  LatheGeometry,
  SphereGeometry,
  Vector2,
  Vector3,
} from "three";
import { MarchingCubes } from "three/examples/jsm/objects/MarchingCubes.js";
import { MeshBasicMaterial } from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { fbm3 } from "@/lib/noise";

/** Quita uv/normal para poder soldar vértices y recalcular normales suaves (sin costuras). */
function smooth(g: BufferGeometry) {
  g.deleteAttribute("uv");
  g.deleteAttribute("normal");
  const m = mergeVertices(g, 1e-4);
  m.computeVertexNormals();
  return m;
}

/** gaussiana PERIÓDICA en t∈[0,1] (distancia circular): las bandas cerradas no tienen costura */
const gauss = (t: number, c: number, w: number) => {
  const d = Math.min(Math.abs(t - c), 1 - Math.abs(t - c));
  return Math.exp(-(d * d) / (2 * w * w));
};

type SweepOpts = {
  segU?: number;
  segV?: number;
  closed: boolean;
  /** curva plana en XY, t ∈ [0,1] */
  path: (t: number) => [number, number];
  /** radio en el plano (grosor radial) */
  rN: (t: number) => number;
  /** radio fuera del plano (ancho de banda, eje Z) */
  rB: (t: number) => number;
  seed: number;
  /** deformación orgánica de baja frecuencia (0–0.4) */
  lump?: number;
  /** martillado: amplitud / frecuencia */
  hammer?: number;
  hammerFreq?: number;
  /** exponente del perfil: 2 = elipse, 3–5 = cuadrado redondeado (banda real) */
  sq?: number;
  /** ondulación orgánica del ancho/espesor a lo largo de la curva */
  wave?: { amp: number; freq: number };
};

/** Barre una sección elíptica a lo largo de una curva plana. Base de anillos, aros, brazaletes y cordones. */
export function sweep(o: SweepOpts) {
  const segU = o.segU ?? 320;
  const segV = o.segV ?? 64;
  const pos: number[] = [];
  const idx: number[] = [];
  const eps = 1e-3;
  const p = new Vector3();
  const seedPhase = o.seed * 1.7;

  for (let i = 0; i <= segU; i++) {
    const t = i / segU;
    const [x, y] = o.path(t);
    const [x2, y2] = o.path(Math.min(1, t + eps));
    const [x1, y1] = o.path(Math.max(0, t - eps));
    let tx = x2 - x1, ty = y2 - y1;
    const tl = Math.hypot(tx, ty) || 1;
    tx /= tl; ty /= tl;
    const nx = -ty, ny = tx; // normal en plano

    // remate redondeado en puntas abiertas
    let cap = 1;
    if (!o.closed) {
      const c = Math.min(1, t / 0.05, (1 - t) / 0.05);
      cap = Math.sqrt(Math.max(0, 1 - (1 - c) ** 2));
    }

    for (let j = 0; j <= segV; j++) {
      const v = (j / segV) * Math.PI * 2;
      const raw = Math.cos(v), rawS = Math.sin(v);
      const k2 = o.sq ? 2 / o.sq : 1;
      const cv = o.sq ? Math.sign(raw) * Math.pow(Math.abs(raw), k2) : raw;
      const sv = o.sq ? Math.sign(rawS) * Math.pow(Math.abs(rawS), k2) : rawS;
      const lump = o.lump ? 1 + o.lump * fbm3(x * 1.3, y * 1.3, cv * 0.8 + sv * 0.8 + 3, o.seed, 3) : 1;
      const wv = o.wave ? 1 + o.wave.amp * Math.sin(t * Math.PI * 2 * o.wave.freq + seedPhase) : 1;
      let rn = o.rN(t) * cap * lump * wv;
      let rb = o.rB(t) * cap * lump * (o.wave ? 1 + o.wave.amp * 1.4 * Math.sin(t * Math.PI * 2 * o.wave.freq * 2 + 1.3 + seedPhase) : 1);
      p.set(x + nx * cv * rn, y + ny * cv * rn, sv * rb);
      if (o.hammer) {
        const f = o.hammerFreq ?? 7;
        const d = fbm3(p.x * f, p.y * f, p.z * f, o.seed + 9, 3) * o.hammer;
        rn += d * Math.abs(cv) * Math.sign(cv);
        rb += d * Math.abs(sv) * Math.sign(sv);
        p.set(x + nx * cv * rn, y + ny * cv * rn, sv * rb);
      }
      pos.push(p.x, p.y, p.z);
    }
  }
  const row = segV + 1;
  for (let i = 0; i < segU; i++) {
    for (let j = 0; j < segV; j++) {
      const a = i * row + j, b = a + row, c = b + 1, d = a + 1;
      idx.push(a, b, d, b, c, d);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  return smooth(g);
}

/** Caja redondeada y levemente "tallada": para sellos y bloques. */
export function roundedBlock(w: number, h: number, d: number, round: number, seg: number, seed: number, carve = 0) {
  const g = new BoxGeometry(w, h, d, seg, Math.max(4, Math.floor(seg / 5)), seg);
  const pos = g.attributes.position as Float32BufferAttribute;
  const half = new Vector3(w / 2 - round, h / 2 - round, d / 2 - round);
  const v = new Vector3(), inner = new Vector3(), dir = new Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    inner.set(
      Math.max(-half.x, Math.min(half.x, v.x)),
      Math.max(-half.y, Math.min(half.y, v.y)),
      Math.max(-half.z, Math.min(half.z, v.z)),
    );
    dir.copy(v).sub(inner);
    if (dir.lengthSq() > 0) dir.normalize();
    v.copy(inner).addScaledVector(dir, round);
    // borde vencido por el uso
    const n = fbm3(v.x * 2.2, v.y * 2.2, v.z * 2.2, seed, 3) * 0.05;
    v.addScaledVector(dir, n);
    // grabado: líneas finas sobre la cara superior (y+)
    if (carve && v.y > h / 2 - round * 0.6) {
      const r = 1 - Math.abs(fbm3(v.x * 3.1, v.z * 3.1, 7, seed + 3, 3) * 2.6);
      v.y -= carve * Math.max(0, Math.min(1, (r - 0.78) * 7));
    }
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  return smooth(g);
}

/** Gota (pendiente) por revolución, con irregularidad. */
export function drop(seed: number) {
  const pts: Vector2[] = [];
  const n = 96;
  for (let i = 0; i <= n; i++) {
    const s = i / n; // 0 = punta inferior, 1 = arriba
    const y = -1.15 + s * 2.2;
    const body = Math.sin(Math.PI * Math.pow(s, 0.72));
    const r = 0.78 * Math.pow(body, 0.85) * (1 - 0.32 * s);
    pts.push(new Vector2(Math.max(0.0001, r), y));
  }
  const g = new LatheGeometry(pts, 160);
  const pos = g.attributes.position as Float32BufferAttribute;
  const v = new Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const l = Math.hypot(v.x, v.z) || 1;
    const d = fbm3(v.x * 1.6, v.y * 1.6, v.z * 1.6, seed, 3) * 0.2 + fbm3(v.x * 5, v.y * 5, v.z * 5, seed + 4, 2) * 0.006;
    v.x += (v.x / l) * d;
    v.z += (v.z / l) * d;
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  return smooth(g);
}

/** Pepita escultórica con cavidades para piedras. */
export function nugget(seed: number, cavities: { c: Vector3; r: number }[]) {
  const g = new IcosahedronGeometry(1, 56);
  const pos = g.attributes.position as Float32BufferAttribute;
  const v = new Vector3(), n = new Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    n.copy(v).normalize();
    const lump = fbm3(n.x * 1.3, n.y * 1.3, n.z * 1.3, seed, 2) * 0.36;
    const fine = fbm3(n.x * 4, n.y * 4, n.z * 4, seed + 5, 2) * 0.006;
    v.copy(n).multiplyScalar(1 + lump + fine);
    v.set(v.x * 1.38, v.y * 0.82, v.z * 0.9);
    for (const k of cavities) {
      const d = v.distanceTo(k.c);
      if (d < k.r * 1.55) {
        const t = 1 - d / (k.r * 1.55);
        v.addScaledVector(n, -k.r * 0.3 * t * t * (3 - 2 * t));
      }
    }
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  return smooth(g);
}

/** Cabujón (piedra) levemente irregular. */
export function cabochon(seed: number, r = 0.3, squash = 0.62) {
  const g = new SphereGeometry(r, 64, 48);
  const pos = g.attributes.position as Float32BufferAttribute;
  const v = new Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const k = 1 + fbm3(v.x * 5, v.y * 5, v.z * 5, seed, 2) * 0.14;
    pos.setXYZ(i, v.x * k, v.y * k, v.z * k * squash);
  }
  return smooth(g);
}

export const curves = {
  circle: (R: number) => (t: number): [number, number] => [R * Math.cos(t * Math.PI * 2), R * Math.sin(t * Math.PI * 2)],
  /** arco abierto (forma de C): apertura `gap` (rad) arriba */
  arc: (R: number, gap: number) => (t: number): [number, number] => {
    const a = Math.PI / 2 + gap / 2 + t * (Math.PI * 2 - gap);
    return [R * Math.cos(a), R * Math.sin(a)];
  },
};

export { gauss };


/**
 * La marca de DE SAL: gota de oro fundido con 7 brazos planos y desparejos.
 * Superficie implícita (marching cubes) → fusión líquida real entre el cuerpo y los brazos.
 */
export function splat(seed = 1) {
  const res = 150;
  const mc = new MarchingCubes(res, new MeshBasicMaterial(), false, false, 400000);
  mc.isolation = 60;
  mc.reset();
  const arms = [
    { a: 1.6, l: 0.62, w: 0.85 }, { a: 0.62, l: 0.5, w: 0.65 }, { a: -0.15, l: 0.7, w: 0.75 }, { a: -1.0, l: 0.46, w: 0.7 },
    { a: -2.05, l: 0.56, w: 0.7 }, { a: 2.4, l: 0.5, w: 0.65 }, { a: 3.1, l: 0.66, w: 0.75 },
  ];
  const sub = 12;
  mc.addBall(0.5, 0.5, 0.5, 1.3, sub);
  arms.forEach((arm, k) => {
    const bend = (k % 2 ? 1 : -1) * 0.25;
    for (let i = 1; i <= 22; i++) {
      const t = i / 22;
      const ang = arm.a + bend * t * t;
      const r = 0.05 + t * arm.l * 0.66;
      const str = Math.max(0.05, 0.2 * arm.w * (1 - t * 0.82));
      mc.addBall(0.5 + Math.cos(ang) * r, 0.5 + Math.sin(ang) * r, 0.5, str, sub);
    }
    // gota en la punta del brazo (como en la marca)
    if (k % 3 === 0) mc.addBall(0.5 + Math.cos(arm.a) * (0.05 + arm.l * 0.66 + 0.04), 0.5 + Math.sin(arm.a) * (0.05 + arm.l * 0.66 + 0.04), 0.5, 0.2, sub);
  });
  mc.update();
  const g = new BufferGeometry();
  const n = mc.count;
  g.setAttribute("position", new Float32BufferAttribute((mc.geometry.attributes.position.array as Float32Array).slice(0, n * 3), 3));
  // aplanar (z) y suavizar: la marca es casi plana
  const pos = g.attributes.position as Float32BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    pos.setXYZ(i, x, y, z * 0.5 + 0.0 * seed);
  }
  mc.geometry.dispose();
  g.computeVertexNormals();
  return smooth(g);
}


/** Gema de talla esmeralda (escalonada, 8 facetas): se renderiza con flatShading para que cada faceta refleje distinto. */
export function gem() {
  const pts = [
    [0.0001, -0.5], [0.2, -0.36], [0.4, -0.2], [0.58, -0.05], [0.62, 0], [0.62, 0.05],
    [0.56, 0.13], [0.5, 0.19], [0.42, 0.22], [0.31, 0.25], [0.0001, 0.25],
  ].map(([r, y]) => new Vector2(r, y));
  const g = new LatheGeometry(pts, 8);
  g.rotateY(Math.PI / 8);
  g.scale(1.38, 1, 1);
  return g;
}

/** Engaste cerrado (bisel) que abraza la gema. */
export function bezel() {
  const pts = [
    [0.5, -0.3], [0.72, -0.3], [0.74, 0.0], [0.72, 0.12], [0.66, 0.16], [0.6, 0.15], [0.62, 0.0], [0.5, -0.1],
  ].map(([r, y]) => new Vector2(r, y));
  const g = new LatheGeometry(pts, 8);
  g.rotateY(Math.PI / 8);
  g.scale(1.38, 1, 1);
  return smooth(g);
}
