import sharp from "sharp";
const [,, out, ...files] = process.argv;
const h = 900;
const bufs = await Promise.all(files.map(f => sharp(f).resize({ height: h }).toBuffer()));
const metas = await Promise.all(bufs.map(b => sharp(b).metadata()));
let x = 0; const comp = bufs.map((b, i) => { const c = { input: b, left: x, top: 0 }; x += metas[i].width + 8; return c; });
await sharp({ create: { width: x, height: h, channels: 3, background: "#888" } }).composite(comp).png().toFile(out);
