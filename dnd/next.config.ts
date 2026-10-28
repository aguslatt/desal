import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  // El repo tiene otro package.json en la raíz (DESAL): fijamos la raíz de esta app.
  outputFileTracingRoot: process.cwd(),
};

export default config;
