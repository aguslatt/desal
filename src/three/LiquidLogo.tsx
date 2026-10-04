"use client";

import { useEffect, useRef } from "react";
import {
  CanvasTexture, HalfFloatType, LinearFilter, Mesh, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial,
  Vector2, Vector3, WebGLRenderTarget, WebGLRenderer, ClampToEdgeWrapping, RGBAFormat,
} from "three";

const VERT = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`;

// simulación de ondas (altura + velocidad), con gotas del cursor
const SIM = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform sampler2D tPrev; uniform vec2 px; uniform vec3 drop; uniform float aspect; uniform float rad;
void main(){
  vec4 c = texture2D(tPrev, vUv);
  float h = c.r, v = c.g;
  float avg = (texture2D(tPrev, vUv + vec2(px.x,0.)).r + texture2D(tPrev, vUv - vec2(px.x,0.)).r
             + texture2D(tPrev, vUv + vec2(0.,px.y)).r + texture2D(tPrev, vUv - vec2(0.,px.y)).r) * .25;
  v += (avg - h) * 1.9;
  v *= 0.988;
  h += v;
  vec2 d = (vUv - drop.xy) * vec2(aspect, 1.);
  h += drop.z * smoothstep(rad, 0., length(d));
  gl_FragColor = vec4(h, v, 0., 1.);
}`;

// superficie líquida: refracta el logo y suma brillo especular de la altura
const SHOW = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform sampler2D tBase; uniform sampler2D tSim; uniform vec2 px;
void main(){
  float hx = texture2D(tSim, vUv + vec2(px.x,0.)).r - texture2D(tSim, vUv - vec2(px.x,0.)).r;
  float hy = texture2D(tSim, vUv + vec2(0.,px.y)).r - texture2D(tSim, vUv - vec2(0.,px.y)).r;
  vec2 n = vec2(hx, hy);
  vec4 col = texture2D(tBase, vUv + n * 0.38);
  vec3 N = normalize(vec3(-n * 7., 1.));
  float spec = pow(max(0., dot(N, normalize(vec3(.35, .55, .75)))), 55.) * 0.8;
  float rim = pow(max(0., dot(N, normalize(vec3(-.5, -.2, .7)))), 30.) * .35;
  col.rgb += spec * vec3(1., .93, .82) + rim * vec3(.9, .5, .4);
  col.rgb *= 1. - clamp(length(n) * 2.4, 0., .35);
  gl_FragColor = vec4(col.rgb, 1.);
}`;

type Props = {
  /** elemento <svg> del logo (DOM) cuyos paths se dibujan como textura base */
  logoEl: React.RefObject<SVGSVGElement | null>;
  active: boolean;
  onReady: () => void;
  /** pinta el fondo de la textura (mismo del CSS) */
  paintBg: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
  color?: string;
};

/**
 * Agua líquida sobre el logo: el cursor deja ondas que refractan el wordmark real y brillan.
 * Es la idea de la marca (sal / mar / metal fundido) hecha interacción.
 */
export default function LiquidLogo({ logoEl, active, onReady, paintBg, color = "#e4dfc1" }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    const host = wrap.current!;
    const canvas = document.createElement("canvas");
    canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block";
    host.appendChild(canvas);
    let renderer: WebGLRenderer;
    try { renderer = new WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "high-performance" }); } catch { return; }
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const scene = new Scene();
    const cam = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const quad = new Mesh(new PlaneGeometry(2, 2));
    scene.add(quad);

    let W = 0, H = 0, simW = 0, simH = 0;
    let rtA: WebGLRenderTarget, rtB: WebGLRenderTarget;
    let baseTex: CanvasTexture | null = null;
    const simMat = new ShaderMaterial({ vertexShader: VERT, fragmentShader: SIM, uniforms: { tPrev: { value: null }, px: { value: new Vector2() }, drop: { value: new Vector3(-1, -1, 0) }, aspect: { value: 1 }, rad: { value: 0.045 } } });
    const showMat = new ShaderMaterial({ vertexShader: VERT, fragmentShader: SHOW, uniforms: { tBase: { value: null }, tSim: { value: null }, px: { value: new Vector2() } } });

    const makeRT = (w: number, h: number) => new WebGLRenderTarget(w, h, { type: HalfFloatType, format: RGBAFormat, minFilter: LinearFilter, magFilter: LinearFilter, wrapS: ClampToEdgeWrapping, wrapT: ClampToEdgeWrapping, depthBuffer: false });

    const paintBase = () => {
      const c = document.createElement("canvas");
      c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
      const ctx = c.getContext("2d")!;
      ctx.scale(dpr, dpr);
      paintBg(ctx, W, H);
      const svg = logoEl.current;
      if (svg) {
        const hr = host.getBoundingClientRect(), r = svg.getBoundingClientRect();
        const vb = svg.viewBox.baseVal;
        const s = r.width / vb.width;
        ctx.fillStyle = color;
        svg.querySelectorAll("path").forEach((p) => {
          const m = /translate\(([-\d.]+) ([-\d.]+)\)/.exec(p.getAttribute("transform") ?? "");
          ctx.save();
          ctx.translate(r.left - hr.left - vb.x * s + (m ? parseFloat(m[1]) * s : 0), r.top - hr.top - vb.y * s + (m ? parseFloat(m[2]) * s : 0));
          ctx.scale(s, s);
          ctx.fill(new Path2D(p.getAttribute("d") ?? ""));
          ctx.restore();
        });
      }
      baseTex?.dispose();
      baseTex = new CanvasTexture(c);
      baseTex.minFilter = LinearFilter; baseTex.generateMipmaps = false;
      showMat.uniforms.tBase.value = baseTex;
    };

    const resize = () => {
      W = host.clientWidth; H = host.clientHeight;
      if (!W || !H) return;
      renderer.setPixelRatio(dpr);
      renderer.setSize(W, H, false);
      simW = 320; simH = Math.round(320 * H / W);
      rtA?.dispose(); rtB?.dispose();
      rtA = makeRT(simW, simH); rtB = makeRT(simW, simH);
      simMat.uniforms.px.value.set(1 / simW, 1 / simH);
      showMat.uniforms.px.value.set(1 / simW, 1 / simH);
      simMat.uniforms.aspect.value = W / H;
      paintBase();
    };
    resize();
    onReady();
    const ro = new ResizeObserver(() => resize());
    ro.observe(host);

    // entrada de gotas
    let dropX = -1, dropY = -1, dropS = 0, lastX = 0, lastY = 0, lastT = 0, rad = 0.045;
    const rel = (e: PointerEvent) => { const r = host.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height] as const; };
    const move = (e: PointerEvent) => {
      const [x, y] = rel(e);
      if (x < 0 || x > 1 || y < 0 || y > 1) return;
      const now = performance.now();
      const sp = Math.hypot(e.clientX - lastX, e.clientY - lastY) / Math.max(8, now - lastT);
      lastX = e.clientX; lastY = e.clientY; lastT = now;
      dropX = x; dropY = y; dropS = Math.min(0.5, 0.06 + sp * 0.35); rad = 0.03 + Math.min(0.03, sp * 0.02);
    };
    const click = (e: PointerEvent) => { const [x, y] = rel(e); dropX = x; dropY = y; dropS = 1.4; rad = 0.09; };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", click);

    let raf = 0, tAmb = 0;
    const tick = (t: number) => {
      raf = requestAnimationFrame(tick);
      if (!activeRef.current || !W) return;
      // gotas ambientales: el agua nunca está muerta
      if (t - tAmb > 2600) { tAmb = t; dropX = 0.15 + Math.random() * 0.7; dropY = 0.45 + Math.random() * 0.4; dropS = 0.45; rad = 0.05; }
      simMat.uniforms.drop.value.set(dropX, dropY, dropS);
      simMat.uniforms.rad.value = rad;
      simMat.uniforms.tPrev.value = rtA.texture;
      quad.material = simMat;
      renderer.setRenderTarget(rtB);
      renderer.render(scene, cam);
      [rtA, rtB] = [rtB, rtA];
      dropS = 0;
      showMat.uniforms.tSim.value = rtA.texture;
      quad.material = showMat;
      renderer.setRenderTarget(null);
      renderer.render(scene, cam);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf); ro.disconnect();
      window.removeEventListener("pointermove", move); window.removeEventListener("pointerdown", click);
      rtA?.dispose(); rtB?.dispose(); baseTex?.dispose(); simMat.dispose(); showMat.dispose(); renderer.dispose();
      canvas.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={wrap} className="absolute inset-0" aria-hidden />;
}
