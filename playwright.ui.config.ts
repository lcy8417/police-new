import { defineConfig, devices } from "@playwright/test";

// UI 검사 전용 개발 서버 포트(개발용 5173 과 다름).
const UI_PORT = 5180;

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
    baseURL: `http://localhost:${UI_PORT}`,
    reducedMotion: "reduce",
    trace: "on-first-retry",
  },
  webServer: {
    // 개발자가 띄워 둔 `npm run dev`(5173)와 겹치지 않게 UI 검사 전용 포트로 띄운다(M6).
    // --strictPort: 포트가 차 있으면 다른 포트로 비켜 가지 않고 바로 실패한다(엉뚱한 서버를 검사하지 않게).
    command: `npx vite --port ${UI_PORT} --strictPort`,
    url: `http://localhost:${UI_PORT}`,
    // 다른 워크트리의 낡은 dev 서버가 엉뚱한 코드를 내놓지 않도록 항상 새로 띄운다.
    reuseExistingServer: false,
    timeout: 60_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
