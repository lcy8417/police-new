import { defineConfig, devices } from "@playwright/test";

// UI 회귀(토큰 계산값 · 스크린샷) 전용 설정. e2e 설정과 분리한다.
export default defineConfig({
  testDir: "./tests/ui",
  timeout: 30_000,
  fullyParallel: true,
  reporter: "list",
  // 기준 이미지 경로를 명시적으로 고정한다(플랫폼 접미사 없음).
  snapshotPathTemplate: "{testDir}/__snapshots__/{testFilePath}/{arg}{ext}",
  expect: {
    toHaveScreenshot: { maxDiffPixels: 0 },
  },
  use: {
    baseURL: "http://localhost:5173",
    reducedMotion: "reduce",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    // 다른 워크트리의 낡은 dev 서버가 엉뚱한 코드를 내놓지 않도록 항상 새로 띄운다.
    reuseExistingServer: false,
    timeout: 60_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
