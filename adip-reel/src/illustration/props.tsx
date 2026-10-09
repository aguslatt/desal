import React from "react";
import { COLORS } from "../config/brand.ts";
import { ellipsePoly, part, rad, rotate, type Pt } from "./geom.ts";
import { Flat, handCirclePoints, InkStroke, INK_WIDTH } from "./ink.tsx";
import { BENCH, PHONE, SEAT_TOP, WHEELCHAIR } from "./dims.ts";

/**
 * OBJETOS DE LA ESCENA dibujados con el mismo trazo fino: banco, silla de ruedas y celular.
 * Marco local de cada objeto = marco de la figura que lo usa (origen en el SUELO; mira a +x; y hacia abajo).
 */

type Common = { progress?: number; seed?: number; ink?: string; width?: number; paper?: string };

/** Sombra plana apenas más oscura que el papel (un neutro derivado del gris del manual). */
export const Shadow: React.FC<{ cx: number; rx: number; ry?: number; opacity?: number }> = ({ cx, rx, ry = 6.5, opacity = 1 }) => (
  <ellipse cx={cx} cy={1} rx={rx} ry={ry} fill="#E1E1E1" opacity={opacity} />
);

/** Banco simple sin respaldo: tablón de contorno fino y dos patas. `hipX` = x de la cadera de quien se sienta. */
export const Bench: React.FC<Common & { hipX?: number }> = ({ progress = 1, seed = 5, ink = COLORS.black, width = INK_WIDTH, paper = COLORS.grey, hipX = 0 }) => {
  const x0 = hipX + BENCH.x0;
  const x1 = hipX + BENCH.x1;
  const top = -SEAT_TOP;
  const bot = top + BENCH.thickness;
  const L = x1 - x0;
  const plank: Pt[] = [
    [x0 + 2, top + 1],
    [x0 + L * 0.3, top - 1.5],
    [x0 + L * 0.7, top - 0.5],
    [x1, top + 1],
    [x1 + 2, top + BENCH.thickness * 0.5],
    [x1 - 1, bot + 1],
    [x0 + L * 0.6, bot - 0.5],
    [x0 + L * 0.25, bot + 1],
    [x0 - 1, bot],
    [x0 - 2, top + BENCH.thickness * 0.5],
  ];
  const pPlank = part(progress, 0, 0.5);
  const pLegs = part(progress, 0.3, 0.9);
  const legX0 = x0 + 36;
  const legX1 = x1 - 34;
  const outline = [...plank, plank[0], plank[1]];
  return (
    <g>
      <Shadow cx={(x0 + x1) / 2} rx={L * 0.5} />
      <InkStroke points={[[legX0 - 4, bot], [legX0 - 9, bot / 2], [legX0 - 12, -1]]} width={width * 0.9} progress={pLegs} seed={seed + 3} taperStart={4} endWidth={0.6} color={ink} />
      <InkStroke points={[[legX0 + 5, bot], [legX0 + 9, bot / 2], [legX0 + 12, -1]]} width={width * 0.9} progress={pLegs} seed={seed + 4} taperStart={4} endWidth={0.6} color={ink} />
      <InkStroke points={[[legX1 - 5, bot], [legX1 - 9, bot / 2], [legX1 - 12, -1]]} width={width * 0.9} progress={pLegs} seed={seed + 5} taperStart={4} endWidth={0.6} color={ink} />
      <InkStroke points={[[legX1 + 4, bot], [legX1 + 9, bot / 2], [legX1 + 12, -1]]} width={width * 0.9} progress={pLegs} seed={seed + 6} taperStart={4} endWidth={0.6} color={ink} />
      <InkStroke points={[[legX0 - 9, -SEAT_TOP * 0.42], [legX0 + 9, -SEAT_TOP * 0.42 + 2]]} width={width * 0.7} progress={pLegs} seed={seed + 7} color={ink} />
      <InkStroke points={[[legX1 - 9, -SEAT_TOP * 0.42], [legX1 + 9, -SEAT_TOP * 0.42 + 2]]} width={width * 0.7} progress={pLegs} seed={seed + 8} color={ink} />
      <Flat poly={plank} color={paper} opacity={pPlank > 0 ? 1 : 0} />
      <InkStroke points={outline} width={width} progress={pPlank} seed={seed} taperStart={6} taperEnd={8} color={ink} smooth />
    </g>
  );
};

// ───────────────────────── silla de ruedas ─────────────────────────

/** Estructura de la silla (va DETRÁS de quien se sienta). */
export const WheelchairFrame: React.FC<Common & { casterRoll?: number }> = ({ progress = 1, seed = 11, ink = COLORS.black, width = INK_WIDTH, paper = COLORS.grey, casterRoll = 0 }) => {
  const R = WHEELCHAIR.rear;
  const C = WHEELCHAIR.caster;
  const p1 = part(progress, 0, 0.5);
  const p2 = part(progress, 0.25, 0.8);
  const p3 = part(progress, 0.45, 0.95);
  const w = width;
  const casterSpokes: React.ReactNode[] = [];
  for (let i = 0; i < 3; i++) {
    const a = rad(casterRoll + i * 60);
    casterSpokes.push(
      <InkStroke key={i} points={[[C.x - Math.cos(a) * (C.r - 7), C.y - Math.sin(a) * (C.r - 7)], [C.x + Math.cos(a) * (C.r - 7), C.y + Math.sin(a) * (C.r - 7)]]} width={w * 0.34} progress={p3} seed={seed + 60 + i} taperStart={1} taperEnd={1} startWidth={1} endWidth={1} pressure={0} wobble={0.1} tremor={0.05} color={ink} />,
    );
  }
  return (
    <g>
      <Shadow cx={50} rx={150} />
      {/* estructura: respaldo + empuñadura, asiento, apoyapiés, travesaño y horquilla del caster */}
      <InkStroke points={[[-30, -122], [-36, -180], [-42, -238], [-68, -243]]} width={w} progress={p1} seed={seed} taperStart={4} taperEnd={6} color={ink} />
      <Flat poly={[[-30, -125], [30, -127], [112, -128], [114, -117], [30, -115], [-29, -113]]} color={paper} opacity={p1 > 0 ? 1 : 0} />
      <InkStroke points={[[-31, -121], [30, -123], [112, -124]]} width={w * 1.15} progress={p1} seed={seed + 1} taperStart={4} taperEnd={6} color={ink} />
      <InkStroke points={[[112, -122], [124, -72], [134, -22]]} width={w * 0.9} progress={p2} seed={seed + 2} taperStart={4} taperEnd={4} color={ink} />
      <InkStroke points={[[128, -19], [168, -18], [206, -17]]} width={w * 1.1} progress={p2} seed={seed + 3} taperStart={4} taperEnd={6} color={ink} />
      <InkStroke points={[[-22, -112], [30, -102], [96, -98]]} width={w * 0.8} progress={p2} seed={seed + 4} taperStart={4} taperEnd={4} color={ink} />
      <InkStroke points={[[-6, -118], [R.x, R.y]]} width={w * 0.7} progress={p2} seed={seed + 5} taperStart={2} taperEnd={2} color={ink} />
      <InkStroke points={[[96, -98], [98, -60], [C.x, C.y]]} width={w * 0.8} progress={p3} seed={seed + 6} taperStart={2} taperEnd={2} color={ink} />
      {/* caster */}
      <Flat poly={ellipsePoly(C.x, C.y, C.r, C.r)} color={paper} opacity={p3 > 0 ? 1 : 0} />
      <InkStroke points={handCirclePoints(C.x, C.y, C.r, C.r, { seed: seed + 20, overlap: 14 })} width={w * 0.95} progress={p3} seed={seed + 7} taperStart={6} taperEnd={8} color={ink} />
      {casterSpokes}
      <circle cx={C.x} cy={C.y} r={3.2} fill={ink} opacity={p3} />
    </g>
  );
};

/**
 * Rueda trasera (va DELANTE de quien se sienta): neumático, aro de empuje, 12 rayos finos y una válvula (punto) que hace evidente el giro.
 * `roll` = giro en grados (+ = sentido horario en el marco local = rodar hacia +x): roll = recorrido / radio.
 */
export const WheelchairWheel: React.FC<Common & { roll?: number }> = ({ progress = 1, seed = 31, ink = COLORS.black, width = INK_WIDTH, roll = 0 }) => {
  const R = WHEELCHAIR.rear;
  const w = width;
  const pTire = part(progress, 0.05, 0.5);
  const pSpokes = part(progress, 0.35, 0.9);
  const spokes: React.ReactNode[] = [];
  const N = 12;
  for (let i = 0; i < N; i++) {
    const a = rad(roll + (360 * i) / N);
    const c = Math.cos(a);
    const s = Math.sin(a);
    spokes.push(
      <InkStroke
        key={i}
        points={[[R.x + c * 9, R.y + s * 9], [R.x + c * (R.r - 11), R.y + s * (R.r - 11)]]}
        width={w * 0.3}
        progress={pSpokes}
        seed={seed + 50 + i}
        taperStart={1}
        taperEnd={1}
        startWidth={1}
        endWidth={1}
        pressure={0}
        wobble={0.15}
        tremor={0.05}
        color={ink}
        opacity={0.8}
      />,
    );
  }
  const va = rad(roll - 40);
  return (
    <g>
      <InkStroke points={handCirclePoints(R.x, R.y, R.r, R.r, { seed: seed + 1, overlap: 16, startAngle: -100 })} width={w * 1.05} progress={pTire} seed={seed} taperStart={8} taperEnd={12} color={ink} />
      <InkStroke points={handCirclePoints(R.x, R.y, WHEELCHAIR.rim, WHEELCHAIR.rim, { seed: seed + 2, overlap: 12, startAngle: -60 })} width={w * 0.38} progress={pTire} seed={seed + 3} taperStart={8} taperEnd={8} wobble={0.5} color={ink} opacity={0.9} />
      {spokes}
      <circle cx={R.x} cy={R.y} r={6.4} fill={ink} opacity={pSpokes} />
      <circle cx={R.x + Math.cos(va) * (R.r - 5.5)} cy={R.y + Math.sin(va) * (R.r - 5.5)} r={2.6} fill={ink} opacity={pSpokes} />
    </g>
  );
};

// ───────────────────────── celular ─────────────────────────

const roundRect = (cx: number, cy: number, w: number, h: number, r: number, angleDeg: number): Pt[] => {
  const pts: Pt[] = [];
  const corner = (ox: number, oy: number, a0: number) => {
    for (let k = 0; k <= 3; k++) {
      const a = rad(a0 + (k * 90) / 3);
      pts.push([ox + Math.cos(a) * r, oy + Math.sin(a) * r]);
    }
  };
  const hw = w / 2;
  const hh = h / 2;
  corner(hw - r, -hh + r, -90);
  corner(hw - r, hh - r, 0);
  corner(-hw + r, hh - r, 90);
  corner(-hw + r, -hh + r, 180);
  const a = rad(angleDeg);
  return pts.map((p) => {
    const q = rotate(p, a);
    return [cx + q[0], cy + q[1]] as Pt;
  });
};

/** Celular de contorno fino, pantalla clara con una burbuja de chat naranja. `angle` 0 = vertical; + = gira en sentido horario. */
export const Phone: React.FC<Common & { c: Pt; angle: number }> = ({ c, angle, progress = 1, seed = 71, ink = COLORS.black, width = INK_WIDTH }) => {
  const body = roundRect(c[0], c[1], PHONE.wid, PHONE.len, 4.5, angle);
  const screen = roundRect(c[0], c[1] - 0.5, PHONE.wid - 5, PHONE.len - 8, 2.4, angle);
  const a = rad(angle);
  const bub = (u: number, v: number, w: number, h: number, color: string) => {
    const p = rotate([u, v], a);
    return <Flat poly={roundRect(c[0] + p[0], c[1] + p[1], w, h, 1.8, angle)} color={color} />;
  };
  const p = part(progress, 0.55, 0.95);
  return (
    <g opacity={p > 0 ? 1 : 0}>
      <Flat poly={body} color="#FFFFFF" />
      <Flat poly={screen} color="#F4F4F4" />
      {bub(1.5, -9, 8.5, 4.4, COLORS.orange)}
      {bub(-1.5, -2.5, 7, 3.6, "#CFCFCF")}
      {bub(0.5, 4, 8, 3.6, "#CFCFCF")}
      <InkStroke points={[...body, body[0], body[1]]} width={width * 0.8} progress={p} seed={seed} taperStart={4} taperEnd={6} color={ink} smooth={false} />
    </g>
  );
};

export { BENCH, PHONE, SEAT_TOP, WHEELCHAIR };
export { rimPoint } from "./dims.ts";
