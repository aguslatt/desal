import type { SVGProps } from "react";

/** Íconos de línea, siempre acompañados de texto. Decorativos: aria-hidden. */
const paths: Record<string, React.ReactNode> = {
  confirmado: (<><circle cx="12" cy="12" r="9" /><path d="m8 12.5 2.8 2.8L16.5 9.5" /></>),
  no_disponible: (<><rect x="3.5" y="3.5" width="17" height="17" rx="3" /><path d="m9 9 6 6M15 9l-6 6" /></>),
  sin_info: (<><circle cx="12" cy="12" r="9" strokeDasharray="3 3" /><path d="M9.7 9.6a2.4 2.4 0 1 1 3.4 2.2c-.7.4-1.1.9-1.1 1.7M12 16.6v.1" /></>),
  alerta: (<><path d="M12 3.5 21.5 20h-19z" /><path d="M12 10v4.5M12 17.4v.1" /></>),
  mapa: (<><path d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6z" /><path d="M9 4v14M15 6v14" /></>),
  lista: (<><path d="M8 6h12M8 12h12M8 18h12" /><path d="M4 6v.1M4 12v.1M4 18v.1" /></>),
  ajustes: (<><path d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" /></>),
  flecha: (<path d="M5 12h14m-5-5 5 5-5 5" />),
  cerrar: (<path d="m6 6 12 12M18 6 6 18" />),
  chevron: (<path d="m6 9 6 6 6-6" />),
  guardar: (<path d="M7 4h10a1 1 0 0 1 1 1v15l-6-4-6 4V5a1 1 0 0 1 1-1z" />),
  foto: (<><rect x="3.5" y="5.5" width="17" height="13" rx="2" /><circle cx="9" cy="11" r="1.8" /><path d="m4 18 5-4.5 3.5 3 3-2.5 4.5 4" /></>),
  comentario: (<path d="M4 5h16v11H9l-5 4z" />),
  bandera: (<path d="M6 21V4m0 0h11l-2 4 2 4H6" />),
  reloj: (<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>),
  ojo: (<><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="2.8" /></>),
  casa: (<path d="M4 11 12 4l8 7v9H4z" />),
};

export type IconName = keyof typeof paths;

export function Icon({ name, size = 1.25, ...rest }: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={`${size}em`}
      height={`${size}em`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      style={{ flexShrink: 0 }}
      {...rest}
    >
      {paths[name]}
    </svg>
  );
}
