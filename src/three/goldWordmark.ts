import {
  BufferGeometry, Texture, Color, ExtrudeGeometry, Group, LatheGeometry, Mesh, MeshPhysicalMaterial, RepeatWrapping,
  SphereGeometry, Vector2, Float32BufferAttribute,
} from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { TessellateModifier } from "three/examples/jsm/modifiers/TessellateModifier.js";
import { mergeGeometries, mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import glyphs from "./logoGlyphs.json";
import { fbm3, mulberry32 } from "@/lib/noise";
import { surfaceMaps } from "./surface";

/** Ancho del wordmark en unidades de glifo (DESAL, sin espacio). */
export const WORD_W = 639.6;
const WORD_H = 122;
const OFFSET_X = 8.4; // bearing izquierdo de la D

const smoothstep = (a: number, b: number, x: number) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/** Oro de los anillos: mismo metal y misma micro-textura martillada, con el patrón escalado al tamaño del logo. */
function goldMaterial() {
  const { rough, normal } = surfaceMaps();
  const tile = (t: Texture, rx: number, ry: number) => { const c = t.clone(); c.wrapS = c.wrapT = RepeatWrapping; c.repeat.set(rx, ry); c.needsUpdate = true; return c; };
  return new MeshPhysicalMaterial({
    color: new Color("#ffbe4f"), metalness: 1, roughness: 0.26,
    roughnessMap: tile(rough, 4.5, 0.9), normalMap: tile(normal, 4.5, 0.9), normalScale: new Vector2(0.2, 0.2),
    envMapIntensity: 1.3, clearcoat: 0.12, clearcoatRoughness: 0.25,
  });
}

function flipWinding(g: BufferGeometry) {
  for (const name of ["position", "normal"]) {
    const a = g.attributes[name];
    if (!a) continue;
    const arr = a.array as Float32Array;
    for (let i = 0; i < arr.length; i += 9) for (let k = 0; k < 3; k++) { const t = arr[i + 3 + k]; arr[i + 3 + k] = arr[i + 6 + k]; arr[i + 6 + k] = t; }
    a.needsUpdate = true;
  }
}

/** Letras extruidas con bisel inflado + superficie ondulada (cera derretida). */
function buildLetters() {
  const loader = new SVGLoader();
  const parts: BufferGeometry[] = [];
  for (const gl of glyphs as { x: number; d: string }[]) {
    const data = loader.parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${gl.d}"/></svg>`);
    const shapes = data.paths.flatMap((p) => p.toShapes());
    const geo = new ExtrudeGeometry(shapes, { depth: 30, bevelEnabled: true, bevelThickness: 15, bevelSize: 10, bevelOffset: -10, bevelSegments: 10, curveSegments: 22 });
    geo.translate(gl.x - OFFSET_X, 0, 0);
    parts.push(geo);
  }
  let g = mergeGeometries(parts.map((p) => { p.deleteAttribute("uv"); return p; }))!;
  // teselar para poder ondular la superficie
  g = new TessellateModifier(8.5, 6).modify(g);
  g.scale(1, -1, 1); flipWinding(g);
  g.translate(-WORD_W / 2, -WORD_H / 2, -22);
  const pos = g.attributes.position as Float32BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    // la cera se derrite: ondas suaves en z (todas las caras comparten la misma función → sin grietas)
    const w = fbm3(x * 0.022, y * 0.03, 1.7, 3, 3);
    const w2 = fbm3(x * 0.085, y * 0.095, 9.1, 7, 3);
    const front = smoothstep(-8, 18, z) + smoothstep(8, -18, z) * 0 ; // más desplazamiento en la cara frontal
    pos.setXYZ(i, x + w2 * 1.2, y + fbm3(x * 0.05, y * 0.05, 4.4, 11, 2) * 1.2, z + (w * 4.4 + w2 * 2.0) * Math.min(1, front));
  }
  g.deleteAttribute("normal");
  g = mergeVertices(g, 0.02);
  g.computeVertexNormals();
  // UV planar (vista frontal) para las vetas
  const uv = new Float32Array(g.attributes.position.count * 2);
  for (let i = 0; i < g.attributes.position.count; i++) { uv[i * 2] = (g.attributes.position.getX(i) + WORD_W / 2) / WORD_W; uv[i * 2 + 1] = (g.attributes.position.getY(i) + WORD_H / 2) / WORD_H; }
  g.setAttribute("uv", new Float32BufferAttribute(uv, 2));
  return g;
}

/** Posiciones de goteo sobre los apoyos inferiores de cada letra (unidades de glifo). */
const DRIPS = [30, 78, 122, 172, 218, 252, 322, 362, 420, 518, 566, 602, 636];

export type Drip = { stem: Mesh; bead: Mesh; len: number; r: number; speed: number; off: number };

export function buildGoldWordmark() {
  const mat = goldMaterial();
  const root = new Group();
  root.add(new Mesh(buildLetters(), mat));

  // gotas colgando
  const rnd = mulberry32(11);
  const dripGeo = new LatheGeometry([[1, 0.12], [0.92, 0], [0.64, -0.22], [0.44, -0.52], [0.4, -0.74], [0.58, -0.9], [0.5, -0.98], [0.0001, -1.06]].map(([r, y]) => new Vector2(r, y)), 24);
  const beadGeo = new SphereGeometry(1, 20, 16);
  const drips: Drip[] = DRIPS.map((x) => {
    const len = 9 + rnd() * 24, r = 4 + rnd() * 2.4;
    const stem = new Mesh(dripGeo, mat), bead = new Mesh(beadGeo, mat);
    stem.position.set(x - OFFSET_X - WORD_W / 2, -WORD_H / 2 + 3, 0);
    bead.position.copy(stem.position);
    root.add(stem, bead);
    return { stem, bead, len, r, speed: 0.07 + rnd() * 0.07, off: rnd() };
  });
    return { root, drips, dispose: () => { mat.dispose(); } };
}

const ease = (t: number) => t * t * (3 - 2 * t);
export function animateDrips(drips: Drip[], t: number) {
  for (const d of drips) {
    const p = (t * d.speed + d.off) % 1;
    const grow = p < 0.75 ? 0.45 + 0.55 * ease(p / 0.75) : 1 - 0.6 * ease((p - 0.75) / 0.25);
    const len = d.len * grow;
    d.stem.scale.set(d.r, len, d.r * 0.8);
    if (p > 0.72) {
      const q = Math.min(1, (p - 0.72) / 0.28);
      d.bead.visible = q < 0.98;
      d.bead.position.y = d.stem.position.y - d.len * 1.0 - q * q * 150;
      d.bead.scale.setScalar(d.r * 0.85 * (1 - q * q * q));
    } else d.bead.visible = false;
  }
}
