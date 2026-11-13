import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

// 토큰 2층 도입 전후로 화면 색이 하나도 바뀌지 않았음을 증명하는 회귀 테스트.
const BASELINE = path.resolve("tests/ui/__baseline__/dark-vars.json");

// src/index.css 의 .dark 블록에서 변수 이름을 모은다.
function darkVarNames(): string[] {
  const css = fs.readFileSync(path.resolve("src/index.css"), "utf8");
  const block = css.match(/\.dark\s*\{([\s\S]*?)\n\}/);
  if (!block) throw new Error(".dark 블록을 찾지 못함");
  return [...block[1].matchAll(/^\s*(--[\w-]+)\s*:/gm)].map((m) => m[1]);
}

// 백엔드가 없으므로 세션 조회를 401로 고정해 화면을 결정적으로 만든다.
async function openLogin(page: import("@playwright/test").Page) {
  await page.route("**/auth/me", (route) =>
    route.fulfill({ status: 401, contentType: "application/json", body: "{}" })
  );
  await page.goto("/login");
  await page.waitForLoadState("networkidle");
}

test("shadcn 변수 계산값 불변", async ({ page }) => {
  await openLogin(page);
  const names = darkVarNames();
  const values = await page.evaluate((list) => {
    const style = getComputedStyle(document.documentElement);
    return Object.fromEntries(list.map((n) => [n, style.getPropertyValue(n).trim()]));
  }, names);

  if (process.env.UPDATE_BASELINE === "1" || !fs.existsSync(BASELINE)) {
    fs.mkdirSync(path.dirname(BASELINE), { recursive: true });
    fs.writeFileSync(BASELINE, JSON.stringify(values, null, 2) + "\n");
    return;
  }
  expect(values).toEqual(JSON.parse(fs.readFileSync(BASELINE, "utf8")));
});

// 이 브랜치 이전(d6987ae)의 계산값 = Tailwind 4 기본 글꼴 목록(node_modules/tailwindcss/theme.css 의
// --font-mono · --font-sans 를 브라우저가 정리한 모양). 부품 글꼴을 들이면서 기존 화면의 font-mono(44개 파일)
// · 기본 글꼴이 바뀌지 않았음을 지킨다(최종 검토 C1 · 판정 R33). 부품은 font-code · font-ui 를 쓴다.
const BASELINE_MONO =
  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
const BASELINE_SANS =
  'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"';

test("기존 글꼴 역할(font-mono · font-sans · 기본 글꼴) 계산값 불변", async ({ page }) => {
  await openLogin(page);
  const fonts = await page.evaluate(() => {
    const probe = (className: string) => {
      const el = document.createElement("span");
      el.className = className;
      el.textContent = "00001-25-";
      document.body.appendChild(el);
      const value = getComputedStyle(el).fontFamily;
      el.remove();
      return value;
    };
    const code = document.createElement("code");
    document.body.appendChild(code);
    const codeFont = getComputedStyle(code).fontFamily;
    code.remove();
    return {
      mono: probe("font-mono"),
      sans: probe("font-sans"),
      body: getComputedStyle(document.body).fontFamily,
      code: codeFont,
    };
  });
  expect(fonts).toEqual({ mono: BASELINE_MONO, sans: BASELINE_SANS, body: BASELINE_SANS, code: BASELINE_MONO });
});

test("로그인 화면 스크린샷 불변", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openLogin(page);
  await expect(page).toHaveScreenshot("login-1440.png");
});
