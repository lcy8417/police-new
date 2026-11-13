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

test("로그인 화면 스크린샷 불변", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openLogin(page);
  await expect(page).toHaveScreenshot("login-1440.png");
});
