import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config.js";

// Reuse the app's Vite config (react plugin + `@` alias) and layer test settings on top.
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: ["./src/test/setup.ts"],
      include: ["src/**/*.{test,spec}.{ts,tsx}"],
    },
  })
);
