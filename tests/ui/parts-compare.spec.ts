import fs from "node:fs";
import path from "node:path";
import { test, expect, type Locator, type Page, type TestInfo } from "@playwright/test";
import { PART_FIXTURES } from "../../src/pages/dev/parts/fixtures-meta";
import { assertFonts, openMockup, type MockupScreen } from "./mockup-open";
import { diffStyle, normalizeControl, readStyle } from "./style-read";

// 시안 요소 ↔ 진열 화면(/dev/parts) 요소 자동 대조(설계서 §9).
// 픽스처 id 마다: computed style 차이 0 + 요소 스크린샷 차이 0(maxDiffPixels 0, 기본 픽셀 임계값 — R5).
// 스크린샷 기준 이미지는 매 실행 시안에서 새로 뜬다(커밋하지 않음 — .gitignore).

/** 시안과 같은 뷰포트(openMockup 과 동일). */
const VIEWPORT = { width: 1600, height: 1000 };

/** 요소 스크린샷 옵션 — toHaveScreenshot 기본값(animations disabled · caret hide · scale css)과 맞춘다. */
const SHOT = { animations: "disabled", caret: "hide", scale: "css" } as const;

// 진열 화면을 연다. 백엔드가 없으므로 세션 조회는 401 로 고정(R2), 움직임 줄이기 직접 켬(R9).
async function openGallery(page: Page, id?: string): Promise<void> {
  await page.route("**/auth/me", (route) =>
    route.fulfill({ status: 401, contentType: "application/json", body: "{}" })
  );
  await page.setViewportSize(VIEWPORT);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(id ? `/dev/parts?id=${encodeURIComponent(id)}` : "/dev/parts");
  await page.locator("[data-parts-gallery]").waitFor();
  await page.waitForLoadState("networkidle");
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
    await document.fonts.ready;
  });
}

// 요소 안 글자에 쓰이는 글꼴 조각(굵기 · 유니코드 범위별)을 전부 받아 둔다 — 늦게 오는 조각 때문에 1~2픽셀 흔들리는 것 방지.
async function loadFontsFor(locator: Locator): Promise<void> {
  await locator.evaluate(async (root) => {
    const els = [root, ...Array.from(root.querySelectorAll("*"))];
    await Promise.all(
      els.map((el) => {
        const s = getComputedStyle(el);
        const text = el.textContent || " ";
        return document.fonts.load(`${s.fontStyle} ${s.fontWeight} ${s.fontSize} ${s.fontFamily}`, text);
      })
    );
    await document.fonts.ready;
  });
}

type Rect = { x: number; y: number };

/** 소수 부분(0 이상 1 미만). */
const frac = (n: number) => ((n % 1) + 1) % 1;

// 글자 안티앨리어싱은 요소가 놓인 소수 픽셀 위치(예 x=866.125)에 따라 달라진다. 시안 요소와 진열 요소의
// 소수 위치를 맞춰야 같은 모양이 같은 픽셀로 찍힌다 → 진열 상자를 position:relative 로 소수만큼 민다(테스트 안에서만).
async function alignSubpixel(devEl: Locator, mockupRect: Rect): Promise<void> {
  const devRect = await devEl.evaluate((el) => el.getBoundingClientRect().toJSON() as Rect);
  const dx = frac(frac(mockupRect.x) - frac(devRect.x));
  const dy = frac(frac(mockupRect.y) - frac(devRect.y));
  await devEl.evaluate(
    (el, { dx, dy }) => {
      const box = el.closest("[data-fixture-id]")?.lastElementChild as HTMLElement | null;
      if (!box) throw new Error("진열 상자를 찾지 못함");
      box.style.position = "relative";
      box.style.left = `${dx}px`;
      box.style.top = `${dy}px`;
    },
    { dx, dy }
  );
  const after = await devEl.evaluate((el) => el.getBoundingClientRect().toJSON() as Rect);
  // 레이아웃 단위(1/64px) 안에서 같아야 한다(0.999 ↔ 0.001 처럼 경계를 넘는 경우도 가깝다고 본다).
  const gap = (a: number, b: number) => {
    const d = Math.abs(frac(a) - frac(b));
    return Math.min(d, 1 - d);
  };
  expect(gap(after.x, mockupRect.x), "진열 요소 소수 x 위치 맞춤").toBeLessThan(1 / 64);
  expect(gap(after.y, mockupRect.y), "진열 요소 소수 y 위치 맞춤").toBeLessThan(1 / 64);
}

/** --update-snapshots(all · changed) 실행인가 — 이때 toHaveScreenshot 은 비교 대신 기준을 덮어쓴다. */
function isUpdateMode(testInfo: TestInfo): boolean {
  const mode = testInfo.config.updateSnapshots;
  return mode === "all" || mode === "changed";
}

/** 픽스처 id 형식(화면 번호-순번). */
const ID_FORMAT = /^S\d{2}-\d{2}$/;

function screenOf(id: string): MockupScreen {
  return id.slice(0, 3) as MockupScreen;
}

test("진열 화면이 백엔드 없이 열린다", async ({ page }) => {
  await openGallery(page);
  await assertFonts(page);
  if (PART_FIXTURES.length === 0) {
    await expect(page.getByText("진열할 부품 없음")).toBeVisible();
  } else {
    await expect(page.locator("[data-fixture-id]")).toHaveCount(PART_FIXTURES.length);
  }
});

test("진열 화면도 글꼴이 없으면 한 줄로 실패", async ({ page }) => {
  await page.route("**/fonts.g*/**", (r) => r.abort());
  await openGallery(page);
  await expect(assertFonts(page)).rejects.toThrow(new Error("글꼴 미로딩: IBM Plex Sans KR"));
});

test("없는 id 를 고르면 「진열할 부품 없음」", async ({ page }) => {
  await openGallery(page, "S99-99");
  await expect(page.getByText("진열할 부품 없음")).toBeVisible();
});

// 기준 이미지를 직접 써 넣는 방식이 맞으려면, 써 넣는 경로 = toHaveScreenshot 이 읽는 경로여야 한다.
// 경로 계산이 설정(snapshotPathTemplate)과 같은지, 그리고 실제로 그 파일로 비교하는지(다른 그림이면 실패) 확인한다.
test("기준 이미지 경로 = toHaveScreenshot 이 읽는 경로", async ({ page }, testInfo) => {
  // 갱신 모드(-u)에서는 toHaveScreenshot 이 기준을 덮어써 「다른 그림이면 실패」를 확인할 수 없다.
  test.skip(isUpdateMode(testInfo), "--update-snapshots 실행에서는 확인 불가");
  // 설정 템플릿 `{testDir}/__snapshots__/{testFilePath}/{arg}{ext}` 를 손으로 푼 경로.
  // (주의: Playwright 는 이름을 정리한다 — 예 `__x.png` → `-x.png`. 그래서 직접 조립하지 않고 snapshotPath 를 쓴다.)
  const byTemplate = (arg: string) =>
    path.join(
      testInfo.project.testDir,
      "__snapshots__",
      path.relative(testInfo.project.testDir, testInfo.file),
      arg
    );
  for (const arg of ["S01-03.png", "S02-22.png", ...PART_FIXTURES.map((f) => `${f.id}.png`)]) {
    expect(testInfo.snapshotPath(arg, { kind: "screenshot" })).toBe(byTemplate(arg));
  }

  const name = "path-check.png";
  const target = testInfo.snapshotPath(name, { kind: "screenshot" });
  expect(target).toBe(byTemplate(name));

  await page.setContent(`
    <div id="blue" style="width:40px;height:20px;background:rgb(74,158,255)"></div>
    <div id="red" style="width:40px;height:20px;background:rgb(239,68,68)"></div>
  `);
  const blue = page.locator("#blue");
  const red = page.locator("#red");
  try {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, await blue.screenshot(SHOT));
    await expect(blue).toHaveScreenshot(name);

    // 다른 그림을 써 넣으면 같은 요소라도 실패해야 한다 → 정말 이 파일을 읽는다.
    fs.writeFileSync(target, await red.screenshot(SHOT));
    let failed = false;
    try {
      await expect(blue).toHaveScreenshot(name, { timeout: 1000 });
    } catch {
      failed = true;
    }
    expect(failed).toBe(true);
  } finally {
    fs.rmSync(target, { force: true });
  }
});

for (const fixture of PART_FIXTURES) {
  test(fixture.id, async ({ page, browser }, testInfo) => {
    // 갱신 모드(-u)에서는 toHaveScreenshot 이 구현 그림으로 기준을 덮어쓰고 통과해 버린다 → 대조가 무의미.
    expect(
      isUpdateMode(testInfo),
      "parts-compare 는 --update-snapshots 없이 돌린다(기준은 매번 시안에서 뜬다)"
    ).toBe(false);

    expect(fixture.id, "픽스처 id 형식").toMatch(ID_FORMAT);
    const sel = `[data-part-id="${fixture.id}"]`;

    // 1) 시안: 실제 글꼴로 열고 요소 하나를 읽는다(시안 페이지는 끝나면 반드시 닫는다).
    const shotName = `${fixture.id}.png`;
    const target = testInfo.snapshotPath(shotName, { kind: "screenshot" });
    let mockupStyle: Awaited<ReturnType<typeof readStyle>>;
    let mockupRect: Rect;
    const mockupPage = await browser.newPage();
    try {
      const frame = await openMockup(mockupPage, screenOf(fixture.id), { fonts: "real" });
      const mockupEl = frame.locator(sel);
      const count = await mockupEl.count();
      expect(count, `시안에 data-part-id=${fixture.id} 가 1개가 아님`).toBe(1);
      // 시안 전용 주석 핀(.pin)은 부품이 아니다(절대 위치 덧씌움) → 읽기 · 촬영 전에 뗀다.
      await mockupEl.evaluate((el) => el.querySelectorAll(".pin").forEach((p) => p.remove()));
      await mockupEl.scrollIntoViewIfNeeded();
      await loadFontsFor(mockupEl);
      mockupStyle = await readStyle(mockupEl);
      mockupRect = await mockupEl.evaluate((el) => el.getBoundingClientRect().toJSON() as Rect);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, await mockupEl.screenshot(SHOT));
    } finally {
      await mockupPage.close();
    }

    // 2) 구현: 진열 화면에서 같은 id 요소(설정의 baseURL 을 쓰는 기본 page).
    await openGallery(page, fixture.id);
    await assertFonts(page);
    const devEl = page.locator(`[data-parts-gallery] ${sel}`);
    await expect(devEl, `진열 화면에 data-part-id=${fixture.id} 가 1개가 아님`).toHaveCount(1);
    // 부품 루트 = 진열 상자의 첫 자식 요소(표식이 상자 안 다른 요소에 붙는 것을 막는다).
    const isRoot = await devEl.evaluate((el) => {
      const box = el.closest("[data-fixture-id]")?.lastElementChild;
      return !!box && box.firstElementChild === el;
    });
    expect(isRoot, `data-part-id=${fixture.id} 요소가 진열 상자의 첫 자식 요소가 아님`).toBe(true);
    await loadFontsFor(devEl);
    const devStyle = await readStyle(devEl);

    if (fixture.compare === "control") {
      // 폼 입력칸: 루트 태그와 앱 `<input>` 자식만 무시하고 나머지는 그대로 비교(normalizeControl, R18).
      expect(diffStyle(normalizeControl(mockupStyle, "mockup"), normalizeControl(devStyle, "app"))).toEqual([]);
    } else {
      expect(diffStyle(mockupStyle, devStyle)).toEqual([]);
    }
    // noShot: 구조상 같은 픽셀이 될 수 없는 자리(이유는 PartFixture.noShot) — 계산값 비교는 위에서 이미 했다.
    if (fixture.noShot) return;
    await alignSubpixel(devEl, mockupRect);
    await expect(devEl).toHaveScreenshot(
      shotName,
      fixture.shotMaxDiffPixels === undefined ? {} : { maxDiffPixels: fixture.shotMaxDiffPixels }
    );
  });
}
