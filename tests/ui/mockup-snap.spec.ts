import { test, expect } from "@playwright/test";
import { MOCKUP_SCREENS, openMockup } from "./mockup-open";

// 시안에 부품 표식(data-part*)을 붙여도 생김새가 하나도 바뀌지 않았음을 증명한다.
// core.js 가 모든 화면에 영향을 주므로 16개 화면 전부 찍는다.
for (const screen of MOCKUP_SCREENS) {
  test(`${screen} 생김새 불변`, async ({ page }) => {
    const frame = await openMockup(page, screen);
    await expect(frame).toHaveScreenshot(`${screen}.png`);
  });
}
