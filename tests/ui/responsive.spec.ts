import { test, expect } from "@playwright/test";

// 진열 화면 「S01 조립 예시」(?view=example) 의 반응형 확인(R32: 시안 고정 폭 상자는 대상 아님).
const WIDTHS = [1024, 1280, 1440, 1920] as const;

for (const width of WIDTHS) {
  test(`조립 예시 ${width}px: 넘침 · 겹침 · 부모 밖 삐져나감 없음`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/dev/parts?view=example");
    const section = page.locator('section[aria-labelledby="s01-assembly-title"]');
    await expect(section).toBeVisible();
    await expect(page.locator("[data-fixture-id]")).toHaveCount(0);

    const result = await page.evaluate(() => {
      const root = document.querySelector('section[aria-labelledby="s01-assembly-title"]') as HTMLElement;
      const parts = Array.from(root.querySelectorAll<HTMLElement>("[data-part]"));
      const overlaps: string[] = [];
      const overflows: string[] = [];
      const name = (el: Element) => el.getAttribute("data-part") ?? el.tagName;

      // ② 같은 부모를 둔 형제 [data-part] 끼리 사각형이 겹치지 않음
      const byParent = new Map<Element, HTMLElement[]>();
      for (const p of parts) {
        const parent = p.parentElement!;
        byParent.set(parent, [...(byParent.get(parent) ?? []), p]);
      }
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
        partCount: parts.length,
        overlaps,
        overflows,
        sectionScroll: root.scrollWidth <= root.clientWidth,
        docScroll: document.documentElement.scrollWidth <= window.innerWidth,
      };
    });

    expect(result.partCount).toBeGreaterThan(0);
    expect(result.sectionScroll).toBe(true); // ① 조립 예시 자체
    expect(result.docScroll).toBe(true); // ① 문서
    expect(result.overlaps).toEqual([]); // ②
    expect(result.overflows).toEqual([]); // ③
  });
}
