import React from "react";
import { clamp01, easeInOut, lerp, mix, smoothClosedPath, smoothstep, type Pt } from "../../geom.ts";
import { InkStroke } from "../../ink.tsx";
import { noise1 } from "../../noise.ts";
import { SEAT_H } from "../../props.tsx";
import { ScribbleFill } from "../../scribble.tsx";
import { applyIdle, makePose, standSide, type PoseParams } from "./poses.ts";
import {
  GroupSvg,
  boxToWorld,
  buildMember,
  drawAt,
  jointsOf,
  localToRig,
  localToWorld,
  memberJoint,
  memberPoint,
  useGid,
  DEFAULT_DRAW_FRAMES,
  type CastAnchors,
  type CastBaseProps,
  type CastBox,
  type Member,
} from "./common.tsx";
import type { FigureSpec } from "./figure.tsx";

/**
 * (5) DOS PERSONAS JUNTAS — una sentada en un banquito, encorvada, con las manos entre las rodillas; otra de pie a
 * su lado, inclinada hacia ella, con la mano apoyada en su espalda. Micro-movimientos: respiran distinto
 * (la sentada, lenta y pesada), la que acompaña da dos palmaditas suaves y la sentada levanta un poco la cabeza y
 * afloja los hombros (sin pasar de la tristeza a la alegría).
 */
export const SEATED_SPEC: FigureSpec = {
  kind: "adult",
  build: "regular",
  height: 900,
  skin: "tan",
  hair: { style: "short", color: "grey" },
  top: { type: "jacket", color: "yellow", fill: "hatch", sleeves: "filled" },
  legs: { type: "trousers", color: "ink", fill: "solid" },
  shoes: "ink",
  face: "dots",
  seed: 51,
  ink: 1.0,
};

export const STANDING_SPEC: FigureSpec = {
  kind: "adult",
  build: "slim",
  height: 960,
  skin: "deep",
  hair: { style: "long", color: "black" },
  top: { type: "jacket", color: "violet", fill: "hatch", sleeves: "filled" },
  legs: { type: "trousers", color: "ink", fill: "solid" },
  shoes: "ink",
  face: "dots",
  seed: 52,
  ink: 0.95,
};

const KS = 0.9;
const KT = 0.96;
const STOOL_X = 0;
export const SEATED_STANDING_BOX: CastBox = { x0: -302, y0: -950, x1: 242, y1: 16 };

export type SeatedAndStandingProps = CastBaseProps & {
  /** fotograma (absoluto) en que la que acompaña apoya la mano en la espalda; por defecto al terminar de dibujarse */
  handOnBackAt?: number;
  /** fotograma (absoluto) del gesto de alivio de la persona sentada (levanta un poco la cabeza) */
  reliefAt?: number;
};

type State = { seated: Member; standing: Member; hand: Pt; progressStanding: number; progressStool: number };

const compute = (p: SeatedAndStandingProps, frame: number): State => {
  const dur = p.drawFrames ?? DEFAULT_DRAW_FRAMES;
  const idle = p.idle ?? 1;
  const seed = p.seed ?? 0;
  const stoolP = drawAt(frame, p.appearFrom, 20);
  const seatedP = drawAt(frame, p.appearFrom + 6, dur);
  const standingP = drawAt(frame, p.appearFrom + 16, dur);
  const handAt = p.handOnBackAt ?? p.appearFrom + 16 + dur + 6;
  const reliefAt = p.reliefAt ?? handAt + 70;
  const relief = easeInOut(clamp01((frame - reliefAt) / 60));
  const settle = easeInOut(clamp01((frame - handAt) / 40));

  // ── persona sentada (hunched, manos entre las rodillas) ──
  const hipX = -8;
  const hipY = -(SEAT_H + 4) / KS;
  const slow = Math.sin(frame / 62 + 0.7);
  const seatedPose0: PoseParams = makePose({
    hip: [hipX, hipY],
    turn: 0.36,
    lean: lerp(24, 20, relief) + slow * 0.8 * idle,
    curl: lerp(0.52, 0.4, relief),
    shoulderTilt: -1.5,
    kneeL: [hipX + 150, hipY + 4],
    kneeR: [hipX + 176, hipY + 12],
    footL: [hipX + 166, -30],
    footR: [hipX + 194, -30],
    footAngleL: 6,
    footAngleR: 0,
    handL: [hipX + 178, hipY + 62],
    handR: [hipX + 196, hipY + 70],
    elbowOut: 0.2,
    far: "L",
    head: { tilt: -3, nod: lerp(0.58, 0.34, relief) + 0.04 * noise1(seed + 551, frame / 160), look: lerp(0.3, 0.45, relief) },
  });
  const seatedPose = { ...applyIdle(seatedPose0, frame, 51 + seed, idle * 0.7), hip: seatedPose0.hip }; // la cadera no se desliza sobre el banquito
  const seated: Member = { spec: SEATED_SPEC, pose: seatedPose, x: STOOL_X, progress: seatedP, frame, seed };

  // punto de la espalda de la persona sentada (u locales): a ~72 % de la columna, sobre el borde de la espalda
  const sj = jointsOf(SEATED_SPEC, seatedPose);
  const c = mix(sj.hip, sj.neck, 0.7);
  const perp: Pt = [-sj.up[1], sj.up[0]];
  const backRU: Pt = [c[0] - perp[0] * 57, c[1] - perp[1] * 57];
  const backU = memberPoint(seated, backRU);

  // ── persona de pie (inclinada hacia la sentada) ──
  const standX = backU[0] - 238;
  const pat = (a: number, b: number): number => {
    const t = clamp01((frame - a) / (b - a));
    return Math.sin(t * Math.PI * 4) * Math.sin(t * Math.PI) * 4.5;
  };
  const patNow = pat(handAt + 20, handAt + 86) + pat(handAt + 260, handAt + 320);
  const lean = lerp(2, 10, settle) + 0.6 * Math.sin(frame / 90) * idle;
  const standingPose0 = standSide({
    turn: 0.34,
    lean,
    curl: 0.14 * settle,
    hip: [0, -546],
    handL: [-6, -520],
    elbowOut: 0.1,
    footL: [-40, -38],
    footR: [50, -38],
    head: { tilt: lerp(0, 6, settle), nod: lerp(0.05, 0.38, settle), look: lerp(0.5, 0.78, settle) },
  });
  const standingPose = applyIdle(standingPose0, frame, 52 + seed, idle * 0.9);
  const standing: Member = { spec: STANDING_SPEC, pose: standingPose, x: standX, progress: standingP, frame, seed };
  // la mano llega a la espalda; antes de apoyarla cuelga a un costado
  const rest: Pt = [standX + 34, -430];
  const target: Pt = [backU[0] - 6, backU[1] + patNow];
  const hand = mix(rest, target, settle);
  standing.pose = { ...standingPose, handR: localToRig(standing, hand), elbowR: null };
  return { seated, standing, hand, progressStanding: standingP, progressStool: stoolP };
};

const StoolArt: React.FC<{ progress: number }> = ({ progress: p }) => {
  const part = (v: number, a: number, b: number) => clamp01((v - a) / (b - a));
  const top = -SEAT_H;
  const bot = top + 24;
  const L = 118;
  const plank: Pt[] = [
    [-L, top + 2],
    [-L * 0.4, top - 2],
    [L * 0.5, top - 1],
    [L, top + 3],
    [L - 5, bot + 1],
    [L * 0.4, bot - 1],
    [-L * 0.5, bot + 1],
    [-L + 4, bot - 2],
  ];
  const W = 13;
  return (
    <g>
      {p > 0 ? <path d={smoothClosedPath(plank)} fill="#FFF6E7" opacity={clamp01(p * 6)} /> : null}
      <ScribbleFill polygon={plank} color="#BDB8AE" weight={7} density={0.85} angle={4} jitter={0.35} seed={61} progress={part(p, 0.1, 0.5)} />
      <InkStroke points={plank.slice(0, 5)} width={W} progress={part(p, 0, 0.4)} seed={62} />
      <InkStroke points={[plank[4], plank[5], plank[6], plank[7], plank[0]]} width={W} progress={part(p, 0.05, 0.45)} seed={63} />
      <InkStroke points={[[-88, bot], [-104, bot * 0.4], [-112, 0]]} width={W} progress={part(p, 0.5, 0.85)} seed={64} taperStart={4} endWidth={0.7} />
      <InkStroke points={[[88, bot], [104, bot * 0.4], [112, 0]]} width={W} progress={part(p, 0.55, 0.9)} seed={65} taperStart={4} endWidth={0.7} />
      <InkStroke points={[[-100, bot * 0.45], [100, bot * 0.45 + 4]]} width={W * 0.75} progress={part(p, 0.7, 0.95)} seed={66} />
    </g>
  );
};

export const seatedAndStandingAnchors = (p: SeatedAndStandingProps, frame: number = p.frame): CastAnchors => {
  const s = compute(p, frame);
  const w = (q: Pt): Pt => localToWorld(p, q);
  return {
    head: w(memberJoint(s.seated, "headC")),
    chest: w(memberPoint(s.seated, [40, -480])),
    hands: [w(s.hand)],
    feet: w([-60, 0]),
    bounds: boxToWorld(p, SEATED_STANDING_BOX),
  };
};

export const SeatedAndStanding: React.FC<SeatedAndStandingProps> = (props) => {
  const { frame, style } = props;
  const gid = useGid();
  const first = drawAt(frame, props.appearFrom, 20);
  if (first <= 0) return null;
  const s = compute(props, frame);
  const a = buildMember(s.seated, gid, "s");
  const b = buildMember(s.standing, gid, "t");
  return (
    <GroupSvg placement={props} gid={gid} style={style}>
      <g transform={`translate(${STOOL_X} 0)`}>
        <StoolArt progress={s.progressStool} />
      </g>
      {a.behind}
      {b.behind}
      {a.body}
      {b.body}
      {a.hands}
      {b.hands}
    </GroupSvg>
  );
};

void smoothstep;
