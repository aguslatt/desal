import { CanvasTexture, RepeatWrapping, LinearMipmapLinearFilter, SRGBColorSpace } from "three";
import { fbm3 } from "@/lib/noise";

/**
 * Micro-superficie procedural para metal real: mapa de rugosidad (variación de pulido) y normal map
 * de grano fino. Es lo que separa un "plástico dorado" de un oro creíble.
 */
let cache: { rough: CanvasTexture; normal: CanvasTexture } | null = null;

export function surfaceMaps() {
  if (cache) return cache;
  const S = 512;
  const h = new Float32Array(S * S);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    // tileable: ruido sobre un toro 4D aproximado
    const a = (x / S) * Math.PI * 2, b = (y / S) * Math.PI * 2;
    const r = 1.6;
    const v = fbm3(Math.cos(a) * r, Math.sin(a) * r, Math.cos(b) * r + Math.sin(b) * r * 0.5, 3, 4);
    const fine = fbm3(Math.cos(a) * 7, Math.sin(a) * 7, Math.sin(b) * 7 + Math.cos(b) * 7, 11, 2);
    h[y * S + x] = v * 0.6 + fine * 0.4;
  }
  const mk = (data: Uint8ClampedArray<ArrayBuffer>) => {
    const c = document.createElement("canvas"); c.width = c.height = S;
    c.getContext("2d")!.putImageData(new ImageData(data, S, S), 0, 0);
    const t = new CanvasTexture(c);
    t.wrapS = t.wrapT = RepeatWrapping; t.repeat.set(2, 2); t.anisotropy = 4; t.minFilter = LinearMipmapLinearFilter;
    return t;
  };
  const rough = new Uint8ClampedArray(new ArrayBuffer(S * S * 4));
  const nrm = new Uint8ClampedArray(new ArrayBuffer(S * S * 4));
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const i = y * S + x;
    const r = Math.max(0, Math.min(255, 170 + h[i] * 190));
    rough.set([0, r, 0, 255], i * 4); // canal G = rugosidad
    const dx = h[y * S + ((x + 1) % S)] - h[y * S + ((x - 1 + S) % S)];
    const dy = h[((y + 1) % S) * S + x] - h[((y - 1 + S) % S) * S + x];
    const k = 5;
    const nx = -dx * k, ny = -dy * k, nz = 1;
    const l = Math.hypot(nx, ny, nz);
    nrm.set([(nx / l * 0.5 + 0.5) * 255, (ny / l * 0.5 + 0.5) * 255, (nz / l * 0.5 + 0.5) * 255, 255], i * 4);
  }
  const rt = mk(rough); const nt = mk(nrm);
  nt.colorSpace = "srgb-linear" as never; rt.colorSpace = "srgb-linear" as never;
  void SRGBColorSpace;
  cache = { rough: rt, normal: nt };
  return cache;
}
