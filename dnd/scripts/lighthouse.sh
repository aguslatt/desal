#!/bin/bash
# Mide Accesibilidad, Rendimiento, Buenas prácticas y SEO con Lighthouse sobre el build de producción.
# Uso:  npm run build && npm start   (en otra terminal)   y después   npm run lighthouse
# Variables: BASE (por defecto http://localhost:3000), CHROME_PATH (si Chrome no está en el PATH).
BASE=${BASE:-http://localhost:3000}
RUTAS=("/" "/necesidades" "/lugares" "/lugares?vista=mapa" "/lugares/cafe-nube-de-pan" "/lugares/cafe-nube-de-pan/reporte" "/lugares/cafe-nube-de-pan/recorrido" "/comercios" "/comercios/panel" "/relevamientos" "/accesibilidad")
SALIDA=$(mktemp -d)
for modo in mobile desktop; do
  extra="--preset=desktop"; [ "$modo" = mobile ] && extra=""
  for r in "${RUTAS[@]}"; do
    f="$SALIDA/$modo$(echo "$r" | tr '/?=' '___').json"
    npx --yes lighthouse "$BASE$r" $extra --only-categories=performance,accessibility,best-practices,seo \
      --chrome-flags="--headless=new --no-sandbox" --output=json --output-path="$f" --quiet >/dev/null 2>&1
    node -e "const j=require('$f'),c=j.categories,p=x=>Math.round(c[x].score*100);console.log('$modo'.padEnd(8),'$r'.padEnd(44),'Accesibilidad',p('accessibility'),'Rendimiento',p('performance'),'Buenas prácticas',p('best-practices'),'SEO',p('seo'))"
  done
done
