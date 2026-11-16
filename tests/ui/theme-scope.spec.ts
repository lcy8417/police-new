import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

// 시안 r3 화면 설정(설계서 §14-1 · 3 · 4) 브라우저 검사:
//  ① 부품 진열(/dev/parts)과 기존 화면은 범위 밖 = :root(다크) 값 그대로(부품 픽셀 대조는 dark 로 돈다)
//  ② 진열 화면은 기본 scas-light · D2Coding, 팔레트 · 글꼴을 바꾸면 계산값이 바뀐다(글꼴 파일이 실제로 로딩됨)
//  ③ 「아주 크게」 + 1280 폭에서 가로 넘침 0(S01 · S05)
//  ④ 팔레트 4종 × S01 · S05 캡처 — 기본은 테스트 결과 폴더, SHOTS_DIR 를 주면 그 폴더(사용자 보고용)
const KEY = "scas-mock.display-prefs.v1";
const THEMES = ["scas-light", "light-contrast", "light-soft", "dark"] as const;

async function openWith(page: Page, url: string, prefs: Record<string, unknown>) {
  await page.addInitScript(
    ([k, v]) => {
      try {
        localStorage.setItem(k, v);
      } catch {
        // 저장소가 막혀도 화면은 기본값으로 열린다
      }
    },
    [KEY, JSON.stringify(prefs)] as const,
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(url);
  await expect(page.locator('[data-part="ThemeScope"]')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

test("부품 진열 /dev/parts 는 범위 밖 — :root 다크 값 그대로", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/dev/parts");
  await expect(page.locator("main[data-parts-gallery]")).toBeVisible();
  const r = await page.evaluate(() => ({
    scoped: document.querySelectorAll("[data-theme], [data-font], [data-scale]").length,
    canvas: getComputedStyle(document.querySelector("main[data-parts-gallery]")!).backgroundColor,
    font: getComputedStyle(document.querySelector("main[data-parts-gallery]")!).fontFamily,
  }));
  expect(r.scoped).toBe(0);
  expect(r.canvas).toBe("rgb(5, 8, 13)");
  expect(r.font).toBe('"IBM Plex Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif');
});

test("진열 화면 기본 = scas-light · D2Coding(내장 글꼴 로딩)", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/dev/s01");
  const shell = page.locator('[data-part="ScasShell"]');
  await expect(shell).toHaveAttribute("data-theme", "scas-light");
  await page.evaluate(() => document.fonts.ready);
  // r4 로망 앱 틀: 루트는 어두운 바깥 틀(--t-emblem-to). 11/17 남색 위 막대 한 줄 — 팔레트 바탕(canvas)은 막대 바로 아래 둥근 내용 판
  const r = await shell.evaluate((el) => ({
    bg: getComputedStyle(el.querySelector("header")!.nextElementSibling!).backgroundColor,
    fg: getComputedStyle(el).color,
    font: getComputedStyle(el).fontFamily,
    loaded: document.fonts.check('12px "Scas D2Coding"', "감정"),
  }));
  expect(r.bg).toBe("rgb(238, 240, 244)");
  expect(r.fg).toBe("rgb(31, 36, 48)");
  expect(r.font.startsWith('"Scas D2Coding"')).toBe(true);
  expect(r.loaded).toBe(true);
});

test("data-font 를 바꾸면 계산된 글꼴이 바뀌고, 숫자 자리(font-code)는 고정폭 D2Coding", async ({ page }) => {
  const fonts: Record<string, string> = {
    d2coding: "Scas D2Coding",
    pretendard: "Scas Pretendard",
    "nanum-gothic": "Scas NanumGothic",
    "nanum-barun": "Scas NanumBarunGothic",
    "ibm-plex": "Scas IBM Plex Sans KR",
    "noto-sans": "Scas Noto Sans KR",
  };
  await openWith(page, "/dev/s01", { theme: "scas-light", font: "d2coding", scale: "md", reducedMotion: true });
  const scope = page.locator('[data-part="ThemeScope"]');
  for (const [font, family] of Object.entries(fonts)) {
    await scope.evaluate((el, f) => el.setAttribute("data-font", f), font);
    const r = await scope.evaluate(async (el, fam) => {
      await document.fonts.load(`400 14px "${fam}"`, "감정번호");
      await document.fonts.load(`700 14px "${fam}"`, "감정번호");
      const code = el.querySelector(".font-code")!;
      return {
        ui: getComputedStyle(el).fontFamily,
        code: getComputedStyle(code).fontFamily,
        regular: document.fonts.check(`400 14px "${fam}"`, "감정번호"),
        bold: document.fonts.check(`700 14px "${fam}"`, "감정번호"),
      };
    }, family);
    expect(r.ui.startsWith(`"${family}"`), font).toBe(true);
    expect(r.code.startsWith('"Scas D2Coding"'), font).toBe(true);
    expect(r.regular && r.bold, `${font} 글꼴 파일 로딩`).toBe(true);
  }
});

test("팔레트별 바탕 · 글자 계산값(dark = r3 시안 값)", async ({ page }) => {
  const expected: Record<(typeof THEMES)[number], { bg: string; fg: string }> = {
    "scas-light": { bg: "rgb(238, 240, 244)", fg: "rgb(31, 36, 48)" },
    "light-contrast": { bg: "rgb(255, 255, 255)", fg: "rgb(11, 13, 18)" },
    "light-soft": { bg: "rgb(230, 232, 236)", fg: "rgb(38, 43, 52)" },
    dark: { bg: "rgb(5, 8, 13)", fg: "rgb(229, 233, 240)" },
  };
  await openWith(page, "/dev/s05", { theme: "scas-light", font: "d2coding", scale: "md", reducedMotion: true });
  const shell = page.locator('[data-part="ScasShell"]');
  for (const theme of THEMES) {
    await page.locator('[data-part="ThemeScope"]').evaluate((el, t) => el.setAttribute("data-theme", t), theme);
    await shell.evaluate((el, t) => el.setAttribute("data-theme", t), theme);
    // r4: 팔레트 바탕은 둥근 내용 판(11/17 — 남색 위 막대 바로 아래) — 루트는 어두운 바깥 틀
    const r = await shell.evaluate((el) => ({
      bg: getComputedStyle(el.querySelector("header")!.nextElementSibling!).backgroundColor,
      fg: getComputedStyle(el).color,
    }));
    expect(r, theme).toEqual(expected[theme]);
  }
});

test("scas-light 안에 겹친 dark 영역은 다크 값(팔레트 미리보기 「어둡게」 포함)", async ({ page }) => {
  await openWith(page, "/dev/s01", { theme: "scas-light", font: "d2coding", scale: "md", reducedMotion: true });
  const nested = await page.locator('[data-part="ScasShell"]').evaluate((shell) => {
    const probe = document.createElement("span");
    probe.setAttribute("data-theme", "dark");
    probe.className = "bg-canvas text-foreground";
    shell.appendChild(probe);
    const cs = getComputedStyle(probe);
    const r = { tBg: cs.getPropertyValue("--t-bg").trim(), bg: cs.backgroundColor, fg: cs.color };
    probe.remove();
    return r;
  });
  expect(nested).toEqual({ tBg: "#05080d", bg: "rgb(5, 8, 13)", fg: "rgb(229, 233, 240)" });

  await page.getByRole("button", { name: "화면 설정" }).click();
  const swatches = page.getByRole("region", { name: "화면 설정" }).locator('[data-theme] > span:first-child');
  const colors = await swatches.evaluateAll((els) => els.map((el) => getComputedStyle(el).backgroundColor));
  // 순서: SCAS 밝게 · 또렷하게 · 부드럽게 · 어둡게 — 첫 칸은 각 팔레트의 바탕(canvas)
  expect(colors).toEqual(["rgb(238, 240, 244)", "rgb(255, 255, 255)", "rgb(230, 232, 236)", "rgb(5, 8, 13)"]);
});

test("범위 안 대화상자(DialogShell modal)는 범위의 팔레트 · 글꼴로 뜬다", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  // S13 사용자 관리 「사용자 추가」 → DialogShell(modal) 「사용자 추가」
  await openWith(page, "/dev/s13?as=admin", { theme: "scas-light", font: "pretendard", scale: "md", reducedMotion: true });
  await page.getByRole("button", { name: "사용자 추가" }).click();
  const dialog = page.getByRole("dialog", { name: "사용자 추가" });
  await expect(dialog).toBeVisible();
  const r = await dialog.evaluate((el) => ({
    inPortal: !!el.closest('[data-part="ThemeScope"] [data-theme-portal]'),
    bg: getComputedStyle(el).backgroundColor,
    font: getComputedStyle(el).fontFamily,
  }));
  expect(r.inPortal).toBe(true);
  expect(r.bg).toBe("rgb(255, 255, 255)");
  expect(r.font.startsWith('"Scas Pretendard"')).toBe(true);
});

for (const screen of ["s01", "s05"] as const) {
  test(`「아주 크게」 + 1280 폭 ${screen}: 가로 넘침 0`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await openWith(page, `/dev/${screen}`, { theme: "scas-light", font: "d2coding", scale: "xl", reducedMotion: true });
    const r = await page.evaluate(() => {
      const scope = document.querySelector<HTMLElement>('[data-part="ThemeScope"]')!;
      const root = document.getElementById("root")!;
      return {
        scope: scope.scrollWidth - scope.clientWidth,
        root: root.scrollWidth - root.clientWidth,
        doc: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });
    expect(r).toEqual({ scope: 0, root: 0, doc: 0 });
  });
}

test("팔레트 4종 × S01 · S05 캡처", async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  const dir = process.env.SHOTS_DIR ? path.resolve(process.env.SHOTS_DIR) : testInfo.outputPath("palettes");
  fs.mkdirSync(dir, { recursive: true });
  for (const theme of THEMES) {
    for (const screen of ["s01", "s05"]) {
      const ctxPage = await page.context().newPage();
      await ctxPage.setViewportSize({ width: 1440, height: 900 });
      await openWith(ctxPage, `/dev/${screen}`, { theme, font: "d2coding", scale: "md", reducedMotion: true });
      await expect(ctxPage.locator('[data-part="ScasShell"]')).toHaveAttribute("data-theme", theme);
      const file = path.join(dir, `${screen}-${theme}.png`);
      await ctxPage.screenshot({ path: file });
      expect(fs.statSync(file).size).toBeGreaterThan(10_000);
      await ctxPage.close();
    }
  }
});
