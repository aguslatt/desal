import type React from "react";
import { AbsoluteFill, Interactive, type InteractivitySchema } from "remotion";
import { COLORS } from "../config/brand.ts";
import { fontFamily } from "../lib/fonts.ts";
import { CameraContext } from "../world/cameraContext.ts";
import { PhoneChat } from "../chat/PhoneChat";
import { Protagonist, S1_HIP_Y } from "./characters/protagonist.tsx";
import { CrayonCurve } from "./crayon.tsx";
import { InkEllipse, InkStroke, InkSvg } from "./ink.tsx";
import { Paper } from "./paper.tsx";
import { Friend } from "./characters/cast-friend.tsx";
import { Person, type PersonSpec } from "./person.tsx";
import { SKIN_TONES } from "./palette.ts";
import { Bench, SEAT_H, Wheelchair, benchSeat, wheelchairPose } from "./props.tsx";
import { seated, standFront, standSide, walkFront, walkSide } from "./rig.ts";
import { Blob, ScribbleFill } from "./scribble.tsx";

/**
 * GALERÍA del kit de ilustración (Still 1080×1920): trazos con dibujo progresivo, garabatos, tonos de piel,
 * curva de crayón, reparto de ejemplo y la protagonista en dos escalas. Es la referencia visual para revisar el
 * estilo y para copiar el uso de la API (ver README.md de esta carpeta).
 */
type Props = { readonly labels?: boolean; readonly style?: React.CSSProperties };

/**
 * Panel recortado con su propia «cámara»: el punto de mundo `center` cae en el punto de pantalla `at`
 * (por defecto el centro del panel), a `scale`.
 */
const PanelCam: React.FC<{ x: number; y: number; w: number; h: number; scale: number; center: [number, number]; at?: [number, number]; children: React.ReactNode }> = ({ x, y, w, h, scale, center, at, children }) => {
  const [px, py] = at ?? [x + w / 2, y + h / 2];
  const cx = center[0] - (px - 540) / scale;
  const cy = center[1] - (py - 960) / scale;
  return (
    <CameraContext.Provider value={{ scale, cx, cy }}>
      <AbsoluteFill style={{ clipPath: `inset(${y}px ${1080 - x - w}px ${1920 - y - h}px ${x}px)` }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0, transform: `translate(540px, 960px) scale(${scale}) translate(${-cx}px, ${-cy}px)` }}>{children}</div>
      </AbsoluteFill>
    </CameraContext.Provider>
  );
};

const Label: React.FC<{ x: number; y: number; children: string }> = ({ x, y, children }) => (
  <div style={{ position: "absolute", left: x, top: y, fontFamily, fontWeight: 600, fontSize: 19, letterSpacing: 0.4, color: COLORS.inkSoft }}>{children}</div>
);

const sp = (o: PersonSpec): PersonSpec => o;
const CAST: Record<string, PersonSpec> = {
  long: sp({ skin: "olive", hair: { style: "long", color: "black" }, top: { type: "coat", color: "violet" }, seed: 1 }),
  curly: sp({ skin: "deep", hair: { style: "curly", color: "black" }, top: { type: "top", color: "green", fill: "solid" }, legs: { type: "trousers", color: "ink" }, seed: 2 }),
  bun: sp({ skin: "porcelain", hair: { style: "bun", color: "brown" }, top: { type: "dress", color: "pink" }, accessories: [{ type: "bag", color: "yellow" }], seed: 3 }),
  elder: sp({ kind: "elder", skin: "tan", hair: { style: "short", color: "grey" }, top: { type: "jacket", color: "inkGreen" }, legs: { type: "trousers", color: "grey", fill: "hatch" }, accessories: [{ type: "cane", hand: "R" }], seed: 4 }),
  bald: sp({ skin: "brown", hair: { style: "bald" }, top: { type: "top", color: "yellow" }, legs: { type: "trousers", color: "ink" }, accessories: [{ type: "backpack", color: "violet" }], seed: 5 }),
  child: sp({ kind: "child", skin: "light", hair: { style: "ponytail", color: "darkBrown" }, top: { type: "top", color: "pink" }, legs: { type: "trousers", color: "violet", fill: "hatch" }, seed: 6 }),
  chair: sp({ skin: "dark", hair: { style: "bob", color: "black" }, top: { type: "top", color: "inkGreen", fill: "hatch" }, legs: { type: "trousers", color: "ink" }, seed: 8 }),
};

const STROKE: [number, number][] = [[0, 30], [70, -10], [160, 14], [250, 50], [330, 20]];

const Inner: React.FC<Props> = ({ labels = true, style }) => {
  const frame = 0;
  const bench = { x: 1000, y: 1500 };
  const pS = benchSeat(bench, -1);
  const fS = benchSeat(bench, 0.92);
  const friendSpec: PersonSpec = { skin: "light", hair: { style: "bun", color: "brown" }, top: { type: "top", color: "violet", fill: "hatch", sleeves: "filled" }, legs: { type: "trousers", color: "ink" }, seed: 7 };
  return (
    <AbsoluteFill style={{ fontFamily, ...style }}>
      <Paper />

      {/* 1 · trazo de tinta con dibujo progresivo */}
      <PanelCam x={0} y={20} w={1080} h={210} scale={1} center={[540, 130]}>
        <InkSvg>
          {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
            <g key={i} transform={`translate(${40 + i * 170} 130) scale(0.46)`}>
              <InkStroke points={STROKE} progress={p} seed={i + 2} width={14} />
            </g>
          ))}
          <InkEllipse cx={940} cy={120} rx={34} ry={40} seed={4} width={9} />
          <InkEllipse cx={1020} cy={120} rx={30} ry={38} seed={9} width={9} rotate={14} />
        </InkSvg>
      </PanelCam>
      {labels ? <Label x={34} y={26}>TRAZO DE TINTA · dibujo progresivo 0 · .25 · .5 · .75 · 1 · óvalos a mano</Label> : null}

      {/* 2 · garabatos y tonos de piel */}
      <PanelCam x={0} y={240} w={1080} h={200} scale={1} center={[540, 340]}>
        <InkSvg>
          <ScribbleFill polygon={[[70, 300], [190, 290], [206, 390], [84, 402]]} seed={2} density={1.1} />
          <ScribbleFill polygon={[[240, 300], [360, 290], [376, 390], [254, 402]]} seed={3} color={COLORS.purple} weight={6} density={0.62} angle={52} />
          <ScribbleFill polygon={[[410, 300], [530, 290], [546, 390], [424, 402]]} seed={5} color={COLORS.pink} weight={9} density={1} angle={34} />
          <ScribbleFill polygon={[[580, 300], [700, 290], [716, 390], [594, 402]]} seed={6} color={COLORS.green} weight={6} density={0.6} angle={60} />
          {Object.values(SKIN_TONES).map((c, i) => {
            const cx = 790 + (i % 4) * 66;
            const cy = 322 + Math.floor(i / 4) * 74;
            return (
              <g key={c}>
                <Blob polygon={Array.from({ length: 14 }, (_, k) => [cx + Math.cos((k / 14) * 6.283) * 25, cy + Math.sin((k / 14) * 6.283) * 29] as [number, number])} color={c} seed={i} rough={2} />
                <InkEllipse cx={cx} cy={cy} rx={25} ry={29} seed={20 + i} width={6} />
              </g>
            );
          })}
        </InkSvg>
      </PanelCam>
      {labels ? <Label x={34} y={246}>GARABATO · sólido y de lápiz · TONOS DE PIEL</Label> : null}

      {/* 3 · hilo de crayón (grosor en pantalla 14 px, compensado) */}
      <PanelCam x={0} y={450} w={1080} h={250} scale={1} center={[540, 590]}>
        <CrayonCurve d="M -40 640 C 160 520, 360 700, 560 590 S 900 520, 1140 620" progress={1} seed={3} />
        <CrayonCurve d="M -40 680 C 200 600, 420 740, 640 660 S 900 630, 1140 680" progress={0.62} seed={9} />
        <CrayonCurve d="M 60 540 C 260 500, 520 540, 700 510" progress={1} seed={12} width={9} color={COLORS.purple} shade="#6F0094" />
      </PanelCam>
      {labels ? <Label x={34} y={456}>CRAYÓN · naranja 14 px · progreso .62 · acento violeta fino</Label> : null}

      {/* 4 · reparto con el Person genérico (escala ≈ 0,26 como en el encuadre final) */}
      <PanelCam x={0} y={736} w={1080} h={290} scale={0.26} center={[2250, 1000]} at={[540, 1018]}>
        <Person spec={CAST.long} pose={standFront()} x={350} y={1000} frame={frame} />
        <Person spec={CAST.curly} pose={standFront({ handR: [150, -430] })} x={1110} y={1000} frame={frame} />
        <Person spec={CAST.bun} pose={standSide()} x={1870} y={1000} frame={frame} />
        <Person spec={CAST.elder} pose={standSide({ lean: 5 })} x={2630} y={1000} frame={frame} facing={-1} />
        <Person spec={CAST.bald} pose={walkSide(0.2)} x={3390} y={1000} frame={frame} />
        <Person spec={CAST.child} pose={standFront({ handL: [-90, -390] })} x={4150} y={1000} frame={frame} />
      </PanelCam>
      <PanelCam x={0} y={1030} w={1080} h={290} scale={0.26} center={[2250, 1000]} at={[540, 1304]}>
        <Person spec={CAST.long} pose={walkSide(0.7)} x={500} y={1000} facing={-1} frame={frame} />
        <Person spec={CAST.curly} pose={walkFront(0.3)} x={1250} y={1000} frame={frame} />
        <Wheelchair x={2100} y={1000} />
        <Person spec={CAST.chair} pose={wheelchairPose(1.05)} x={2100} y={1000} frame={frame} />
        <Bench x={3300} y={1000} />
        <Person spec={friendSpec} pose={seated({ seat: (SEAT_H + 4) / 1.05 - 8, knee: 90, turn: 0.7 })} x={benchSeat({ x: 3300, y: 1000 }, -0.5).x} y={1000} frame={frame} />
      </PanelCam>
      {labels ? <Label x={34} y={706}>PERSON · PersonSpec + pose: de pie, perfil, camina, silla de ruedas, banco</Label> : null}

      {/* 5 · la protagonista: escala de la escena 3 y encuadre final con el hilo */}
      <PanelCam x={0} y={1330} w={540} h={590} scale={0.6} center={[540, S1_HIP_Y]} at={[270, 1690]}>
        <Bench x={540} y={S1_HIP_Y + 300} />
        <Protagonist frame={470} x={514} y={S1_HIP_Y} phone={<PhoneChat />} />
      </PanelCam>
      <PanelCam x={540} y={1330} w={540} h={590} scale={0.6} center={[(pS.x + fS.x) / 2 + 50, 1500 - 400]} at={[810, 1640]}>
        <CrayonCurve d="M -1000 1000 C 100 500, 700 1900, 1500 900 S 2400 500, 3000 1100" progress={1} seed={3} />
        <Bench x={1000} y={1500} />
        <Protagonist frame={800} x={pS.x} y={pS.y} controls={{ phoneScale: 0.7, thumbsOpacity: 1 }} phone={<PhoneChat />} />
        <Friend frame={800} x={fS.x + 50} y={fS.y} />
      </PanelCam>
      {labels ? <Label x={34} y={1336}>PROTAGONISTA · escala 0,62 (fin de escena 3)</Label> : null}
      {labels ? <Label x={554} y={1336}>ESCENA 4 · el gesto de la amiga · escala 0,6</Label> : null}
    </AbsoluteFill>
  );
};

const schema = {
  labels: { type: "boolean", default: true, description: "Mostrar rótulos" },
} as const satisfies InteractivitySchema;

export const Gallery = Interactive.withSchema({
  Component: Inner,
  componentName: "<Gallery>",
  schema,
  wrapInSequence: true,
});
