import sharp from "sharp";
const [,, out, cols, ...files] = process.argv;
const c = +cols, w = 720;
const bufs = await Promise.all(files.map(f => sharp(f).resize({ width: w }).toBuffer()));
const metas = await Promise.all(bufs.map(b => sharp(b).metadata()));
const h = Math.max(...metas.map(m => m.height));
const rows = Math.ceil(files.length / c);
await sharp({ create: { width: w * c, height: h * rows, channels: 3, background: "#888" } })
  .composite(bufs.map((b, i) => ({ input: b, left: (i % c) * w, top: Math.floor(i / c) * h }))).png().toFile(out);
