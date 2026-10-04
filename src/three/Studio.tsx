"use client";

import { Environment, Lightformer } from "@react-three/drei";

/**
 * Estudio de reflejos 100% procedural (sin HDRI externo → carga cero, offline).
 * Mismo estudio en hero, PDP y renders estáticos: así el metal es coherente en todo el sitio.
 * Fondo medio-cálido + softboxes + banderas negras = contraste de metal real.
 */
export function Studio({ intensity = 1 }: { intensity?: number }) {
  return (
    <Environment resolution={512} frames={1} environmentIntensity={intensity}>
      <color attach="background" args={["#b3a995"]} />
      {/* softbox cenital */}
      <Lightformer form="rect" intensity={7} position={[0, 6, 2]} rotation-x={Math.PI / 2} scale={[12, 4, 1]} />
      {/* tira lateral fría */}
      <Lightformer form="rect" intensity={5} position={[-6, 1, 2]} rotation-y={Math.PI / 2} scale={[1.5, 8, 1]} color="#e8f0ff" />
      {/* tira lateral cálida */}
      <Lightformer form="rect" intensity={6} position={[6, 0.5, 1]} rotation-y={-Math.PI / 2} scale={[2.5, 9, 1]} color="#fff0d6" />
      {/* rebote de sal desde abajo */}
      <Lightformer form="rect" intensity={2.4} position={[0, -5, 1]} rotation-x={-Math.PI / 2} scale={[14, 6, 1]} color="#f4efe4" />
      {/* banderas negras: dan profundidad al metal */}
      <Lightformer form="rect" intensity={0} position={[-3, 1.5, -4]} scale={[3, 6, 1]} color="#000" />
      <Lightformer form="rect" intensity={0.0} position={[3.5, -1, 5]} scale={[2, 5, 1]} color="#000" />
      {/* punto de brillo chico */}
      <Lightformer form="circle" intensity={14} position={[2.5, 3.5, 4]} scale={0.9} />
    </Environment>
  );
}
