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

const gauss = (t: number, c: number, w: number) => Math.exp(-((t - c) ** 2) / (2 * w * w));

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
};

/** Barre una sección elíptica a lo largo de una curva plana. Base de anillos, aros, brazaletes y cordones. */
export function sweep(o: SweepOpts) {
  const segU = o.segU ?? 320;
  const segV = o.segV ?? 64;
  const pos: number[] = [];
  const idx: number[] = [];
  const eps = 1e-3;
  const p = new Vector3();

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
      const cv = Math.cos(v), sv = Math.sin(v);
      const lump = o.lump ? 1 + o.lump * fbm3(x * 1.3, y * 1.3, cv * 0.8 + sv * 0.8 + 3, o.seed, 3) : 1;
      let rn = o.rN(t) * cap * lump;
      let rb = o.rB(t) * cap * lump;
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
    const d = fbm3(v.x * 1.6, v.y * 1.6, v.z * 1.6, seed, 4) * 0.2 + fbm3(v.x * 8, v.y * 8, v.z * 8, seed + 4, 2) * 0.018;
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
    const lump = fbm3(n.x * 1.5, n.y * 1.5, n.z * 1.5, seed, 4) * 0.34;
    const fine = fbm3(n.x * 7, n.y * 7, n.z * 7, seed + 5, 2) * 0.011;
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
