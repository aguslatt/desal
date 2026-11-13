import os from "node:os";
import path from "node:path";
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  timeout: 60_000,
  fullyParallel: true,
  reporter: [["list"]],
  // Las pruebas del panel crean y borran cafés: corren solas, después de todas las demás.
  projects: [
    { name: "general", testIgnore: /panel\.spec/ },
    { name: "panel", testMatch: /panel\.spec/, dependencies: ["general"] },
  ],
  use: {
    baseURL: "http://localhost:3100",
    launchOptions: process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {},
  },
  webServer: {
    command: "npx next start -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: !!process.env.PW_REUSE,
    env: {
      METRICAS_PASSWORD: "clave-de-prueba",
      DATA_DIR: path.join(os.tmpdir(), "umbral-e2e"),
      ADMIN_EMAIL: "admin@umbral.test",
      ADMIN_PASSWORD: "clave-admin-e2e-123",
      SESSION_SECRET: "secreto-de-pruebas-e2e-0123456789abcdef",
    },
    timeout: 60_000,
  },
});
