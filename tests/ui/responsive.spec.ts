import { test, expect } from "@playwright/test";

// 진열 화면 조립 예시(?view=example)의 반응형 확인(설계서 §12-7, R32: 시안 고정 폭 상자는 대상 아님).
// 조립 예시 = S01 검색 조건 패널 + S02 모달 머리 띠를 부품으로 다시 짠 것(시안 복사본이 아님, R37).
const WIDTHS = [1024, 1280, 1440, 1920] as const;

// 조립 예시에 반드시 들어 있어야 하는 대표 부품 6개.
const REQUIRED_PARTS = ["Button", "Chip", "Field", "Panel", "ButtonBar", "AiTag"];

for (const width of WIDTHS) {
  test(`조립 예시 ${width}px: 넘침 · 겹침 · 부모 밖 삐져나감 없음`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/dev/parts?view=example");
    await expect(page.locator('section[aria-labelledby="s01-assembly-title"]')).toBeVisible();
    await expect(page.locator('section[aria-labelledby="s02-assembly-title"]')).toBeVisible();
    await expect(page.locator("[data-fixture-id]")).toHaveCount(0);

    const result = await page.evaluate(() => {
      const main = document.querySelector("main[data-parts-gallery]") as HTMLElement;
      const sections = Array.from(main.querySelectorAll<HTMLElement>("section[aria-labelledby]"));
      const parts = Array.from(main.querySelectorAll<HTMLElement>("[data-part]"));
      const overlaps: string[] = [];
      const overflows: string[] = [];
      const name = (el: Element) => el.getAttribute("data-part") ?? el.tagName;

      // ② 같은 부모를 둔 형제 [data-part] 끼리 사각형이 겹치지 않음
      const byParent = new Map<Element, HTMLElement[]>();
      for (const p of parts) {
        const parent = p.parentElement!;
        byParent.set(parent, [...(byParent.get(parent) ?? []), p]);
      }
      const siblingGroups = [...byParent.values()].filter((g) => g.length >= 2).length;
      for (const siblings of byParent.values()) {
        for (let i = 0; i < siblings.length; i++) {
          for (let j = i + 1; j < siblings.length; j++) {
            const a = siblings[i].getBoundingClientRect();
            const b = siblings[j].getBoundingClientRect();
            const eps = 0.5;
            const hit = a.left < b.right - eps && b.left < a.right - eps && a.top < b.bottom - eps && b.top < a.bottom - eps;
            if (hit) overlaps.push(`${name(siblings[i])} x ${name(siblings[j])}`);
          }
        }
      }
      // ③ 오른쪽 끝이 부모 오른쪽 끝을 넘지 않음(부모 overflow-x 가 auto·scroll 이면 예외)
      for (const p of parts) {
        const parent = p.parentElement!;
        const ox = getComputedStyle(parent).overflowX;
        if (ox === "auto" || ox === "scroll") continue;
        if (p.getBoundingClientRect().right > parent.getBoundingClientRect().right + 0.5) overflows.push(name(p));
      }
      return {
        partNames: [...new Set(parts.map((p) => name(p)))].sort(),
        siblingGroups,
        overlaps,
        overflows,
        sectionScroll: sections.every((s) => s.scrollWidth <= s.clientWidth),
        // main 은 overflow-auto 라 문서는 넘치지 않는다 — 실제 가로 스크롤은 main 안에서 생긴다.
        mainScroll: main.scrollWidth <= main.clientWidth,
        docScroll: document.documentElement.scrollWidth <= window.innerWidth,
      };
    });

    // 폭마다 한 장 — 기준 이미지가 아니라 사람이 볼 수 있게 남기는 결과물.
    await testInfo.attach(`조립 예시 ${width}px`, {
      body: await page.locator("main[data-parts-gallery]").screenshot(),
      contentType: "image/png",
    });

    for (const part of REQUIRED_PARTS) expect(result.partNames, part).toContain(part);
    expect(result.siblingGroups).toBeGreaterThanOrEqual(1); // ② 를 실제로 검사했다는 증거(형제 부품 묶음 1개 이상)
    expect(result.sectionScroll).toBe(true); // ① 조립 예시 자체
    expect(result.mainScroll).toBe(true); // ① 진열 화면 틀(main)
    expect(result.docScroll).toBe(true); // ① 문서
    expect(result.overlaps).toEqual([]); // ②
    expect(result.overflows).toEqual([]); // ③
  });
}

// 사건관리(S01) · 검색 결과(S05) 진열 화면: 긴 값 · 많은 행에서도 가로 넘침 0(Review Focus 3).
for (const path of ["/dev/s01?case=ready", "/dev/s05?case=ready"]) {
  for (const width of [1280, 1600] as const) {
    test(`${path.split("?")[0]} ${width}px: 문서 가로 넘침 없음`, async ({ page }) => {
      await page.route("**/auth/me", (route) => route.fulfill({ status: 401, contentType: "application/json", body: "{}" }));
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const over = await page.evaluate(() => ({
        doc: document.documentElement.scrollWidth - window.innerWidth,
        body: document.body.scrollWidth - window.innerWidth,
      }));
      expect(over.doc).toBeLessThanOrEqual(0);
      expect(over.body).toBeLessThanOrEqual(0);
    });
  }
}
