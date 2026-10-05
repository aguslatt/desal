import React from "react";

/**
 * Cámara del mundo ilustrado. Unidades de MUNDO: 1 px de mundo = 1 px de pantalla cuando scale = 1
 * (el encuadre de la escena 1: persona + celular). Pantalla = (mundo − (cx, cy)) · scale + (540, 960).
 * Las ilustraciones se dibujan en coordenadas de mundo y escalan con la cámara (el trazo fino de las personas
 * se afina al alejarse, como en la referencia); las curvas naranjas compensan para mantener un grosor casi
 * constante en pantalla (usar `screenWidth(px, camera)`).
 */
export type CameraState = { readonly scale: number; readonly cx: number; readonly cy: number };

export const CameraContext = React.createContext<CameraState>({ scale: 1, cx: 540, cy: 960 });
export const useCamera = (): CameraState => React.useContext(CameraContext);

/** Grosor en unidades de mundo que se verá como `px` píxeles de pantalla con la cámara actual. */
export const screenWidth = (px: number, camera: CameraState): number => px / camera.scale;
