"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/** Volumen arquitectónico abstracto (propio): losa en voladizo, caja de vidrio y aletas de cobre. */
function House() {
  const group = useRef<THREE.Group>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const { gl, scene, invalidate } = useThree();

  // entorno de reflejos procedural (sin descargar nada)
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    scene.environmentIntensity = 0.9;
    return () => {
      scene.environment = null;
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);

  useEffect(() => {
    const m = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      pointer.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", m);
    return () => window.removeEventListener("pointermove", m);
  }, []);

  const fins = useMemo(() => Array.from({ length: 11 }, (_, i) => -1.32 + i * 0.264), []);

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    const ty = -0.55 + Math.sin(t * 0.35) * 0.22 + pointer.current.x * 0.55;
    const tx = 0.1 + pointer.current.y * 0.1;
    g.rotation.y += (ty - g.rotation.y) * 0.05;
    g.rotation.x += (tx - g.rotation.x) * 0.05;
    g.position.y = Math.sin(t * 0.8) * 0.05;
  });

  return (
    <group ref={group} scale={1.02}>
      {/* base */}
      <mesh position={[0, -0.78, 0]}>
        <boxGeometry args={[4.4, 0.1, 2.8]} />
        <meshStandardMaterial color="#1a1918" roughness={0.9} metalness={0} />
      </mesh>
      {/* volumen de vidrio, con luz interior */}
      <mesh position={[-0.1, -0.27, 0]}>
        <boxGeometry args={[3.1, 0.92, 1.9]} />
        <meshPhysicalMaterial color="#cfe0e6" transparent opacity={0.34} roughness={0.04} metalness={0} clearcoat={1} envMapIntensity={1.6} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh position={[-0.1, -0.5, 0]}>
        <boxGeometry args={[2.9, 0.4, 1.7]} />
        <meshStandardMaterial color="#c47a4a" emissive="#ff8a40" emissiveIntensity={0.85} roughness={1} />
      </mesh>
      <pointLight position={[-0.1, -0.2, 0]} intensity={4} color="#ffae70" distance={4} />
      {/* losa superior en voladizo */}
      <mesh position={[0.55, 0.38, 0]}>
        <boxGeometry args={[3.7, 0.28, 2.2]} />
        <meshStandardMaterial color="#2b2927" roughness={0.78} metalness={0.05} />
      </mesh>
      {/* volumen macizo */}
      <mesh position={[1.35, -0.27, -0.2]}>
        <boxGeometry args={[0.9, 0.92, 1.5]} />
        <meshStandardMaterial color="#3a3733" roughness={0.85} />
      </mesh>
      {/* aletas de cobre */}
      {fins.map((x, i) => (
        <mesh key={i} position={[x - 0.1, -0.27, 1.02]}>
          <boxGeometry args={[0.055, 0.98, 0.12]} />
          <meshStandardMaterial color="#d58a5e" roughness={0.28} metalness={0.95} />
        </mesh>
      ))}
      {/* losa inferior de acceso */}
      <mesh position={[-0.1, -0.74, 1.15]}>
        <boxGeometry args={[3.3, 0.06, 0.7]} />
        <meshStandardMaterial color="#8d8a85" roughness={0.6} />
      </mesh>
    </group>
  );
}

/** Aleja la cámara en pantallas angostas para que el volumen siempre entre completo. */
function FitCamera() {
  const { camera, size } = useThree();
  useEffect(() => {
    const aspect = size.width / Math.max(size.height, 1);
    camera.position.z = Math.max(9.6, 9.6 * (1.12 / aspect));
    camera.updateProjectionMatrix();
  }, [camera, size]);
  return null;
}

function PauseWhenHidden({ box }: { box: React.RefObject<HTMLDivElement | null> }) {
  const set = useThree((s) => s.set);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => set({ frameloop: e.isIntersecting ? "always" : "never" }));
    io.observe(el);
    return () => io.disconnect();
  }, [box, set]);
  return null;
}

export default function Scene3D() {
  const box = useRef<HTMLDivElement>(null);
  return (
    <div ref={box} className="scene3d" aria-hidden="true">
      <Canvas
        dpr={[1, 1.6]}
        camera={{ position: [0, 0.3, 9.6], fov: 30 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
        }}
      >
        <ambientLight intensity={0.25} />
        <directionalLight position={[3, 4, 3]} intensity={1.6} color="#ffd9b8" />
        <directionalLight position={[-4, 2, -2]} intensity={0.6} color="#9db6ff" />
        <House />
        <FitCamera />
        <PauseWhenHidden box={box} />
      </Canvas>
    </div>
  );
}
