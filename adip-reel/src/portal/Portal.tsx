import React from 'react';
import {AbsoluteFill, Easing, Freeze, Img, OffthreadVideo, staticFile, useCurrentFrame} from 'remotion';
import {Ribbons} from '../Ribbons';
import {clamp, easeIO, easeIn, easeOut, lerp, prog} from '../ui';
import {FONT, K, PaletteBar, Rise, Trazo} from '../charla/kit';
import {CAPTIONS, CUT_TOTAL, FPS, HOOK_CAPTION, HOOK_END, T, TOTAL} from './data';
import {CURSOR, Cam, SHOTS, STEPS, Shot, WIN, WIN_CLOSED, WINDOWS} from './plan';

const easeBack = Easing.bezier(0.3, 1.4, 0.5, 1);
const CREAM = '#FFF6EC';
const INK = '#16111D';
const fontCss = [300, 400, 500, 600, 700, 800, 900]
  .map((w) => `@font-face{font-family:'Montserrat';font-weight:${w};font-style:normal;src:url('${staticFile(`fonts/montserrat-latin-${w}-normal.woff2`)}') format('woff2');}`)
  .join('\n');

// ------------------------------------------------------------------ key-frame helpers
const kfNum = (t: number, keys: [number, number][], ease: (x: number, i?: number) => number = easeIO) => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const [t0, v0] = keys[i - 1];
      const [t1, v1] = keys[i];
      if (t1 <= t0) return v1;
      return lerp(v0, v1, ease(clamp((t - t0) / (t1 - t0), 0, 1), i));
    }
  }
  return keys[keys.length - 1][1];
};
type Rect = {x: number; y: number; w: number; h: number};
const kfObj = <O extends Record<string, number>>(t: number, keys: [number, O][], ease: (x: number, i?: number) => number = easeIO): O => {
  const out: any = {};
  for (const k of Object.keys(keys[0][1])) out[k] = kfNum(t, keys.map(([tt, o]) => [tt, o[k]] as [number, number]), ease);
  return out;
};

// ------------------------------------------------------------------ stage timings (output seconds)
const W1o = T(WINDOWS[0][0]);
const W1c = T(WINDOWS[0][1]);
const W2o = T(WINDOWS[1][0]);
const W2c = T(WINDOWS[1][1]);
const OPEN = 0.75;
const CLOSE = 0.55;
const CTA0 = W2c + 0.5;

type V = {x: number; y: number; w: number; h: number; rt: number; rb: number; z: number; fx: number; fy: number};
const FULL = (z: number, fx: number, fy: number): V => ({x: 0, y: 0, w: 1080, h: 1920, rt: 0, rb: 0, z, fx, fy});
const PIP = (fx: number, fy: number, z = 2.35): V => ({x: 826, y: 190, w: 204, h: 232, rt: 102, rb: 26, z, fx, fy});
const CARD = (z: number, fx: number, fy: number): V => ({x: 40, y: 262, w: 1000, h: 610, rt: 44, rb: 44, z, fx, fy});
const ARCH = (z: number, fx: number, fy: number): V => ({x: 330, y: 380, w: 420, h: 460, rt: 210, rb: 36, z, fx, fy});

const SNAP = 0.12;
// hold -> quick punch (jump-cut feel) between consecutive framings
const seq = (items: [number, V][]): [number, V][] => {
  const out: [number, V][] = [[items[0][0], items[0][1]]];
  for (let i = 1; i < items.length; i++) {
    out.push([items[i][0], items[i - 1][1]]);
    out.push([items[i][0] + SNAP, items[i][1]]);
  }
  return out;
};
const VKEYS: [number, V][] = [
  [0, FULL(1.28, 0.47, 0.42)],
  [HOOK_END - 0.02, FULL(1.4, 0.47, 0.42)],
  ...seq([
    [HOOK_END, FULL(1.0, 0.45, 0.46)],
    [T(1.98), FULL(1.17, 0.45, 0.41)],
    [T(4.12), FULL(1.0, 0.45, 0.46)],
    [T(5.86), FULL(1.22, 0.46, 0.41)],
    [T(9.15), FULL(1.0, 0.5, 0.5)],
    [T(10.3), FULL(1.16, 0.5, 0.43)],
    [T(15.55), FULL(1.0, 0.5, 0.5)],
    [T(17.98), FULL(1.18, 0.5, 0.43)],
    [T(20.4), FULL(1.0, 0.52, 0.5)],
    [T(22.4), FULL(1.14, 0.58, 0.45)],
  ]),
  [W1o, FULL(1.14, 0.58, 0.45)],
  [W1o + OPEN, PIP(0.6, 0.345)],
  [W1c, PIP(0.6, 0.345)],
  [W1c + CLOSE + 0.05, CARD(1.0, 0.58, 0.42)],
  [T(48.2), CARD(1.12, 0.58, 0.42)],
  [T(48.63) + 0.45, FULL(1.1, 0.58, 0.45)],
  [T(50.0), FULL(1.1, 0.58, 0.45)],
  [T(50.0) + SNAP, FULL(1.24, 0.58, 0.42)],
  [W2o, FULL(1.24, 0.58, 0.42)],
  [W2o + OPEN, PIP(0.6, 0.345)],
  [T(68.3), PIP(0.6, 0.345)],
  [T(68.65), PIP(0.22, 0.42, 2.1)],
  [W2c, PIP(0.22, 0.42, 2.1)],
  [W2c + 0.7, ARCH(1.22, 0.5, 0.52)],
];

const WKEYS: [number, Rect & {o: number}][] = [
  [W1o, {...WIN_CLOSED, o: 0}],
  [W1o + 0.12, {...WIN_CLOSED, o: 1}],
  [W1o + OPEN, {x: WIN.x, y: WIN.y, w: WIN.w, h: WIN.h, o: 1}],
  [W1c, {x: WIN.x, y: WIN.y, w: WIN.w, h: WIN.h, o: 1}],
  [W1c + CLOSE - 0.1, {...WIN_CLOSED, o: 1}],
  [W1c + CLOSE, {...WIN_CLOSED, o: 0}],
  [W2o, {...WIN_CLOSED, o: 0}],
  [W2o + 0.12, {...WIN_CLOSED, o: 1}],
  [W2o + OPEN, {x: WIN.x, y: WIN.y, w: WIN.w, h: WIN.h, o: 1}],
  [W2c, {x: WIN.x, y: WIN.y, w: WIN.w, h: WIN.h, o: 1}],
  [W2c + CLOSE - 0.1, {...WIN_CLOSED, o: 1}],
  [W2c + CLOSE, {...WIN_CLOSED, o: 0}],
];

// ------------------------------------------------------------------ camera over the page screenshots
const IMG_W = 1080;
const camAt = (shot: Shot, t: number, w = WIN.w, h = WIN.h - WIN.chrome) => {
  const keys = shot.cam;
  const tt = Math.min(t, shot.t1 + 1);
  const fy = kfNum(tt, keys.map((c) => [T(c.t), c.y] as [number, number]));
  const z = kfNum(tt, keys.map((c) => [T(c.t), c.z ?? 1] as [number, number]));
  const cx0 = kfNum(tt, keys.map((c) => [T(c.t), c.cx ?? 540] as [number, number]));
  const scale = (w / IMG_W) * z;
  const visW = w / scale;
  const visH = h / scale;
  const cx = clamp(cx0, visW / 2, IMG_W - visW / 2);
  const y = clamp(fy - 0.42 * visH, 0, Math.max(0, shot.h - visH));
  return {scale, left: cx - visW / 2, y, visW, visH};
};
const shotAt = (t: number): Shot | undefined => {
  let found: Shot | undefined;
  for (const s of SHOTS) if (t >= T(s.t0) - 1e-6 && t < T(s.t1) + 1e-6) found = s;
  return found;
};
const toScr = (shot: Shot, t: number, p: [number, number]): [number, number] => {
  const c = camAt(shot, t);
  return [(p[0] - c.left) * c.scale, (p[1] - c.y) * c.scale];
};

// cursor keys resolved once into viewport coordinates (0..1000 x 0..856)
const CUR = CURSOR.map((k) => {
  const t = T(k.t);
  let p: [number, number];
  if (k.scr) p = k.scr;
  else {
    const s = shotAt(t - 0.001) ?? shotAt(t);
    p = s && k.img ? toScr(s, t, k.img) : [500, 400];
  }
  return {t, p, click: !!k.click};
});
const cursorAt = (t: number) => {
  if (t <= CUR[0].t) return {p: CUR[0].p, ci: 0};
  for (let i = 1; i < CUR.length; i++) {
    if (t <= CUR[i].t) {
      const a = CUR[i - 1];
      const b = CUR[i];
      // pages change between windows: do not fly across the gap
      if (b.t - a.t > 6) return {p: t > b.t - 0.5 ? b.p : a.p, ci: i};
      const dist = Math.hypot(b.p[0] - a.p[0], b.p[1] - a.p[1]);
      const d = Math.min(b.t - a.t, 0.42 + dist / 1900);
      const k = clamp((t - (b.t - d)) / d, 0, 1);
      const e = easeIO(k);
      const nx = -(b.p[1] - a.p[1]);
      const ny = b.p[0] - a.p[0];
      const n = Math.hypot(nx, ny) || 1;
      const arc = Math.sin(Math.PI * k) * Math.min(60, dist * 0.12);
      return {p: [lerp(a.p[0], b.p[0], e) + (nx / n) * arc, lerp(a.p[1], b.p[1], e) + (ny / n) * arc] as [number, number], ci: i};
    }
  }
  return {p: CUR[CUR.length - 1].p, ci: CUR.length - 1};
};

// ------------------------------------------------------------------ small pieces
const Cursor: React.FC<{x: number; y: number; press: number}> = ({x, y, press}) => (
  <svg width={64} height={72} viewBox="0 0 40 46" style={{position: 'absolute', left: x - 6, top: y - 4, transform: `scale(${1 - 0.13 * press})`, transformOrigin: '6px 4px', filter: 'drop-shadow(0 4px 8px rgba(22,17,29,0.28))'}}>
    <path d="M4 2 L4 36 L12.5 28.5 L18.5 42 L25.5 39 L19.5 26 L31 26 Z" fill="#fff" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
  </svg>
);

const Pill: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <div style={{display: 'inline-flex', alignItems: 'center', fontFamily: FONT, ...style}}>{children}</div>
);

const Logo: React.FC<{t: number; show: [number, number][]}> = ({t, show}) => {
  const a = Math.max(...show.map(([s, e]) => Math.min(prog(t, s, 0.35, easeOut), 1 - prog(t, e, 0.3, easeIn))), 0);
  if (a <= 0.01) return null;
  return (
    <div style={{position: 'absolute', left: 390, top: 236, width: 300, height: 108, borderRadius: 30, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: a, transform: `translateY(${(1 - a) * -18}px)`}}>
      <Img src={staticFile('brand/logo-color.png')} style={{width: 220, height: 'auto'}} />
    </div>
  );
};

// *word* markup -> violet highlighted spans
const rich = (s: string, hi = K.violet) =>
  s.split('*').map((part, i) => (i % 2 ? <span key={i} style={{color: hi}}>{part}</span> : <React.Fragment key={i}>{part}</React.Fragment>));

const Caption: React.FC<{t: number}> = ({t}) => {
  let text: string | null = null;
  let t0 = 0;
  let t1 = 0;
  if (t < HOOK_END - 0.9) {
    text = HOOK_CAPTION;
    t0 = 0.05;
    t1 = 1.55;
  } else {
    for (const [a, b, s] of CAPTIONS) {
      const s0 = T(a) - 0.04;
      const s1 = T(b) + 0.12;
      if (t >= s0 && t < s1) {
        text = s;
        t0 = s0;
        t1 = s1;
      }
    }
  }
  if (!text) return null;
  const inP = prog(t, t0, 0.18, easeOut);
  const outP = 1 - prog(t, t1 - 0.1, 0.1, (x) => x);
  const op = Math.min(inP, outP);
  return (
    <div style={{position: 'absolute', left: 70, right: 70, bottom: 1920 - 1535, display: 'flex', justifyContent: 'center', opacity: op, transform: `translateY(${(1 - inP) * 20}px)`}}>
      <div style={{fontFamily: FONT, fontSize: 45, lineHeight: 1.16, fontWeight: 700, letterSpacing: '-0.01em', textAlign: 'center', color: INK, background: 'rgba(255,255,255,0.97)', borderRadius: 34, padding: '16px 34px 18px', maxWidth: 940}}>
        {rich(text)}
      </div>
    </div>
  );
};

const NameTag: React.FC<{t: number; t0: number; t1: number; name: string; role: string; color: string; left: number; top: number}> = ({t, t0, t1, name, role, color, left, top}) => {
  const p = prog(t, t0, 0.5, easeOut);
  const q = prog(t, t1, 0.3, easeIn);
  if (p <= 0 || q >= 1) return null;
  return (
    <div style={{position: 'absolute', left, top, opacity: 1 - q, transform: `translateX(${(1 - p) * -60}px)`, display: 'flex', alignItems: 'center', gap: 16, background: '#fff', borderRadius: 40, padding: '14px 32px 14px 16px', fontFamily: FONT}}>
      <div style={{width: 54, height: 54, borderRadius: 27, background: color}} />
      <div>
        <div style={{fontSize: 38, fontWeight: 900, letterSpacing: '0.06em', color: INK, lineHeight: 1}}>{name}</div>
        <div style={{fontSize: 27, fontWeight: 600, color: '#5b5266', marginTop: 4}}>{role}</div>
      </div>
    </div>
  );
};

/** keyword block: colour block + text, rises in, leaves up */
const Word: React.FC<{t: number; t0: number; t1: number; text: string; bg: string; fg?: string; top: number; left?: number; size?: number}> = ({t, t0, t1, text, bg, fg = INK, top, left = 80, size = 100}) => {
  const p = prog(t, t0, 0.5, easeOut);
  const q = prog(t, t1, 0.35, easeIn);
  if (p <= 0 || q >= 1) return null;
  return (
    <div style={{position: 'absolute', left, top, clipPath: `inset(-10px ${(1 - p) * 100}% -10px ${q * 100}%)`}}>
      <div style={{background: bg, color: fg, fontFamily: FONT, fontSize: size, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1, padding: '16px 36px 22px', borderRadius: 26, whiteSpace: 'nowrap'}}>{text}</div>
    </div>
  );
};

// ------------------------------------------------------------------ backdrop (cream + brand shapes)
const Backdrop: React.FC<{t: number}> = ({t}) => {
  const drift = Math.sin(t * 0.6) * 14;
  return (
    <AbsoluteFill style={{background: CREAM}}>
      <div style={{position: 'absolute', left: -330, top: 170 + drift, width: 620, height: 620, borderRadius: 310, background: K.orange}} />
      <div style={{position: 'absolute', left: 640, top: 1180 - drift, width: 640, height: 640, borderRadius: 320, background: K.violet}} />
      <div style={{position: 'absolute', left: 780, top: 80, width: 150, height: 150, borderRadius: 75, background: K.pink, opacity: 0.0}} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ portal window
const Page: React.FC<{shot: Shot; t: number; w: number; h: number}> = ({shot, t, w, h}) => {
  const c = camAt(shot, t, w, h);
  const fade = shot.fade ?? 0.2;
  const tr = shot.tr ?? 'fade';
  const p = fade <= 0 ? 1 : prog(t, T(shot.t0), fade, tr === 'fade' ? (x) => x : easeOut);
  const wrap: React.CSSProperties = {position: 'absolute', inset: 0};
  if (tr === 'fade') wrap.opacity = p;
  if (tr === 'slide') wrap.transform = `translateX(${(1 - p) * w}px)`;
  if (tr === 'reveal') wrap.clipPath = `inset(0 0 ${(1 - p) * 100}% 0)`;
  return (
    <div style={wrap}>
      <Img src={staticFile(`portal/${shot.img}.jpg`)} style={{position: 'absolute', left: -c.left * c.scale, top: -c.y * c.scale, width: IMG_W * c.scale, height: shot.h * c.scale}} />
    </div>
  );
};

/** click-driven transition: an orange disc grows from the clicked point, the next screen opens from the same point */
const Burst: React.FC<{t: number}> = ({t}) => {
  const R = 1700;
  for (const s of SHOTS) {
    if (s.tr !== 'burst') continue;
    const t0 = T(s.t0);
    if (t < t0 - 0.2 || t > t0 + 0.42) continue;
    const [x, y] = cursorAt(t0).p;
    if (t < t0) {
      const g = prog(t, t0 - 0.2, 0.2, easeIn) * R;
      return <div style={{position: 'absolute', inset: 0, background: `radial-gradient(circle at ${x}px ${y}px, ${K.orange} ${g}px, transparent ${g + 1}px)`}} />;
    }
    const hole = prog(t, t0, 0.42, easeOut) * R;
    return <div style={{position: 'absolute', inset: 0, background: `radial-gradient(circle at ${x}px ${y}px, transparent ${hole}px, ${K.orange} ${hole + 1}px)`}} />;
  }
  return null;
};

const Highlights: React.FC<{shot: Shot; t: number; w: number; h: number}> = ({shot, t, w, h}) => {
  const c = camAt(shot, t, w, h);
  return (
    <>
      {shot.hl.map((hl, i) => {
        const a = T(hl.t0);
        const b = T(hl.t1);
        const p = prog(t, a, 0.28, easeOut);
        const q = prog(t, b - 0.2, 0.2, easeIn);
        if (p <= 0 || q >= 1 || t > b) return null;
        const pad = 12;
        const x = (hl.r[0] - c.left) * c.scale - pad;
        const y = (hl.r[1] - c.y) * c.scale - pad;
        const rw = hl.r[2] * c.scale + pad * 2;
        const rh = hl.r[3] * c.scale + pad * 2;
        const grow = lerp(1.05, 1, p);
        const op = p * (1 - q);
        const labelTop = y > 80 ? y - 62 : y + rh + 14;
        return (
          <React.Fragment key={i}>
            <div style={{position: 'absolute', left: x, top: y, width: rw, height: rh, borderRadius: 22, boxShadow: `0 0 0 3000px rgba(38,12,52,${0.20 * op})`, transform: `scale(${grow})`, opacity: 1}} />
            <div style={{position: 'absolute', left: x, top: y, width: rw, height: rh, borderRadius: 22, border: `7px solid ${K.orange}`, opacity: op, transform: `scale(${grow})`, boxSizing: 'border-box'}} />
            {hl.label && (
              <div style={{position: 'absolute', left: clamp(x, 8, w - 340), top: labelTop, opacity: op, transform: `translateY(${(1 - p) * 12}px)`, background: K.orange, color: INK, fontFamily: FONT, fontSize: 31, fontWeight: 800, padding: '9px 24px 11px', borderRadius: 24, whiteSpace: 'nowrap'}}>
                {hl.label}
              </div>
            )}
          </React.Fragment>
        );
      })}
    </>
  );
};

const BrowserWindow: React.FC<{t: number; rect: Rect & {o: number}}> = ({t, rect}) => {
  if (rect.o <= 0.01) return null;
  const chrome = WIN.chrome;
  const h = rect.h - chrome;
  const active = SHOTS.filter((s) => t >= T(s.t0) - 1e-6 && t < T(s.t1) + 0.45);
  const cur = shotAt(t) ?? active[active.length - 1];
  const url = cur ? cur.url : 'equipoadip.com.ar';
  const cursor = cursorAt(t);
  // press animation for clicks
  let press = 0;
  let ripple: {x: number; y: number; k: number} | null = null;
  for (let i = 0; i < CUR.length; i++) {
    if (!CUR[i].click) continue;
    const dt = t - CUR[i].t;
    if (dt > -0.05 && dt < 0.14) press = Math.max(press, 1 - Math.abs(dt - 0.04) / 0.1);
    if (dt >= 0 && dt < 0.55) ripple = {x: CUR[i].p[0], y: CUR[i].p[1], k: dt / 0.55};
  }
  const open = rect.w > WIN.w * 0.97;
  return (
    <div style={{position: 'absolute', left: rect.x, top: rect.y, width: rect.w, height: rect.h, opacity: rect.o, borderRadius: 36, overflow: 'hidden', background: '#fff', boxShadow: '0 40px 90px rgba(80,10,110,0.28)'}}>
      <div style={{height: chrome * (rect.w / WIN.w), background: '#F3EAF8', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 14, fontFamily: FONT, overflow: 'hidden'}}>
        <div style={{display: 'flex', gap: 10}}>
          {[K.orange, K.yellow, K.green].map((c) => (
            <div key={c} style={{width: 18, height: 18, borderRadius: 9, background: c}} />
          ))}
        </div>
        <div style={{flex: 1, height: 52, borderRadius: 26, background: '#fff', display: 'flex', alignItems: 'center', padding: '0 22px', gap: 12, fontSize: 27, fontWeight: 600, color: '#3a3044', whiteSpace: 'nowrap', overflow: 'hidden'}}>
          <svg width="22" height="26" viewBox="0 0 22 26"><rect x="2" y="11" width="18" height="13" rx="3" fill={K.violet} /><path d="M6 11V8a5 5 0 0 1 10 0v3" fill="none" stroke={K.violet} strokeWidth="3" /></svg>
          {url}
        </div>
      </div>
      <div style={{position: 'absolute', left: 0, top: chrome * (rect.w / WIN.w), width: rect.w, height: rect.h - chrome * (rect.w / WIN.w), overflow: 'hidden', background: '#fff'}}>
        {active.map((s) => (
          <Page key={s.id} shot={s} t={t} w={WIN.w} h={h} />
        ))}
        {open && cur && <Highlights shot={cur} t={t} w={WIN.w} h={h} />}
        {open && <Burst t={t} />}
        {open && ripple && (
          <div style={{position: 'absolute', left: ripple.x - 46, top: ripple.y - 46, width: 92, height: 92, borderRadius: 46, border: `6px solid ${K.orange}`, opacity: 1 - ripple.k, transform: `scale(${0.35 + ripple.k * 1.0})`}} />
        )}
        {open && <Cursor x={cursor.p[0]} y={cursor.p[1]} press={press} />}
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ step chip + progress
const Steps: React.FC<{t: number}> = ({t}) => {
  const inWin = (t >= W1o + 0.5 && t < W1c + 0.1) || (t >= W2o + 0.5 && t < W2c + 0.1);
  if (!inWin) return null;
  const o0 = t >= W2o ? W2o + 0.5 : W1o + 0.5;
  const c0 = t >= W2o ? W2c : W1c;
  const vis = Math.min(prog(t, o0, 0.2, (x) => x), 1 - prog(t, c0 - 0.1, 0.3, easeIn));
  let cur = STEPS[0];
  for (const s of STEPS) if (t >= T(s.t0) - 0.02) cur = s;
  const st = T(cur.t0);
  const pop = prog(t, st, 0.32, easeBack);
  const dock = prog(t, st + 0.5, 0.5, easeIO);
  const chipW = 170 + cur.label.length * 23;
  const dx = (1 - dock) * (540 - 40 - chipW * 0.75);
  const dy = (1 - dock) * (800 - 262);
  const sc = lerp(1.5, 1, dock) * lerp(0.6, 1, pop);
  const dim = (1 - dock) * 0.42 * Math.min(1, pop) * vis;
  return (
    <div>
      <div style={{position: 'absolute', inset: 0, background: `rgba(38,12,52,${dim})`}} />
      <div style={{opacity: vis * Math.min(1, pop * 2)}}>
        <div style={{position: 'absolute', left: 40, top: 262, display: 'flex', alignItems: 'center', gap: 16, background: '#fff', borderRadius: 44, padding: '10px 36px 10px 10px', fontFamily: FONT, transform: `translate(${dx}px, ${dy}px) scale(${sc})`, transformOrigin: 'left top', boxShadow: dock < 1 ? '0 24px 60px rgba(60,10,90,0.35)' : 'none'}}>
          <div style={{width: 68, height: 68, borderRadius: 34, background: K.orange, color: INK, fontSize: 40, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{cur.n}</div>
          <div style={{fontSize: 41, fontWeight: 800, color: INK, letterSpacing: '-0.01em', whiteSpace: 'nowrap'}}>{cur.label}</div>
        </div>
      </div>
      <div style={{opacity: vis * dock}}>
        <div style={{position: 'absolute', left: 40, top: 334, width: 740, display: 'flex', gap: 8}}>
          {STEPS.map((s) => {
            const done = cur.n > s.n ? 1 : cur.n === s.n ? prog(t, T(s.t0), Math.max(0.5, T(s.t1) - T(s.t0)), (x) => x) : 0;
            return (
              <div key={s.n} style={{flex: 1, height: 12, borderRadius: 6, background: 'rgba(138,0,183,0.2)', overflow: 'hidden'}}>
                <div style={{width: `${done * 100}%`, height: '100%', background: K.violet, borderRadius: 6}} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ hook (0 – HOOK_END)
const Hook: React.FC<{t: number}> = ({t}) => {
  if (t > HOOK_END + 0.1) return null;
  const rows: [string, string, string, number][] = [
    ['¿Querés formar', '#fff', INK, 0.12],
    ['parte de', '#fff', INK, 0.3],
    ['Equipo ADIP?', K.orange, INK, 0.5],
  ];
  const peekP = prog(t, 0.45, 0.6, easeOut);
  const peekQ = prog(t, HOOK_END - 0.3, 0.3, easeIn);
  const py = lerp(1640, 1205, peekP);
  const pageY = lerp(1000, 3500, prog(t, 0.45, 2.1, easeIO));
  const shotImg = 'prof';
  return (
    <>
      {rows.map(([txt, bg, fg, t0], i) => (
        <div key={i} style={{position: 'absolute', left: 70 + i * 22, top: 392 + i * 140, clipPath: `inset(0 ${(1 - prog(t, t0, 0.45, easeOut)) * 100}% 0 0)`}}>
          <div style={{background: bg, color: fg, fontFamily: FONT, fontSize: 104, fontWeight: i === 2 ? 900 : 800, letterSpacing: '-0.03em', lineHeight: 1, padding: '14px 34px 20px', borderRadius: 26, whiteSpace: 'nowrap'}}>
            {i === 0 ? (<><span style={{fontWeight: 300}}>¿Querés </span>formar</>) : txt}
          </div>
        </div>
      ))}
      <div style={{position: 'absolute', left: 150, top: py, width: 780, height: 230, borderRadius: 30, overflow: 'hidden', background: '#fff', boxShadow: '0 30px 70px rgba(80,10,110,0.3)', opacity: 1 - peekQ, transform: `translateY(${peekQ * 120}px)`}}>
        <div style={{height: 56, background: '#F3EAF8', display: 'flex', alignItems: 'center', padding: '0 20px', gap: 10, fontFamily: FONT, fontSize: 22, fontWeight: 600, color: '#3a3044'}}>
          <div style={{display: 'flex', gap: 8}}>{[K.orange, K.yellow, K.green].map((c) => <div key={c} style={{width: 14, height: 14, borderRadius: 7, background: c}} />)}</div>
          <div style={{flex: 1, height: 36, borderRadius: 18, background: '#fff', display: 'flex', alignItems: 'center', padding: '0 16px'}}>equipoadip.com.ar/profesionales</div>
        </div>
        <div style={{position: 'absolute', left: 0, top: 56, width: 780, height: 174, overflow: 'hidden'}}>
          <Img src={staticFile(`portal/${shotImg}.jpg`)} style={{position: 'absolute', left: 0, top: -pageY * (780 / 1080), width: 780, height: 10702 * (780 / 1080)}} />
        </div>
      </div>
    </>
  );
};

// circle wipe that hides the hook → intro cut
const HookWipe: React.FC<{t: number}> = ({t}) => {
  const a = HOOK_END - 0.42;
  if (t < a || t > a + 0.9) return null;
  const grow = prog(t, a, 0.3, easeIn);
  const hole = prog(t, a + 0.34, 0.5, easeOut);
  const cx = 540;
  const cy = 1500;
  if (t < a + 0.34) {
    return <AbsoluteFill style={{background: `radial-gradient(circle at ${cx}px ${cy}px, ${K.orange} ${grow * 2500}px, transparent ${grow * 2500 + 1}px)`}} />;
  }
  return <AbsoluteFill style={{background: `radial-gradient(circle at 540px 900px, transparent ${hole * 2300}px, ${K.orange} ${hole * 2300 + 1}px)`}} />;
};

// ------------------------------------------------------------------ RRHH layout (cards under the speaker)
const RRHH: React.FC<{t: number}> = ({t}) => {
  const a = W1c + 0.1;
  const b = T(48.2) + 0.1;
  if (t < a || t > b + 0.5) return null;
  const q = prog(t, b - 0.1, 0.4, easeIn);
  const cards: [number, string, string, string, string][] = [
    [T(40.88), '1', 'Reclutamiento interno', 'Lo hacemos desde Recursos Humanos', K.orange],
    [T(43.4), '2', 'Entrevistas', 'Con el equipo, a medida que se necesitan', K.violet],
    [T(44.62), '3', 'Según tu localidad y terapia', 'Para encontrar el lugar que te queda mejor', K.pink],
  ];
  const tagP = prog(t, a + 0.2, 0.5, easeOut);
  return (
    <div style={{opacity: 1 - q}}>
      <div style={{position: 'absolute', left: 60, top: 190, opacity: tagP, transform: `translateY(${(1 - tagP) * -20}px)`}}>
        <Pill style={{background: K.violet, color: '#fff', fontSize: 31, fontWeight: 800, letterSpacing: '0.16em', padding: '12px 30px', borderRadius: 30}}>RECURSOS HUMANOS</Pill>
      </div>
      {cards.map(([ct, n, title, sub, col], i) => {
        const p = prog(t, ct, 0.6, easeBack);
        if (p <= 0) return null;
        return (
          <div key={i} style={{position: 'absolute', left: 40, top: 912 + i * 150, width: 1000, height: 134, borderRadius: 32, background: '#fff', display: 'flex', alignItems: 'center', gap: 26, padding: '0 30px', fontFamily: FONT, opacity: Math.min(1, p * 1.5), transform: `translateX(${(1 - p) * 160}px)`}}>
            <div style={{width: 84, height: 84, borderRadius: 42, background: col, color: col === K.orange ? INK : '#fff', fontSize: 46, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>{n}</div>
            <div>
              <div style={{fontSize: 44, fontWeight: 800, color: INK, letterSpacing: '-0.01em', lineHeight: 1.05}}>{title}</div>
              <div style={{fontSize: 29, fontWeight: 500, color: '#5b5266', marginTop: 6}}>{sub}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ------------------------------------------------------------------ closing call to action
const Cta: React.FC<{t: number}> = ({t}) => {
  if (t < CTA0 - 0.05) return null;
  const p = (d: number, dur = 0.6) => prog(t, CTA0 + d, dur, easeOut);
  return (
    <div style={{fontFamily: FONT}}>
      <Trazo t={t} t0={CTA0 + 0.55} left={390} top={985} w={300} color={K.orange} dur={0.8} id="cta" />
      <div style={{position: 'absolute', left: 0, right: 0, top: 858, textAlign: 'center', opacity: p(0.15), transform: `translateY(${(1 - p(0.15)) * 40}px)`}}>
        <div style={{fontSize: 84, lineHeight: 1.0, color: INK, letterSpacing: '-0.035em'}}>
          <span style={{fontWeight: 300}}>Sumate a</span>
          <br />
          <span style={{fontWeight: 900, color: K.violet}}>Equipo ADIP</span>
        </div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1108, display: 'flex', justifyContent: 'center', opacity: p(0.4), transform: `translateY(${(1 - p(0.4)) * 30}px)`}}>
        <Pill style={{background: K.violet, color: '#fff', fontSize: 37, fontWeight: 700, padding: '15px 38px 17px', borderRadius: 40}}>equipoadip.com.ar/profesionales</Pill>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1205, display: 'flex', justifyContent: 'center', opacity: p(0.6), transform: `translateY(${(1 - p(0.6)) * 30}px) scale(${lerp(0.92, 1, p(0.6))})`}}>
        <Pill style={{background: INK, color: '#fff', fontSize: 40, fontWeight: 800, padding: '20px 48px 22px', borderRadius: 50, gap: 18}}>
          Entrá al portal de empleo
          <svg width="38" height="38" viewBox="0 0 40 40"><path d="M8 20h24M22 9l11 11-11 11" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Pill>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ video layer
const VideoLayer: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const v = kfObj(t, VKEYS.map(([tt, o]) => [tt, o as unknown as Record<string, number>]) as [number, Record<string, number>][]) as unknown as V;
  const s = Math.max(v.w / 1080, v.h / 1920) * v.z;
  const tx = clamp(v.w / 2 - v.fx * 1080 * s, v.w - 1080 * s, 0);
  const ty = clamp(v.h / 2 - v.fy * 1920 * s, v.h - 1920 * s, 0);
  const last = Math.round(CUT_TOTAL * FPS) - 1;
  const vid = (
    <OffthreadVideo src={staticFile('portal/edit.mp4')} muted style={{position: 'absolute', left: tx, top: ty, width: 1080 * s, height: 1920 * s, filter: 'saturate(1.05) contrast(1.03) brightness(1.015)'}} />
  );
  return (
    <div style={{position: 'absolute', left: v.x, top: v.y, width: v.w, height: v.h, overflow: 'hidden', borderRadius: `${v.rt}px ${v.rt}px ${v.rb}px ${v.rb}px`, boxShadow: v.w < 400 ? '0 0 0 8px #fff, 0 16px 40px rgba(60,10,90,0.28)' : 'none'}}>
      {frame > last ? <Freeze frame={last}>{vid}</Freeze> : vid}
    </div>
  );
};

// ------------------------------------------------------------------ composition
export const Portal: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const wRect = kfObj(t, WKEYS.map(([tt, o]) => [tt, o as unknown as Record<string, number>]) as [number, Record<string, number>][], (x, i) => (i === 2 || i === 8 ? easeBack(x) : easeIO(x))) as unknown as Rect & {o: number};
  const v = kfObj(t, VKEYS.map(([tt, o]) => [tt, o as unknown as Record<string, number>]) as [number, Record<string, number>][]) as unknown as V;
  const fullVideo = v.w > 1060;
  const showBackdrop = !fullVideo;
  const endFade = prog(t, TOTAL - 0.35, 0.35, (x) => x);

  return (
    <AbsoluteFill style={{background: CREAM, fontFamily: FONT}}>
      <style>{fontCss}</style>
      {showBackdrop && <Backdrop t={t} />}
      {showBackdrop && <PaletteBar t={t} t0={0} left={0} top={0} width={1080} height={14} />}
      <VideoLayer t={t} frame={frame} />
      <BrowserWindow t={t} rect={wRect} />
      <Steps t={t} />
      <RRHH t={t} />
      <Cta t={t} />
      <Hook t={t} />

      {/* kinetic keywords */}
      <Word t={t} t0={T(3.38)} t1={T(5.0)} text="Recursos Humanos" bg={K.violet} fg="#fff" top={400} size={80} />
      <Word t={t} t0={T(5.86)} t1={T(6.5)} text="Portal de empleo" bg={K.orange} top={400} size={92} />
      <Word t={t} t0={T(16.35)} t1={T(19.95)} text="¿Cómo se suman" bg="#fff" top={1010} size={80} />
      <Word t={t} t0={T(17.15)} t1={T(19.95)} text="los profesionales?" bg={K.violet} fg="#fff" top={1135} left={110} size={80} />
      <Word t={t} t0={T(22.7)} t1={T(24.1)} text="Profesionales" bg={K.violet} fg="#fff" top={400} size={96} />
      <Ribbons t0={W1c - 0.1} mode="pass" dur={1.0} />
      <Ribbons t0={T(48.2) - 0.1} mode="pass" dur={1.0} dir="rl" />
      <Ribbons t0={W2c - 0.1} mode="pass" dur={1.0} />

      {/* labels */}
      <NameTag t={t} t0={T(1.1)} t1={T(5.2)} name="ANDY" role="Recursos Humanos" color={K.orange} left={70} top={1262} />
      <NameTag t={t} t0={T(9.7)} t1={T(12.4)} name="MIKA" role="Recursos Humanos" color={K.violet} left={70} top={1262} />
      <NameTag t={t} t0={T(20.55)} t1={T(23.2)} name="MIKA" role="Recursos Humanos · Reclutadora" color={K.violet} left={70} top={1262} />

      <Logo t={t} show={[[0.0, 2.2], [HOOK_END + 0.3, W1o - 0.1], [W2c + 0.5, TOTAL]]} />
      <Caption t={t} />
      <HookWipe t={t} />
      {endFade > 0 && <AbsoluteFill style={{background: CREAM, opacity: endFade}} />}
    </AbsoluteFill>
  );
};
