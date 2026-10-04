"use client";

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { Color, DoubleSide, Mesh, MeshBasicMaterial, PMREMGenerator, PlaneGeometry } from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/**
 * Estudio fotográfico procedural (sin HDRI externo → carga cero, offline).
 * Parte de RoomEnvironment (softboxes reales sobre una sala neutra) y le suma rebotes de color de marca,
 * así el oro refleja el rojo DE SAL como lo haría sobre un fondo rojo real.
 * Mismo estudio en hero, PDP y renders estáticos: el metal es coherente en todo el sitio.
 */
export function Studio({ intensity = 1, bounce = "#9b2219" }: { intensity?: number; bounce?: string }) {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pm = new PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const mk = (w: number, h: number, c: string, k: number, pos: [number, number, number], ry: number, rx = 0) => {
      const m = new MeshBasicMaterial({ color: new Color(c).multiplyScalar(k), side: DoubleSide, toneMapped: false });
      const p = new Mesh(new PlaneGeometry(w, h), m);
      p.position.set(...pos); p.rotation.set(rx, ry, 0);
      room.add(p);
    };
    mk(4, 5, bounce, 0.55, [-2.9, 0.2, 0.5], Math.PI / 2); // rebote rojo izquierdo
    mk(3, 3, "#e4dfc1", 1.2, [3.1, 0.6, 0.2], -Math.PI / 2); // hueso derecho (cálido)
    mk(5, 3, bounce, 0.35, [0, -2.4, 0], 0, Math.PI / 2); // piso rojizo
    const rt = pm.fromScene(room, 0.025);
    scene.environment = rt.texture;
    scene.environmentIntensity = intensity;
    return () => { scene.environment = null; rt.dispose(); pm.dispose(); room.traverse((o) => { if ((o as Mesh).isMesh) { (o as Mesh).geometry.dispose(); } }); };
  }, [gl, scene, intensity, bounce]);
  return null;
}
