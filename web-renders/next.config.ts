import path from "node:path";
import type { NextConfig } from "next";

const config: NextConfig = {
  turbopack: { root: path.resolve(__dirname) },
  reactStrictMode: true,
  devIndicators: false,
  images: { formats: ["image/avif", "image/webp"], qualities: [60, 75, 82] },
};

export default config;
