#!/usr/bin/env bash
# Renderiza fotogramas PNG de una composición para revisarlos.
# Uso: [ENTRY=dev/<agente>/entry.tsx] scripts/shots.sh <ComposiciónId> <carpetaSalida> <frame,frame,...>
#   ENTRY (opcional): archivo de entrada Remotion alternativo para pruebas privadas (por defecto src/index.ts).
#   p. ej.  scripts/shots.sh Reel /tmp/shots 0,45,120,300
# Los números son fotogramas de ESA composición (en "Reel" son absolutos: 0–1049).
set -euo pipefail
cd "$(dirname "$0")/.."
ID="$1"; OUT="$2"; FRAMES="$3"
: "${REMOTION_BROWSER_EXECUTABLE:=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell}"
export REMOTION_BROWSER_EXECUTABLE
mkdir -p "$OUT"
npx remotion render "${ENTRY:-src/index.ts}" "$ID" "$OUT" --frames="$FRAMES" --image-format=png --log=error
