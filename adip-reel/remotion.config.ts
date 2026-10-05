import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("png");
Config.setOverwriteOutput(true);
Config.setPixelFormat("yuv420p");
Config.setCodec("h264");
// Etiqueta BT.709 (celulares/redes): evita corrimientos de color en los colores de marca.
Config.setColorSpace("bt709");
Config.setCrf(16);

// Si no se puede descargar el Chrome de Remotion (red restringida), apuntar a un Chromium local:
//   export REMOTION_BROWSER_EXECUTABLE=/ruta/a/chrome   (p. ej. /opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell)
if (process.env.REMOTION_BROWSER_EXECUTABLE) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER_EXECUTABLE);
}
