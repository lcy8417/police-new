import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config.js";

// Reuse the app's Vite config (react plugin + `@` alias) and layer test settings on top.
// vite.config.js는 `.env`를 읽으려고 함수형(mode 인자)이라, 같은 인자로 불러 합친다.
export default defineConfig((configEnv) =>
  mergeConfig(
    viteConfig(configEnv),
    defineConfig({
      test: {
        environment: "jsdom",
        globals: true,
        setupFiles: ["./src/test/setup.ts"],
        include: ["src/**/*.{test,spec}.{ts,tsx}"],
      },
    })
  )
);
