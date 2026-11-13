import path from "node:path";
import { pathToFileURL } from "node:url";
import type { Locator, Page } from "@playwright/test";

export type MockupScreen =
  | "S00" | "S01" | "S02" | "S03" | "S04" | "S05" | "S06" | "S07"
  | "S08" | "S09" | "S10" | "S11" | "S12" | "S13" | "S14" | "S15";

export const MOCKUP_SCREENS: MockupScreen[] = [
  "S00", "S01", "S02", "S03", "S04", "S05", "S06", "S07",
  "S08", "S09", "S10", "S11", "S12", "S13", "S14", "S15",
];

const MOCKUP_INDEX = pathToFileURL(
  path.resolve("docs/mockups/scas-redesign/index.html")
).href;

// 시안을 「감정관」 시점으로 열고, 그 화면의 개선안 프레임(.frame[data-frame="ours"])을 돌려준다.
// 화면 절 id 는 core.js 의 M.render 가 만든다(`s01` … `s15`, 소문자).
export async function openMockup(page: Page, screen: MockupScreen): Promise<Locator> {
  await page.addInitScript(() => {
    try {
      localStorage.setItem("scas-mockup-viewer", "analyst");
    } catch {
      /* 저장 불가 환경은 무시 */
    }
  });
  await page.setViewportSize({ width: 1600, height: 1000 });
  // 움직임 줄이기를 여기서 직접 켠다(설정 파일의 reducedMotion 이 실제로는 적용되지 않음을 확인했다 — matchMedia 가 false).
  await page.emulateMedia({ reducedMotion: "reduce" });
  // 외부 글꼴(Google Fonts)은 조각마다 늦게 도착해 같은 글이 1~2픽셀 다르게 찍히는 일이 있었다(S12 · S13에서 관찰).
  // 네트워크에 기대지 않도록 막고, 시스템 대체 글꼴로 고정해 찍는다(오프라인에서도 같은 결과).
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort());
  await page.goto(MOCKUP_INDEX, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  // 고정 막대(.controls · .toc)와 표 머리가 스크롤 위치에 따라 프레임 위에 겹쳐 찍히지 않도록 끈다(테스트 전용).
  await page.addStyleTag({
    content: ".controls, .toc, .doc-table th { position: static !important; }",
  });
  // loading="lazy" 그림이 화면 밖에서 늦게 그려지면 찍을 때마다 달라지므로 전부 즉시 불러 디코딩까지 기다린다.
  await page.evaluate(async () => {
    const imgs = Array.from(document.images);
    imgs.forEach((img) => (img.loading = "eager"));
    await Promise.all(imgs.map((img) => img.decode().catch(() => undefined)));
  });
  // 레이아웃이 바뀐 뒤 새로 필요해진 글꼴 조각까지 받고, 두 프레임 그린 뒤 찍는다.
  await page.waitForLoadState("networkidle");
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
    await document.fonts.ready;
  });
  const frame = page.locator(`#${screen.toLowerCase()} .frame[data-frame="ours"]`);
  await frame.scrollIntoViewIfNeeded();
  return frame;
}
