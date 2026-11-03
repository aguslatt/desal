import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  // El repo tiene otro package.json en la raíz (DESAL): fijamos la raíz de esta app.
  outputFileTracingRoot: process.cwd(),
  // La sección se llamaba "planes": los links viejos siguen funcionando.
  async redirects() {
    return [
      { source: "/planes", destination: "/programas", permanent: true },
      { source: "/planes/:id", destination: "/programas/:id", permanent: true },
    ];
  },
};

export default config;
