import { test, expect } from "@playwright/test";
import { assertFonts, openMockup } from "./mockup-open";
import { diffStyle, normalizeControl, readStyle } from "./style-read";

// 대조 도구(readStyle · diffStyle · assertFonts) 자체가 맞게 재고 맞게 실패하는지 확인한다.

const BUTTON_CSS = `
  body { margin: 0; font: 14px/1.6 sans-serif; }
  .b {
    display: inline-flex; align-items: center; height: 24px; padding: 0 8px;
    border: 1px solid rgb(30, 42, 60); border-radius: 6px;
    background: rgb(15, 24, 38); color: rgb(229, 233, 240);
  }
`;

test("px 0.01 이내 차이는 같음, 색 차이는 한 줄", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setContent(`
    <style>${BUTTON_CSS}</style>
    <button id="base" class="b">검색</button>
    <button id="pad" class="b" style="padding-left: 4.004px">검색</button>
    <button id="base2" class="b" style="padding-left: 4px">검색</button>
    <button id="color" class="b" style="color: rgb(74, 158, 255)">검색</button>
  `);
  const base = await readStyle(page.locator("#base2"));
  const pad = await readStyle(page.locator("#pad"));
  const color = await readStyle(page.locator("#color"));
  const plain = await readStyle(page.locator("#base"));

  // 숫자 px 는 소수 2자리 반올림해서 담긴다.
  expect(pad.props["padding-left"]).toBe("4px");
  expect(pad.tag).toBe("button");

  expect(diffStyle(base, pad)).toEqual([]);

  const lines = diffStyle(plain, color);
  expect(lines).toEqual(["button color: 시안=rgb(229, 233, 240) 구현=rgb(74, 158, 255)"]);
});

test("자식 요소와 ::after 차이도 잡는다", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setContent(`
    <style>
      ${BUTTON_CSS}
      #b::after { content: "▾"; margin-left: 4px; }
      #b2::after { content: "⌕"; margin-left: 4px; }
    </style>
    <button id="a" class="b"><span style="font-size: 12px">가</span></button>
    <button id="b" class="b"><span style="font-size: 12px">가</span></button>
    <button id="b2" class="b"><span style="font-size: 13px">가</span></button>
  `);
  const a = await readStyle(page.locator("#a"));
  const b = await readStyle(page.locator("#b"));
  const b2 = await readStyle(page.locator("#b2"));

  expect(a.children).toHaveLength(1);
  expect(a.pseudo.after.content).toBe("none");
  expect(b.pseudo.after.content).toBe('"▾"');

  // ::after 가 없던 쪽 ↔ 있는 쪽: content 차이로 잡힌다.
  expect(diffStyle(a, b)).toContain('button::after content: 시안=none 구현="▾"');

  const lines = diffStyle(b, b2);
  expect(lines).toContain("button > span[0] font-size: 시안=12px 구현=13px");
  expect(lines).toContain('button::after content: 시안="▾" 구현="⌕"');
});

test("자식 수가 다르면 한 줄로 알린다", async ({ page }) => {
  await page.setContent(`
    <div id="one"><i></i></div>
    <div id="two"><i></i><i></i></div>
  `);
  const one = await readStyle(page.locator("#one"));
  const two = await readStyle(page.locator("#two"));
  expect(diffStyle(one, two)).toContain("div 자식 수: 시안=1 구현=2");
});

test("입력칸 정규화(control): 태그·input 은 무시하고 캐럿 색·칩 차이는 잡는다", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setContent(`
    <style>
      body { margin: 0; font: 14px/1.6 sans-serif; }
      .inp { display: inline-flex; gap: 6px; height: 26px; padding: 0 8px; border: 1px solid rgb(30, 42, 60); }
      .caret { margin-left: auto; color: rgb(91, 107, 133); }
      input { border: 0; padding: 0; background: transparent; color: inherit; font: inherit; field-sizing: content; }
    </style>
    <span id="m" class="inp">전체<span class="caret">▾</span></span>
    <span id="ok" class="inp"><input value="전체"><span class="caret">▾</span></span>
    <span id="bad" class="inp"><input value="전체"><span class="caret" style="color: rgb(74, 158, 255)">▾</span></span>
    <span id="chip" class="inp">기타<span class="caret">▾</span></span>
    <span id="wrapped" class="inp"><input value="기타"><span style="display: contents"><span class="caret">▾</span></span></span>
  `);
  const m = normalizeControl(await readStyle(page.locator("#m")), "mockup");
  const ok = normalizeControl(await readStyle(page.locator("#ok")), "app");
  const bad = normalizeControl(await readStyle(page.locator("#bad")), "app");
  expect(diffStyle(m, ok)).toEqual([]);
  expect(diffStyle(m, bad)).toContain("control > span[0] color: 시안=rgb(91, 107, 133) 구현=rgb(74, 158, 255)");
  // 묶음 span 은 풀려서 자식(캐럿)이 시안 층에 놓인다
  const chipM = normalizeControl(await readStyle(page.locator("#chip")), "mockup");
  const wrapped = normalizeControl(await readStyle(page.locator("#wrapped")), "app");
  expect(diffStyle(chipM, wrapped)).toEqual([]);
  // 루트 색이 다르면 당연히 잡는다(무시하는 건 태그와 input 뿐)
  await page.evaluate(() => ((document.querySelector("#ok") as HTMLElement).style.borderColor = "rgb(255, 0, 0)"));
  const red = normalizeControl(await readStyle(page.locator("#ok")), "app");
  expect(diffStyle(m, red).some((l) => l.startsWith("control border-top-color"))).toBe(true);
});

test("글꼴이 없으면 한 줄로 실패", async ({ page }) => {
  await page.route("**/fonts.g*/**", (r) => r.abort());
  await expect(openMockup(page, "S01", { fonts: "real" })).rejects.toThrow(
    new Error("글꼴 미로딩: IBM Plex Sans KR")
  );
});

test("글꼴이 실제로 오면 assertFonts 통과", async ({ page }) => {
  await openMockup(page, "S01", { fonts: "real" });
  await expect(assertFonts(page)).resolves.toBeUndefined();
});
