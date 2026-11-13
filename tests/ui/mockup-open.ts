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

/** 대조에 쓰는 기준 글꼴(시안 `--font-ui` 첫 글꼴). */
export const REQUIRED_FONT = "IBM Plex Sans KR";
/** mono 픽스처(Field mono · Chip blue-mono-h20 · AiTag …)의 기준 글꼴(시안 `--font-mono` = 앱 `--font-code` 첫 글꼴). */
export const REQUIRED_MONO_FONT = "JetBrains Mono";
/** assertFonts 가 확인하는 글꼴(앞에서부터 — 처음 못 받은 글꼴 이름으로 실패한다). */
export const REQUIRED_FONTS = [REQUIRED_FONT, REQUIRED_MONO_FONT] as const;

/**
 * 기준 글꼴 두 개(ui · mono)가 실제로 로딩됐는지 확인한다. 안 됐으면 처음 못 받은 글꼴 이름으로 한 줄 오류.
 * 시안 쪽(openMockup `fonts: "real"`)과 진열 화면(`/dev/parts`) 쪽이 같은 함수를 쓴다.
 *
 * 확인해 둔 함정 두 가지:
 * - `check()` 는 그 이름의 @font-face 가 하나도 없으면(글꼴 CSS 요청이 막힘) 「기다릴 것 없음」으로 보고 참을 돌려준다
 *   → 같은 이름의 글꼴 조각이 실제로 `loaded` 인지도 함께 본다.
 * - Google Fonts 는 글꼴을 유니코드 조각 수백 개로 나눠, 화면 글자에 쓰인 조각만 받는다. 화면 글자가 적으면
 *   `check()` 가 보는 공백(U+20) 조각이 아직 안 와서 거짓이 된다 → 먼저 `load()` 로 그 조각을 받아 둔다.
 */
export async function assertFonts(page: Page): Promise<void> {
  const missing = await page.evaluate(async (families) => {
    await document.fonts.ready;
    for (const family of families) {
      await document.fonts.load(`12px "${family}"`).catch(() => undefined);
      const checked = document.fonts.check(`12px "${family}"`);
      const loaded = Array.from(document.fonts).some(
        (face) => face.family.replace(/^["']|["']$/g, "") === family && face.status === "loaded"
      );
      if (!(checked && loaded)) return family;
    }
    return null;
  }, [...REQUIRED_FONTS]);
  if (missing) throw new Error(`글꼴 미로딩: ${missing}`);
}

export interface OpenMockupOptions {
  /**
   * `"block"`(기본): Google Fonts 요청을 막고 시스템 대체 글꼴로 찍는다(기준 스냅샷 · 오프라인 결정성).
   * `"real"`: 실제 글꼴을 받고 `assertFonts` 로 로딩을 확인한다(부품 대조 — 진열 화면과 같은 글꼴).
   */
  fonts?: "block" | "real";
  /** 고정 막대(.controls · .toc · 표 머리)를 `position: static` 으로 끈다(기본 켬). */
  staticChrome?: boolean;
}

// 시안을 「감정관」 시점으로 열고, 그 화면의 개선안 프레임(.frame[data-frame="ours"])을 돌려준다.
// 화면 절 id 는 core.js 의 M.render 가 만든다(`s01` … `s15`, 소문자).
export async function openMockup(
  page: Page,
  screen: MockupScreen,
  opts: OpenMockupOptions = {}
): Promise<Locator> {
  const { fonts = "block", staticChrome = true } = opts;
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
  // (부품 대조는 진열 화면과 같은 글꼴이어야 하므로 `fonts: "real"` 로 실제 글꼴을 받는다.)
  if (fonts === "block") {
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort());
  }
  await page.goto(MOCKUP_INDEX, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  // 고정 막대(.controls · .toc)와 표 머리가 스크롤 위치에 따라 프레임 위에 겹쳐 찍히지 않도록 끈다(테스트 전용).
  if (staticChrome) {
    await page.addStyleTag({
      content: ".controls, .toc, .doc-table th { position: static !important; }",
    });
  }
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
  if (fonts === "real") await assertFonts(page);
  const frame =page.locator(`#${screen.toLowerCase()} .frame[data-frame="ours"]`);
  await frame.scrollIntoViewIfNeeded();
  return frame;
}
