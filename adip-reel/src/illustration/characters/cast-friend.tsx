import React, { useId } from "react";
import { clamp01, type Pt } from "../geom.ts";
import { SKIN_TONES, resolveColor } from "../palette.ts";
import { buildFigure } from "../figure.tsx";
import type { PersonSpec } from "../person.tsx";
import { BENCH_SLOTS, benchSeat } from "../props.tsx";
import { bodyDims, resolvePose } from "../rig.ts";
import { ScaleBy } from "../scribble.tsx";
import { GrainDefs } from "../texture.tsx";
import { FriendHand } from "./cast-friend/hand.tsx";
import { FRIEND_HEIGHT, HAND_LEN, K, OFFER_WRIST, SEAT_DY, anchorsFrom, friendMotion, friendTimes, handAngle, type FriendAnchors, type FriendMotion, type FriendTimes } from "./cast-friend/motion.ts";

/**
 * LA AMIGA — la persona que se acerca, se sienta junto a la protagonista, se gira hacia ella y le ofrece una mano.
 *
 * Uso (dentro del contenedor con la cámara, coordenadas de MUNDO; ancla = la CADERA sentada en el banco):
 *   const seat = benchSeat(BENCH_AT, BENCH_SLOTS.friend);          // FRIEND_SEAT de src/world/stage.ts
 *   <Friend frame={absFrame} x={seat.x} y={seat.y} />
 * Camina desde la derecha (fuera de cuadro hasta ≈ f636), se sienta (contacto en `friendSitFrom`), gira hacia la
 * protagonista y ofrece la mano en `friendGestureAt`; después sostiene el gesto respirando. Mira hacia −x.
 */
export { FRIEND_HEIGHT, OFFER_WRIST, SEAT_DY, friendMotion, friendTimes };
export type { FriendAnchors, FriendMotion, FriendTimes };

/** Banco: la amiga se sienta en este slot (ver `benchSeat`) */
export const FRIEND_BENCH_SLOT = BENCH_SLOTS.friend;
/** Cadera de la amiga sentada en el banco `bench` (= FRIEND_SEAT de src/world/stage.ts): el `x, y` de <Friend>. */
export const friendSeat = (bench: { x: number; y: number; scale?: number }): { x: number; y: number } => benchSeat(bench, FRIEND_BENCH_SLOT);
/** Fotograma desde el que la figura queda sentada con la mano ofrecida (sostiene el gesto respirando hasta el final). */
export const FRIEND_HELD_FROM = friendTimes().offerTo;

/** Aspecto: piel aceitunada, pelo a la altura del mentón (bob) castaño rojizo, saco rosa liso (marcador) con bufanda violeta, pantalón gris claro. */
export const FRIEND_SPEC: PersonSpec = {
  kind: "adult",
  build: "regular",
  height: FRIEND_HEIGHT,
  skin: "olive",
  hair: { style: "bob", color: "auburn" },
  top: { type: "jacket", color: "pink", fill: "solid", sleeves: "filled" },
  legs: { type: "trousers", color: "grey", fill: "solid" },
  shoes: "ink",
  accessories: [{ type: "scarf", color: "violet" }],
  face: "dots",
  ink: 0.88,
  seed: 7,
};

export type FriendProps = {
  /** fotograma ABSOLUTO del reel */
  frame: number;
  /** cadera sentada en el mundo (FRIEND_SEAT de stage.ts) */
  x: number;
  y: number;
  /** escala del conjunto (1 recomendado) */
  scale?: number;
  /** 0..1 dibujo progresivo de la figura */
  drawProgress?: number;
  /** 0..1 intensidad de la respiración/reposo */
  idle?: number;
  /** muñeca de la mano ofrecida en el MUNDO (por defecto: sobre su rodilla, hacia la protagonista) */
  offerTarget?: Pt;
  /** hitos de tiempo (por defecto COMPANION_TIMING) */
  times?: FriendTimes;
  /** aspecto alternativo (piel, pelo, ropa…; la altura y la contextura quedan fijas). Por defecto FRIEND_SPEC. */
  spec?: PersonSpec;
  style?: React.CSSProperties;
};

export const Friend: React.FC<FriendProps> = ({ frame, x, y, scale = 1, drawProgress = 1, idle = 1, offerTarget, times, spec = FRIEND_SPEC, style }) => {
  const offerWrist: Pt | undefined = offerTarget ? [(offerTarget[0] - x) / scale, (offerTarget[1] - y) / scale] : undefined;
  const m = friendMotion(frame, { times, offerWrist, idle });
  const gid = `g${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  // antes de entrar está fuera de cuadro (con cualquier cámara del reel): no se dibuja
  if (frame < m.times.enter - 24) return null;
  const look: PersonSpec = { ...spec, kind: "adult", build: "regular", height: FRIEND_HEIGHT };
  const layers = buildFigure({ ...look, headScale: 1.04, neckDrop: 8 }, m.pose, { progress: drawProgress, hideHands: true, blink: idle > 0 ? m.blink : 0, grainId: gid });
  const j = layers.joints;
  const skin = resolveColor(look.skin ?? "olive", SKIN_TONES);
  const ink = (look.ink ?? 1) * 12.5;
  const hp = clamp01((drawProgress - 0.62) / 0.16);

  const handFor = (side: "L" | "R") => {
    const hs = m.hands[side];
    const wrist = side === "L" ? j.wristL : j.wristR;
    return <FriendHand key={side} wrist={wrist} angle={handAngle(m, j, side)} open={hs.open} len={HAND_LEN} skin={skin} ink={ink} seed={side === "L" ? 211 : 223} progress={hp} grainId={gid} />;
  };
  // la mano del brazo que queda detrás del torso (perfil) se dibuja ANTES del cuerpo
  const far = j.far;

  return (
    <div style={{ position: "absolute", left: x, top: y, width: 0, height: 0, ...style }}>
      <svg width={1} height={1} viewBox="0 0 1 1" style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }}>
        <GrainDefs id={gid} />
        <g transform={`scale(${scale}) translate(${m.ax.toFixed(2)} ${SEAT_DY}) scale(${-K} ${K})`}>
          <ScaleBy k={scale * K}>
            {layers.behind}
            {far ? handFor(far) : null}
            {layers.body}
            {("L" as const) !== far ? handFor("L") : null}
            {("R" as const) !== far ? handFor("R") : null}
            {layers.hands}
          </ScaleBy>
        </g>
      </svg>
    </div>
  );
};

type Place = { x: number; y: number; scale?: number; times?: FriendTimes; offerTarget?: Pt };

/**
 * Anclas de la amiga en el MUNDO en un fotograma (cabeza, pecho, mano ofrecida y su punta, caderas, suelo y una caja
 * contenedora) para que el hilo empiece o termine junto a ella sin tocarla (dejar ≥ 20 px de aire). Función pura.
 */
export const friendAnchors = (frame: number, place: Place): FriendAnchors => {
  const s = place.scale ?? 1;
  const offerWrist: Pt | undefined = place.offerTarget ? [(place.offerTarget[0] - place.x) / s, (place.offerTarget[1] - place.y) / s] : undefined;
  const m = friendMotion(frame, { times: place.times, offerWrist });
  const a = anchorsFrom(m, resolvePose(m.pose, bodyDims("adult", "regular")));
  const w = (p: Pt): Pt => [place.x + p[0] * s, place.y + p[1] * s];
  return {
    head: w(a.head),
    headTop: w(a.headTop),
    chest: w(a.chest),
    hand: w(a.hand),
    handTip: w(a.handTip),
    hip: w(a.hip),
    ground: w(a.ground),
    bounds: { x0: place.x + a.bounds.x0 * s, y0: place.y + a.bounds.y0 * s, x1: place.x + a.bounds.x1 * s, y1: place.y + a.bounds.y1 * s },
  };
};

/** Anclas de la pose sostenida (sentada, mano ofrecida) en el MUNDO: la composición final de las escenas 5–6. */
export const friendHeldAnchors = (place: Place): FriendAnchors => friendAnchors(FRIEND_HELD_FROM + 12, place);
