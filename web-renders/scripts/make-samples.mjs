// Genera IMÁGENES DE MUESTRA (placeholders) para la web.
// Son composiciones abstractas dibujadas por código: NO son renders del arquitecto
// ni imágenes de terceros. Se reemplazan por sus renders (ver README → "Reemplazar imágenes").
//   npm run samples
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const OUT = new URL("../src/assets/muestras/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

// RNG determinista
const rng = (seed) => () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);

const grain = (w, h, seed, amt = 0.1) => `
  <filter id="gr" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="${seed}" result="n"/>
    <feColorMatrix in="n" type="saturate" values="0"/>
    <feComponentTransfer><feFuncA type="table" tableValues="0 ${amt}"/></feComponentTransfer>
  </filter>`;

const frame = (w, h, defs, body, seed) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>${grain(w, h, seed)}
    <radialGradient id="vg" cx="50%" cy="50%" r="75%"><stop offset="55%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity=".5"/></radialGradient>
    <filter id="b6"><feGaussianBlur stdDeviation="6"/></filter>
    <filter id="b16"><feGaussianBlur stdDeviation="16"/></filter>
    <filter id="b40"><feGaussianBlur stdDeviation="40"/></filter>
    ${defs}
  </defs>
  ${body}
  <rect width="${w}" height="${h}" fill="url(#vg)"/>
  <rect width="${w}" height="${h}" filter="url(#gr)"/>
</svg>`;

const lg = (id, stops, x2 = 0, y2 = 1) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops
    .map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`)
    .join("")}</linearGradient>`;

/* ───────── A · exterior al atardecer ───────── */
function exterior(w, h, v) {
  const tall = v === 2;
  const P = v === 0 || tall
    ? { top: "#1b1d26", mid: "#6b4a43", hor: "#e0a070", glow: "#ffcf8a" }
    : { top: "#202636", mid: "#4f5668", hor: "#b9a58f", glow: "#ffd9a0" };
  const R = rng(11 + v);
  const gy = h * 0.64;
  const bld = `
    <g id="bld">
      <rect x="${w * .2}" y="${h * .30}" width="${w * .72}" height="${h * .085}" fill="#2a2724"/>
      <rect x="${w * .2}" y="${h * .30}" width="${w * .72}" height="${h * .012}" fill="#4a443e"/>
      <rect x="${w * .27}" y="${h * .385}" width="${w * .56}" height="${gy - h * .385}" fill="url(#glow)"/>
      ${Array.from({ length: 7 }, (_, i) => `<rect x="${w * (.27 + i * .0933) - 3}" y="${h * .385}" width="6" height="${gy - h * .385}" fill="#14110f"/>`).join("")}
      <rect x="${w * .27}" y="${h * .385}" width="${w * .56}" height="${h * .012}" fill="#fff3d6" opacity=".75"/>
      <rect x="${w * .36}" y="${gy - h * .1}" width="${w * .12}" height="${h * .05}" rx="6" fill="#3b2a22" opacity=".85"/>
      <rect x="${w * .36}" y="${gy - h * .145}" width="${w * .04}" height="${h * .045}" fill="#3b2a22" opacity=".85"/>
      <rect x="${w * .6}" y="${gy - h * .16}" width="${w * .035}" height="${h * .16}" fill="#2a1c15" opacity=".8"/>
      <rect x="${w * .2}" y="${h * .385}" width="${w * .07}" height="${gy - h * .385}" fill="#201d1a"/>
      <rect x="${w * .2}" y="${h * .385}" width="${w * .07}" height="${gy - h * .385}" fill="url(#timber)" opacity=".5"/>
      <rect x="${w * .83}" y="${h * .385}" width="${w * .09}" height="${gy - h * .385}" fill="#38332d"/>
      <rect x="${w * .15}" y="${gy - 6}" width="${w * .8}" height="12" fill="#1a1816"/>
    </g>`;
  const trees = Array.from({ length: 9 }, () => {
    const x = R() < .5 ? R() * w * .22 : w * (.88 + R() * .12);
    const r = (tall ? w * .6 : h) * (.1 + R() * .12);
    return `<circle cx="${x}" cy="${gy - r * .4}" r="${r}" fill="#0f1210"/>`;
  }).join("");
  const stars = Array.from({ length: 30 }, () => `<circle cx="${R() * w}" cy="${R() * h * .25}" r="${R() * 1.6 + .4}" fill="#fff" opacity="${R() * .5}"/>`).join("");
  return frame(w, h,
    lg("sky", [[0, P.top], [.55, P.mid], [1, P.hor]]) +
    lg("glow", [[0, P.glow], [1, "#d98d4a"]]) +
    lg("timber", [[0, "#6a4a32"], [1, "#2c1f16"]], 1, 0) +
    lg("gnd", [[0, "#1a1816"], [1, "#0c0b0a"]]) +
    lg("wtr", [[0, "#2a2623"], [.5, "#15130f"], [1, "#0b0a09"]]),
    `<rect width="${w}" height="${gy}" fill="url(#sky)"/>
     ${stars}
     <path d="M0 ${gy} L0 ${h * .5} Q${w * .25} ${h * .44} ${w * .5} ${h * .5} T${w} ${h * .47} L${w} ${gy}Z" fill="#161517" opacity=".85"/>
     <rect y="${gy}" width="${w}" height="${h - gy}" fill="url(#wtr)"/>
     ${bld}
     <g transform="translate(0 ${gy * 2}) scale(1 -1)" opacity=".4" filter="url(#b6)"><use href="#bld"/></g>
     <rect y="${gy + h * .34}" width="${w}" height="${h}" fill="#0b0a09"/>
     <rect y="${gy}" width="${w}" height="${h * .02}" fill="${P.hor}" opacity=".18" filter="url(#b6)"/>
     <ellipse cx="${w * .55}" cy="${h * .5}" rx="${w * .3}" ry="${h * .16}" fill="${P.glow}" opacity=".16" filter="url(#b40)"/>
     ${trees}
     <rect y="${h * .9}" width="${w}" height="${h * .1}" fill="#000" opacity=".5" filter="url(#b40)"/>`, 11 + v);
}

/* ───────── B · interior de día, luz entrando ───────── */
function living(w, h, v) {
  const P = v === 0
    ? { wall: "#d9cdb9", wall2: "#a89a86", floor: "#9a7a58", sun: "#fff1cf", sky: "#cfe0ea" }
    : { wall: "#cfc2ae", wall2: "#8f8170", floor: "#7d6044", sun: "#ffe7b5", sky: "#e7d9c4" };
  const wx = w * .08, ww = w * .84, wy = h * .1, wh = h * .56, fl = h * .74;
  const mull = Array.from({ length: 4 }, (_, i) => w * (.08 + (i + 1) * .168));
  const shadows = mull.map((x) => `<polygon points="${x - 5},${fl} ${x + 5},${fl} ${x + 5 + w * .22},${h} ${x - 5 + w * .22},${h}" fill="#3a2a1a" opacity=".22"/>`).join("");
  return frame(w, h,
    lg("wall", [[0, P.wall], [1, P.wall2]]) +
    lg("floor", [[0, P.floor], [1, "#4b3825"]]) +
    lg("sky", [[0, P.sky], [1, "#fff8ea"]]) +
    lg("haze", [[0, P.sun, .9], [1, P.sun, 0]]),
    `<rect width="${w}" height="${fl}" fill="url(#wall)"/>
     <rect y="${fl}" width="${w}" height="${h - fl}" fill="url(#floor)"/>
     ${Array.from({ length: 26 }, (_, i) => `<line x1="${(i / 25) * w * 1.4 - w * .2}" y1="${h}" x2="${w * .5 + (i / 25 - .5) * w * .6}" y2="${fl}" stroke="#2a1d12" stroke-opacity=".16" stroke-width="2"/>`).join("")}
     <rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" fill="url(#sky)"/>
     <ellipse cx="${w * .3}" cy="${wy + wh * .75}" rx="${w * .16}" ry="${h * .1}" fill="#6f8566" opacity=".55" filter="url(#b16)"/>
     <ellipse cx="${w * .72}" cy="${wy + wh * .8}" rx="${w * .2}" ry="${h * .12}" fill="#5d7355" opacity=".5" filter="url(#b16)"/>
     ${mull.map((x) => `<rect x="${x - 4}" y="${wy}" width="8" height="${wh}" fill="#2b2622"/>`).join("")}
     <rect x="${wx - 8}" y="${wy - 8}" width="${ww + 16}" height="${wh + 16}" fill="none" stroke="#2b2622" stroke-width="16"/>
     <rect x="${wx}" y="${fl - 14}" width="${ww}" height="14" fill="#cfc4b0"/>
     ${shadows}
     <polygon points="${wx},${fl} ${wx + ww},${fl} ${wx + ww + w * .22},${h} ${wx + w * .22},${h}" fill="${P.sun}" opacity=".5" filter="url(#b6)"/>
     <rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" fill="url(#haze)" opacity=".35"/>
     <rect x="${w * .16}" y="${fl + h * .05}" width="${w * .5}" height="${h * .13}" rx="${h * .02}" fill="#1f1b18"/>
     <rect x="${w * .16}" y="${fl - h * .02}" width="${w * .5}" height="${h * .09}" rx="${h * .02}" fill="#2a2420"/>
     <rect x="${w * .2}" y="${fl - h * .005}" width="${w * .09}" height="${h * .05}" rx="${h * .012}" fill="#b45f3c"/>
     <rect x="${w * .7}" y="${fl + h * .05}" width="${w * .09}" height="${h * .015}" fill="#171310"/>
     <rect x="${w * .73}" y="${fl - h * .03}" width="${w * .015}" height="${h * .09}" fill="#171310"/>
     <line x1="${w * .52}" y1="0" x2="${w * .52}" y2="${h * .3}" stroke="#171310" stroke-width="3"/>
     <circle cx="${w * .52}" cy="${h * .31}" r="${h * .04}" fill="#f5ead4"/>
     <rect y="${h * .88}" width="${w}" height="${h * .12}" fill="#000" opacity=".35" filter="url(#b40)"/>`, 21 + v);
}

/* ───────── C · materialidad: madera y piedra con luz rasante ───────── */
function material(w, h, v) {
  const R = rng(31 + v);
  const slats = Math.round(w / (v === 0 ? 70 : 54));
  const sw = (w * .55) / slats;
  const tones = ["#8a5e3b", "#7a5232", "#966a45", "#6e4a2e", "#a07650"];
  let s = "";
  for (let i = 0; i < slats; i++) {
    const t = tones[Math.floor(R() * tones.length)];
    s += `<rect x="${i * sw}" y="0" width="${sw - 3}" height="${h}" fill="${t}"/>`;
    s += `<rect x="${i * sw}" y="0" width="${sw - 3}" height="${h}" fill="url(#slatShade)"/>`;
    for (let k = 0; k < 6; k++) s += `<line x1="${i * sw + R() * sw}" y1="0" x2="${i * sw + R() * sw}" y2="${h}" stroke="#2b1a0e" stroke-opacity=".14"/>`;
  }
  let veins = "";
  for (let i = 0; i < 14; i++) {
    const x = w * .55 + R() * w * .45, y = R() * h;
    veins += `<path d="M${x} ${y} q${(R() - .5) * 200} ${(R() - .5) * 200} ${(R() - .5) * 420} ${(R() - .5) * 420}" stroke="${R() < .5 ? "#8e877c" : "#d8d2c6"}" stroke-width="${1 + R() * 3}" fill="none" opacity=".5" filter="url(#b6)"/>`;
  }
  return frame(w, h,
    lg("slatShade", [[0, "#000", .35], [.3, "#000", 0], [1, "#fff", .08]], 1, 0) +
    lg("stone", [[0, "#cfc9bd"], [1, "#a39c90"]], 1, 1) +
    lg("rake", [[0, "#fff1d6", .0], [.5, "#fff1d6", .28], [1, "#fff1d6", 0]], 1, .4),
    `<rect width="${w}" height="${h}" fill="#2b2420"/>
     ${s}
     <rect x="${w * .55}" width="${w * .45}" height="${h}" fill="url(#stone)"/>
     ${veins}
     <rect x="${w * .55 - 10}" width="20" height="${h}" fill="#000" opacity=".5" filter="url(#b6)"/>
     <rect x="${w * .55 - 4}" width="8" height="${h}" fill="#b8956a"/>
     <rect x="${w * (v === 0 ? .62 : .66)}" y="${h * .14}" width="${w * .09}" height="${h * .72}" fill="#26211d" opacity=".25" filter="url(#b16)"/>
     <rect width="${w}" height="${h}" fill="url(#rake)"/>`, 31 + v);
}

/* ───────── D · fachada con aletas, luz de mañana ───────── */
function facade(w, h, v) {
  const P = v === 0 ? { top: "#a9bccb", bot: "#efe3cf" } : { top: "#d8b9a0", bot: "#f4e4c9" };
  const bx = w * .14, bw = w * .72, by = h * .08, bh = h * .84;
  const floors = 9;
  const fins = Math.round(bw / 38);
  let fs = "";
  for (let i = 0; i <= fins; i++) {
    const x = bx + (i * bw) / fins;
    fs += `<rect x="${x}" y="${by}" width="9" height="${bh}" fill="url(#fin)"/>`;
    fs += `<rect x="${x + 9}" y="${by}" width="22" height="${bh}" fill="#000" opacity=".16"/>`;
  }
  let fl = "";
  for (let i = 0; i <= floors; i++) fl += `<rect x="${bx - 14}" y="${by + (i * bh) / floors - 4}" width="${bw + 28}" height="10" fill="#d6cbb8"/>`;
  return frame(w, h,
    lg("sky", [[0, P.top], [1, P.bot]]) +
    lg("glass", [[0, "#3f5260"], [.5, "#7d8e97"], [1, "#2b3841"]], 1, 1) +
    lg("fin", [[0, "#e9ddca"], [1, "#b9ac96"]], 1, 0),
    `<rect width="${w}" height="${h}" fill="url(#sky)"/>
     <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="url(#glass)"/>
     ${Array.from({ length: floors }, (_, i) => `<rect x="${bx}" y="${by + (i * bh) / floors + 8}" width="${bw}" height="${bh / floors * .35}" fill="#ffe9bd" opacity="${.05 + (i % 3) * .06}"/>`).join("")}
     ${fl}${fs}
     <polygon points="${bx + bw},${by} ${w},${by + bh * .1} ${w},${h} ${bx + bw},${h}" fill="#000" opacity=".12"/>
     <rect x="0" y="${h * .92}" width="${w}" height="${h * .08}" fill="#2a2724"/>
     <rect x="${bx - 14}" y="${h * .92 - 10}" width="${bw + 28}" height="14" fill="#3a352f"/>
     <polygon points="0,0 ${w * .5},0 ${w * .2},${h} 0,${h}" fill="#fff4dc" opacity=".12" filter="url(#b40)"/>`, 41 + v);
}

/* ───────── E · interior nocturno, luz cálida ───────── */
function night(w, h, v) {
  const lamp = v === 0 ? .28 : .66;
  return frame(w, h,
    lg("wall", [[0, "#2a211c"], [1, "#14100e"]]) +
    lg("pan", [[0, "#6f4a31"], [1, "#3a2517"]], 1, 0) +
    lg("win", [[0, "#1c2740"], [1, "#3a4a6a"]]) +
    `<radialGradient id="lg" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffcf8a" stop-opacity=".9"/><stop offset="1" stop-color="#ffcf8a" stop-opacity="0"/></radialGradient>`,
    `<rect width="${w}" height="${h}" fill="url(#wall)"/>
     <rect x="${w * .08}" y="${h * .06}" width="${w * .26}" height="${h * .62}" fill="url(#win)"/>
     <rect x="${w * .08}" y="${h * .06}" width="${w * .26}" height="${h * .62}" fill="none" stroke="#0b0908" stroke-width="10"/>
     <rect x="${w * .205}" y="${h * .06}" width="6" height="${h * .62}" fill="#0b0908"/>
     <rect x="${w * .42}" y="${h * .08}" width="${w * .5}" height="${h * .5}" fill="url(#pan)"/>
     ${Array.from({ length: 14 }, (_, i) => `<rect x="${w * .42 + (i * w * .5) / 14}" y="${h * .08}" width="3" height="${h * .5}" fill="#1a0f08" opacity=".4"/>`).join("")}
     <rect y="${h * .68}" width="${w}" height="${h * .32}" fill="#0f0c0a"/>
     <rect x="${w * .3}" y="${h * .54}" width="${w * .66}" height="${h * .2}" rx="${h * .02}" fill="#3d3028"/>
     <rect x="${w * .3}" y="${h * .48}" width="${w * .66}" height="${h * .09}" rx="${h * .02}" fill="#e4d6c0"/>
     <rect x="${w * .34}" y="${h * .44}" width="${w * .16}" height="${h * .06}" rx="${h * .02}" fill="#cdbba0"/>
     <rect x="${w * .62}" y="${h * .45}" width="${w * .12}" height="${h * .05}" rx="${h * .02}" fill="#b45f3c"/>
     <rect x="${w * .39}" y="${h * .33}" width="${w * .02}" height="${h * .15}" fill="#171310"/>
     <circle cx="${w * .46}" cy="${h * .35}" r="${h * .09}" fill="url(#lg)" opacity="${lamp + .4}"/>
     <circle cx="${w * .46}" cy="${h * .35}" r="${h * .022}" fill="#ffe7b0"/>
     <rect x="${w * .1}" y="${h * .72}" width="${w * .8}" height="${h * .08}" fill="#ffcf8a" opacity=".05" filter="url(#b16)"/>`, 51 + v);
}

/* ───────── F · doble altura con escalera y claraboya ───────── */
function stair(w, h, v) {
  const P = v === 0 ? { a: "#d9d1c3", b: "#9c9283", l: "#fff0cc" } : { a: "#c4bdb0", b: "#80776a", l: "#ffe2b0" };
  const steps = 14;
  let st = "";
  for (let i = 0; i < steps; i++) {
    const x = w * (.18 + (i * .6) / steps), y = h * (.88 - (i * .5) / steps), sw = (w * .6) / steps;
    st += `<rect x="${x}" y="${y}" width="${sw + 2}" height="${h * .03}" fill="#e9dfcf"/>`;
    st += `<rect x="${x}" y="${y + h * .03}" width="${sw + 2}" height="${h * .5 / steps + 4}" fill="#8f8473"/>`;
  }
  return frame(w, h,
    lg("w", [[0, P.a], [1, P.b]]) +
    lg("beam", [[0, P.l, .85], [1, P.l, 0]], .4, 1) +
    lg("gl", [[0, "#26211d"], [1, "#4b4036"]]),
    `<rect width="${w}" height="${h}" fill="url(#w)"/>
     <rect y="${h * .88}" width="${w}" height="${h * .12}" fill="#3a2f26"/>
     <rect x="0" y="0" width="${w}" height="${h * .09}" fill="#1a1613"/>
     <rect x="${w * .24}" y="${h * .015}" width="${w * .52}" height="${h * .05}" fill="#fff8e6"/>
     <polygon points="${w * .24},${h * .06} ${w * .76},${h * .06} ${w * (v === 0 ? .98 : .78)},${h * .95} ${w * (v === 0 ? .4 : .12)},${h * .95}" fill="url(#beam)" filter="url(#b16)"/>
     ${st}
     <rect x="${w * .78}" y="${h * .2}" width="${w * .035}" height="${h * .68}" fill="#17130f"/>
     <rect x="${w * .08}" y="${h * .22}" width="${w * .09}" height="${h * .6}" fill="url(#gl)"/>
     <ellipse cx="${w * .67}" cy="${h * .8}" rx="${w * .07}" ry="${h * .1}" fill="#41543b"/>
     <rect x="${w * .655}" y="${h * .84}" width="${w * .03}" height="${h * .05}" fill="#1a1613"/>`, 61 + v);
}

const SCENES = { exterior, living, material, facade, night, stair };

const JOBS = [
  // [archivo, escena, w, h]
  ["casa-horizonte-1", "exterior", 2400, 1500, 0],
  ["casa-horizonte-2", "exterior", 2400, 1500, 1],
  ["luz-norte-1", "living", 1600, 2000, 0],
  ["luz-norte-2", "living", 1600, 2000, 1],
  ["materia-1", "material", 1800, 1800, 0],
  ["materia-2", "material", 1800, 1800, 1],
  ["torre-aletas-1", "facade", 2100, 1400, 0],
  ["torre-aletas-2", "facade", 2100, 1400, 1],
  ["suite-nocturna-1", "night", 2520, 1080, 0],
  ["suite-nocturna-2", "night", 2520, 1080, 1],
  ["vacio-central-1", "stair", 1600, 2000, 0],
  ["vacio-central-2", "stair", 1600, 2000, 1],
  ["hero", "exterior", 2800, 1600, 0],
  ["hero-vertical", "exterior", 1200, 1900, 2],
];

for (const [name, kind, w, h, v] of JOBS) {
  const svg = SCENES[kind](w, h, v);
  await sharp(Buffer.from(svg)).webp({ quality: 80 }).toFile(`${OUT}${name}.webp`);
  console.log("✓", name, `${w}×${h}`);
}
