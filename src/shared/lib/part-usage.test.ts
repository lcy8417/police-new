import { describe, it, expect } from "vitest";
import {
  originTokens,
  classesInSource,
  coreHelpers,
  formatScreens,
  countPartUsage,
} from "../../../scripts/ui/count-part-usage.mjs";

describe("originTokens — 「원본(data-part)」 칸 읽기", () => {
  it("백틱 안의 클래스와 그림 함수를 나눈다", () => {
    expect(originTokens("`M.photo` · `.imgbox`")).toEqual([
      { kind: "fn", name: "M.photo" },
      { kind: "class", classes: ["imgbox"] },
    ]);
  });

  it("자손 선택자는 클래스를 모두 요구한다(태그 이름은 뺀다)", () => {
    expect(originTokens("`.panel-h .r` · `tr.fx-new`")).toEqual([
      { kind: "class", classes: ["panel-h", "r"] },
      { kind: "class", classes: ["fx-new"] },
    ]);
  });

  it("백틱이 없으면(설명만) 셀 수 없다", () => {
    expect(originTokens("(S02 관서 검색 한 칸)")).toEqual([]);
  });
});

describe("classesInSource — class 속성 안의 이름만 모음", () => {
  it("템플릿 끼워 넣기 안의 따옴표에서 끊기지 않는다", () => {
    const src = 'x = `<a class="grid ${on ? "sel" : ""} r">grid</a>`; const check = 1;';
    const got = classesInSource(src);
    expect([...got].sort()).toEqual(["grid", "r", "sel"]);
    expect(got.has("check")).toBe(false); // class 속성 밖의 낱말은 세지 않음
  });
});

describe("coreHelpers — core.js 공용 틀이 그리는 클래스", () => {
  it("M.<이름> = 구간마다 클래스를 모은다", () => {
    const core = [
      "  M.picon = (n) => `<span class=\"picon\"></span>`;",
      "  M.shell = function () {",
      "    return `<span class=\"inp\"></span><span class=\"avatar\"></span>`;",
      "  };",
    ].join("\n");
    const h = coreHelpers(core);
    expect([...h.get("M.picon")]).toEqual(["picon"]);
    expect([...h.get("M.shell")].sort()).toEqual(["avatar", "inp"]);
  });
});

describe("formatScreens — 화면 번호 줄이기", () => {
  it("3개 이상 이어지면 범위로", () => {
    expect(formatScreens([0, 1, 2, 4, 6, 7])).toBe("S00–S02 · S04 · S06 · S07");
  });
  it("없으면 대시", () => {
    expect(formatScreens([])).toBe("—");
  });
});

describe("countPartUsage — 표의 행마다 쓰는 화면", () => {
  const md = [
    "| 부품 | 출입구 | 파일 | 원본(data-part) | 쓰는 화면 | 변형 | 상태 |",
    "|---|---|---|---|---|---|---|",
    "| Button | kit | | `.btn` | | | 후보 |",
    "| Avatar | kit | | `.avatar` | | | 후보 |",
    "| PatternIcon | viewer | | `M.picon` | | | 후보 |",
    "| Combobox | kit | | (설명만) | | | 후보 |",
  ].join("\n");
  const core = [
    "  M.picon = (n) => `<span class=\"picon\"></span>`;",
    "  M.shell = function () { return `<span class=\"avatar\"></span>`; };",
  ].join("\n");
  const screens = {
    0: 'ours: () => `<button class="btn">a</button>`',
    1: 'ours: () => M.shell({}, `<b class="btn sm">b</b>` + M.picon("x"))',
    2: "ours: () => M.shell({}, ``)",
    3: 'const { pin, picon } = M;\nours: () => `<i class="x">${picon("s21b")}</i>`',
    4: "const { picon } = M; // 꺼내기만 하고 부르지 않음",
  };

  it("화면 파일과 그 화면이 부른 공용 틀을 함께 센다(`const { picon } = M` 으로 꺼내 부른 것 포함)", () => {
    const rows = countPartUsage({ md, screens, core });
    expect(rows).toEqual([
      { part: "Button", origin: "`.btn`", screens: [0, 1], countable: true },
      { part: "Avatar", origin: "`.avatar`", screens: [1, 2], countable: true },
      { part: "PatternIcon", origin: "`M.picon`", screens: [1, 3], countable: true },
      { part: "Combobox", origin: "(설명만)", screens: [], countable: false },
    ]);
  });
});
