import React, { useId } from "react";
import { COLORS } from "../../config/brand.ts";
import { clamp01, deg, lerp, norm, rotate, smoothClosedPath, sub, type Pt } from "../geom.ts";
import { InkStroke } from "../ink.tsx";
import { noise1 } from "../noise.ts";
import { buildFigure } from "../figure.tsx";
import { INK_WIDTH } from "../person.tsx";
import { SKIN_TONES } from "../palette.ts";
import { FriendHand } from "../hand.tsx";
import { bodyDims } from "../rig.ts";
import { Blob, ScaleBy } from "../scribble.tsx";
import { GrainDefs } from "../texture.tsx";
import {
  HIP_RU,
  K,
  PHONE_CENTER,
  PHONE_NATIVE,
  PHONE_RECT,
  PHONE_SCALE,
  PHONE_SIZE,
  PROTAGONIST_FIGURE,
  PROTAGONIST_HEAD_TOP,
  PROTAGONIST_HEIGHT,
  PROTAGONIST_SPEC,
  S1_HIP_Y,
  defaultControls,
  phoneCenterWorld,
  phoneNativeToLocal,
  phoneState,
  phoneToWorld,
  protagonistBlink,
  protagonistPose,
  protagonistRig,
  thumbsAt,
  type PhoneState,
  type ProtagonistControls,
  type ThumbState,
} from "./protagonist-motion.ts";

/**
 * LA PROTAGONISTA — persona sentada (adulta joven) que sostiene el celular con las dos manos.
 * El movimiento y la geometría (sin JSX) viven en `protagonist-motion.ts`; acá se dibuja.
 *
 * COORDENADAS: el ancla (x, y) es la CADERA, apoyada en el asiento del banco (ver `benchSeat`). Todo lo
 * «local» (PHONE_RECT, PHONE_CENTER, PROTAGONIST_HEAD_TOP…) está en u de mundo relativas a esa cadera, con
 * `scale = 1`. y negativo = arriba. La figura MIRA hacia +x (hacia la derecha: ahí llega la amiga).
 *
 * CAPAS (de atrás hacia adelante): cuerpo → palmas → bisel del celular → pantalla (`phone`) → pulgares.
 * El celular es el chat NATIVO 1080×1920 escalado por PHONE_SCALE (0,26): <Protagonist phone={<PhoneChat/>}/>.
 */
export {
  PHONE_CENTER,
  PHONE_NATIVE,
  PHONE_RECT,
  PHONE_SCALE,
  PHONE_SIZE,
  PROTAGONIST_HEAD_TOP,
  PROTAGONIST_HEIGHT,
  PROTAGONIST_SPEC,
  S1_HIP_Y,
  defaultControls,
  phoneCenterWorld,
  phoneNativeToLocal,
  phoneState,
  phoneToWorld,
  protagonistPose,
  thumbsAt,
  type PhoneState,
  type ProtagonistControls,
  type ThumbState,
};

const SKIN = SKIN_TONES.brown;

// ───────────────────────── manos ─────────────────────────


/** Contorno de la palma (detrás del celular): un óvalo irregular en el borde del celular. */
const palmPoly = (c: Pt, side: -1 | 1, tilt: number): Pt[] => {
  const pts: Pt[] = [];
  const n = 14;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    pts.push(rotate([c[0] + Math.cos(a) * 20, c[1] + Math.sin(a) * 31], deg(tilt + side * 8), c));
  }
  return pts;
};

const Thumb: React.FC<{ base: Pt; side: -1 | 1; st: ThumbState; tilt: number; seed: number; ink: number }> = ({ base, side, st, tilt, seed, ink }) => {
  // dirección: hacia arriba y hacia el interior de la pantalla
  const ang = deg((side < 0 ? -28 : -152) + tilt + st.wander * side * -1);
  const len = 14 + 46 * st.reach;
  const dir: Pt = [Math.cos(ang), Math.sin(ang)];
  const perp: Pt = [-dir[1], dir[0]];
  const bend = 5 * side;
  const mid: Pt = [base[0] + dir[0] * len * 0.55 + perp[0] * bend, base[1] + dir[1] * len * 0.55 + perp[1] * bend];
  const tip: Pt = [base[0] + dir[0] * len, base[1] + dir[1] * len + 0];
  const ws = [12.5, 11.2, 9.4 - st.press * 0.7];
  const pts = [base, mid, tip];
  const L: Pt[] = [];
  const R: Pt[] = [];
  pts.forEach((q, i) => {
    const t = norm(sub(pts[Math.min(2, i + 1)], pts[Math.max(0, i - 1)]));
    L.push([q[0] - t[1] * ws[i], q[1] + t[0] * ws[i]]);
    R.push([q[0] + t[1] * ws[i], q[1] - t[0] * ws[i]]);
  });
  const td = norm(sub(tip, mid));
  const tn: Pt = [-td[1], td[0]];
  const cap: Pt[] = [];
  for (let i = 1; i < 6; i++) {
    const a = (i / 6) * Math.PI;
    cap.push([tip[0] - tn[0] * Math.cos(a) * ws[2] + td[0] * Math.sin(a) * ws[2], tip[1] - tn[1] * Math.cos(a) * ws[2] + td[1] * Math.sin(a) * ws[2]]);
  }
  const outline: Pt[] = [...L, ...cap, ...R.slice().reverse()];
  const w = INK_WIDTH * 0.46 * ink;
  // uña: arco corto cerca de la punta
  const nailC: Pt = [tip[0] - td[0] * 5, tip[1] - td[1] * 5];
  return (
    <g>
      <path d={smoothClosedPath(outline)} fill={SKIN} />
      <InkStroke points={outline} width={w} seed={seed} taperStart={4} taperEnd={6} startWidth={0.7} endWidth={0.6} pressure={0.2} />
      {len > 26 ? <InkStroke points={[[nailC[0] - tn[0] * 6, nailC[1] - tn[1] * 6], [nailC[0] + td[0] * 3, nailC[1] + td[1] * 3], [nailC[0] + tn[0] * 6, nailC[1] + tn[1] * 6]]} width={w * 0.5} seed={seed + 3} taperStart={2} taperEnd={2} startWidth={0.8} endWidth={0.8} pressure={0} /> : null}
    </g>
  );
};

// ───────────────────────── componente ─────────────────────────

export type ProtagonistProps = {
  /** fotograma ABSOLUTO del reel (respiración, parpadeo, gestos) */
  frame: number;
  /** cadera/asiento en el mundo */
  x: number;
  y: number;
  /** escala del conjunto (1 recomendado: PHONE_SCALE está calculado para 1) */
  scale?: number;
  /** el chat nativo 1080×1920; se dibuja ENTRE el cuerpo y los pulgares */
  phone?: React.ReactNode;
  /** 0..1 dibujo progresivo de la figura y el celular */
  drawProgress?: number;
  /** anula los controles derivados del cronograma (cualquiera de ellos) */
  controls?: Partial<ProtagonistControls>;
  /** intensidad de la respiración/reposo (0..1, por defecto 1) */
  idle?: number;
  style?: React.CSSProperties;
};

export const Protagonist: React.FC<ProtagonistProps> = ({ frame, x, y, scale = 1, phone, drawProgress = 1, controls, idle = 1, style }) => {
  const { c, st, thumbs, hw, hh, gripY, pose, eFree, toWorldLocal, ru } = protagonistRig(frame, controls, idle);
  const free = clamp01(c.handFree);
  const dims = bodyDims(PROTAGONIST_SPEC.kind, PROTAGONIST_SPEC.build);

    const gid = `g${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const layers = buildFigure(PROTAGONIST_FIGURE, pose, { progress: drawProgress, hideHands: true, blink: idle > 0 ? protagonistBlink(frame) : 0, grainId: gid });

  // geometría de manos (en RU; la pose ya fijó las muñecas)
  const j = layers.joints;
  const ink = PROTAGONIST_SPEC.ink ?? 1;
  const thumbBase = (g: Pt): Pt => ru([g[0], g[1]]);
  const baseL = thumbBase(toWorldLocal(-hw + 7 + 12 * thumbs.L.reach, gripY + 4 - 6 * thumbs.L.reach));
  const baseR = thumbBase(toWorldLocal(hw - 7 - 12 * thumbs.R.reach, gripY + 4 - 6 * thumbs.R.reach));
  const palmLPoly = palmPoly(j.wristL, -1, st.tilt);
  const palmRPoly = palmPoly(j.wristR, 1, st.tilt);

  // bisel del celular (negro, esquinas redondeadas, borde levemente irregular)
  const bez = 5.5;
  const bw = hw + bez;
  const bh = hh + bez;
  const rr = 24 * (st.s / PHONE_SCALE) + bez;
  const bezelPts: Pt[] = [];
  const corner = (cx0: number, cy0: number, a0: number) => {
    for (let i = 0; i <= 5; i++) {
      const a = deg(a0 + (90 * i) / 5);
      bezelPts.push([cx0 + Math.cos(a) * rr, cy0 + Math.sin(a) * rr]);
    }
  };
  corner(bw - rr, -bh + rr, -90);
  corner(bw - rr, bh - rr, 0);
  corner(-bw + rr, bh - rr, 90);
  corner(-bw + rr, -bh + rr, 180);
  const bezel = bezelPts.map((q, i) => [q[0] + noise1(61, i * 0.9) * 0.9, q[1] + noise1(62, i * 0.9) * 0.9] as Pt);
  const bezelOpacity = clamp01(drawProgress * 4);

  const k = scale;
  const phoneOp = clamp01((drawProgress - 0.05) * 4);

  return (
    <div style={{ position: "absolute", left: x, top: y, width: 0, height: 0, ...style }}>
      {/* cuerpo (+ palmas detrás del celular) */}
      <svg width={1} height={1} viewBox="0 0 1 1" style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }}>
        <GrainDefs id={gid} />
        <g transform={`scale(${(PROTAGONIST_HEIGHT / 1000) * k}) translate(${-HIP_RU[0]} ${-HIP_RU[1]})`}>
          <ScaleBy k={(PROTAGONIST_HEIGHT / 1000) * k}>
          {layers.behind}
          {layers.body}
          <g opacity={clamp01(drawProgress * 3)}>
            <Blob polygon={palmLPoly} color={SKIN} seed={71} rough={1.4} grain={gid} />
            <g opacity={1 - clamp01((eFree - 0.1) / 0.25)}>
              <Blob polygon={palmRPoly} color={SKIN} seed={72} rough={1.4} grain={gid} />
            </g>
            <InkStroke points={[...palmLPoly, palmLPoly[0], palmLPoly[1]]} width={INK_WIDTH * 0.62} seed={73} taperStart={6} taperEnd={6} startWidth={0.7} endWidth={0.5} pressure={0.2} />
            <InkStroke points={[...palmRPoly, palmRPoly[0], palmRPoly[1]]} width={INK_WIDTH * 0.62} seed={74} taperStart={6} taperEnd={6} startWidth={0.7} endWidth={0.5} pressure={0.2} opacity={1 - clamp01((eFree - 0.1) / 0.25)} />
          </g>
          </ScaleBy>
        </g>
        {/* bisel del celular (en u de mundo) */}
        <g transform={`scale(${k}) translate(${st.cx} ${st.cy}) rotate(${st.tilt})`} opacity={bezelOpacity}>
          <path d={smoothClosedPath(bezel)} fill={COLORS.black} />
        </g>
      </svg>

      {/* pantalla: el chat nativo 1080×1920 */}
      <div
        style={{
          position: "absolute",
          left: st.cx * k - PHONE_NATIVE.w / 2,
          top: st.cy * k - PHONE_NATIVE.h / 2,
          width: PHONE_NATIVE.w,
          height: PHONE_NATIVE.h,
          scale: (st.s / 1) * k,
          rotate: `${st.tilt}deg`,
          opacity: phoneOp,
          overflow: "hidden",
          ...(phone ? null : { backgroundColor: COLORS.cream, borderRadius: 90 }),
        }}
      >
        {phone}
      </div>

      {/* pulgares */}
      <svg width={1} height={1} viewBox="0 0 1 1" style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none", opacity: c.thumbsOpacity * clamp01(drawProgress * 3) }}>
        <g transform={`scale(${(PROTAGONIST_HEIGHT / 1000) * k}) translate(${-HIP_RU[0]} ${-HIP_RU[1]})`}>
          <Thumb base={baseL} side={-1} st={thumbs.L} tilt={st.tilt} seed={81} ink={ink} />
          <g opacity={1 - clamp01(free * 6)}>
            <Thumb base={baseR} side={1} st={thumbs.R} tilt={st.tilt} seed={82} ink={ink} />
          </g>
        </g>
      </svg>

      {/* mano derecha libre (sobre el muslo, abierta apenas hacia quien le ofrece la suya) */}
      {free > 0 ? (
        <svg width={1} height={1} viewBox="0 0 1 1" style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none", opacity: clamp01((eFree - 0.1) / 0.25) * clamp01(drawProgress * 3) }}>
          <g transform={`scale(${(PROTAGONIST_HEIGHT / 1000) * k}) translate(${-HIP_RU[0]} ${-HIP_RU[1]})`}>
            <FriendHand wrist={j.wristR} angle={lerp(14, 2, c.reach)} open={lerp(0.1, 0.5, c.reach)} len={dims.hand * 1.16} skin={SKIN} ink={INK_WIDTH * ink} seed={91} progress={1} grainId={gid} />
          </g>
        </svg>
      ) : null}
    </div>
  );
};

