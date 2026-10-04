# Genera src/components/ui/Logo.tsx desde los glifos exactos del manual (.shots/svg/g.json, extraído con pdftocairo).
# DESAL va todo junto: se elimina el espacio entre DE y SAL.
import json
d=json.load(open('.shots/svg/g.json'))
g=d['glyphs']; uses=d['uses']
ox=331.4463
xs={gid:float(x) for gid,x,y in uses}
delta=xs['glyph-0-3']-xs['glyph-0-2']
word=[];stud=[]
for gid,x,y in uses:
    p=g[gid]
    if not p: continue
    x=float(x); y=float(y)
    if gid.startswith('glyph-0'):
        nx=x-ox-(delta if gid in('glyph-0-3','glyph-0-4','glyph-0-5') else 0)
        word.append((nx,124.0,p))
    else:
        stud.append((x-ox-14.6,124.0+(y-423.7725),p))
W=639.6
def paths(items,dx=0,dy=0):
    return "\n".join(f'    <path transform="translate({x-dx:.3f} {y-dy:.3f})" d="{p}" />' for x,y,p in items)
sdx=min(x for x,y,p in stud); sdy=124.0+101.195-60.3
code=f'''import type {{ SVGProps }} from "react";

/**
 * Logo DESAL studio — vectores EXACTOS extraídos del manual de identidad (Neue Haas Grotesk 95 Black + "studio" itálica).
 * DESAL va todo junto. Usa currentColor.
 */
export function Wordmark(props: SVGProps<SVGSVGElement>) {{
  return (
    <svg viewBox="8 0 {W} 126" fill="currentColor" role="img" aria-label="DESAL" {{...props}}>
{paths(word)}
    </svg>
  );
}}

/** "studio" (itálica ultra-light del logo) */
export function StudioMark(props: SVGProps<SVGSVGElement>) {{
  return (
    <svg viewBox="0 0 224.2 62" fill="currentColor" role="img" aria-label="studio" {{...props}}>
{paths(stud,sdx,sdy)}
    </svg>
  );
}}

/** Lockup: DESAL + studio centrado debajo (como en el manual). */
export function Logo(props: SVGProps<SVGSVGElement>) {{
  return (
    <svg viewBox="8 0 {W} 232" fill="currentColor" role="img" aria-label="DESAL studio" {{...props}}>
{paths(word)}
{paths(stud)}
    </svg>
  );
}}

/** Logo oficial completo (manual): marca dorada arriba, DESAL y "studio" debajo. */
export function BrandLockup({{ className = "", markClass = "" }}: {{ className?: string; markClass?: string }}) {{
  return (
    <div className={{`flex flex-col items-center ${{className}}`}} role="img" aria-label="DESAL studio">
      <img src="/brand/mark.png" alt="" width={{705}} height={{411}} className={{`mb-[7%] w-[26%] ${{markClass}}`}} draggable={{false}} />
      <Logo className="block h-auto w-full" />
    </div>
  );
}}
'''
open('src/components/ui/Logo.tsx','w').write(code)
print("ok", delta)
