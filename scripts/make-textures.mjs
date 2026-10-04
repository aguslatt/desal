// Texturas procedurales de DE SAL: grano global, costra de sal, arena. Sin assets externos.
import sharp from "sharp";
import { mulberry32 } from "./_rng.mjs";

const OUT = new URL("../public/tex/", import.meta.url).pathname;

function noiseRaw(w, h, seed, fn) {
  const r = mulberry32(seed);
  const buf = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const [R, G, B, A] = fn(r, i);
    buf[i * 4] = R; buf[i * 4 + 1] = G; buf[i * 4 + 2] = B; buf[i * 4 + 3] = A;
  }
  return buf;
}


// ruido de valor TILEABLE (la rejilla hace wrap) con octavas
function tileNoise(W, cells, seed, oct = 3) {
  const out = new Float32Array(W * W);
  let amp = 1, tot = 0;
  for (let o = 0; o < oct; o++) {
    const n = cells * 2 ** o;
    const r = mulberry32(seed + o * 101);
    const g = Array.from({ length: n * n }, () => r());
    const sm = (t) => t * t * (3 - 2 * t);
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
      const fx = (x / W) * n, fy = (y / W) * n;
      const x0 = Math.floor(fx), y0 = Math.floor(fy);
      const tx = sm(fx - x0), ty = sm(fy - y0);
      const a = g[(y0 % n) * n + (x0 % n)], b = g[(y0 % n) * n + ((x0 + 1) % n)];
      const c = g[((y0 + 1) % n) * n + (x0 % n)], d = g[((y0 + 1) % n) * n + ((x0 + 1) % n)];
      out[y * W + x] += amp * (a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty);
    }
    tot += amp; amp *= 0.5;
  }
  for (let i = 0; i < out.length; i++) out[i] /= tot;
  return out;
}

// 1) grano global: pixeles oscuros con alpha aleatorio mínimo (no necesita blend-mode)
await sharp(noiseRaw(240, 240, 11, (r) => [20, 18, 14, Math.floor(r() ** 2.2 * 46)]), { raw: { width: 240, height: 240, channels: 4 } })
  .png({ compressionLevel: 9 }).toFile(OUT + "grain.png");

// 2) costra de sal: hueso con cristales finos; manchas MUY suaves (tileable)
{
  const W = 720;
  const blot = tileNoise(W, 4, 5, 3);
  const r = mulberry32(21);
  const out = Buffer.alloc(W * W * 3);
  for (let i = 0; i < W * W; i++) {
    const q = r();
    let v = 241 + (blot[i] - 0.5) * 16 + r() * 8;
    if (q > 0.988) v = 255; // cristal
    else if (q < 0.008) v -= 38; // poro
    out[i * 3] = Math.min(255, v); out[i * 3 + 1] = Math.min(255, v - 3); out[i * 3 + 2] = Math.min(255, v - 26);
  }
  await sharp(out, { raw: { width: W, height: W, channels: 3 } }).webp({ quality: 84 }).toFile(OUT + "salt.webp");
}

// 3) arena: manchas algo más grandes y cálidas (tileable)
{
  const W = 720;
  const blot = tileNoise(W, 3, 9, 4);
  const r = mulberry32(33);
  const out = Buffer.alloc(W * W * 3);
  for (let i = 0; i < W * W; i++) {
    const q = r();
    const k = 0.9 + blot[i] * 0.2 + r() * 0.05 - (q < 0.01 ? 0.22 : 0) + (q > 0.992 ? 0.12 : 0);
    out[i * 3] = Math.min(255, 206 * k); out[i * 3 + 1] = Math.min(255, 196 * k); out[i * 3 + 2] = Math.min(255, 150 * k);
  }
  await sharp(out, { raw: { width: W, height: W, channels: 3 } }).webp({ quality: 84 }).toFile(OUT + "sand.webp");
}
console.log("texturas ok");
