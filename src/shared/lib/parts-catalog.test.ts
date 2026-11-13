import { describe, it, expect } from "vitest";
import { checkCatalog } from "../../../scripts/ui/check-parts-catalog.mjs";

const TABLE = (rows: string[]) =>
  ["| 부품 | 상태 | 파일 |", "|---|---|---|", ...rows].join("\n");

const entrance = { "src/shared/ui/kit/index.ts": 'export { Button, type ButtonProps } from "./Button"' };
const exists = (files: string[]) => (f: string) => files.includes(f);

describe("checkCatalog — components.md 판정", () => {
  it("모두 맞으면 문제 없음", () => {
    const md = TABLE(["| `Button` | 구현됨 | src/a.tsx |", "| Chip | 후보 | |"]);
    expect(
      checkCatalog({ md, entranceSources: entrance, fileExists: exists(["src/a.tsx"]) }),
    ).toEqual([]);
  });

  it("표가 없으면 한 줄로 실패", () => {
    expect(
      checkCatalog({ md: "# 제목\n표 없음", entranceSources: entrance, fileExists: exists([]) }),
    ).toEqual(["부품 표를 찾지 못함 — components.md"]);
  });

  it("알 수 없는 상태는 실패(이모지·괄호 덧붙임 포함)", () => {
    const md = TABLE(["| Button | 구현됨 ✅ | src/a.tsx |"]);
    const out = checkCatalog({ md, entranceSources: entrance, fileExists: exists(["src/a.tsx"]) });
    expect(out).toContain('알 수 없는 상태 "구현됨 ✅" (Button)');
  });

  it("구현됨인데 파일이 없으면 실패", () => {
    const md = TABLE(["| Button | 검증됨 | src/missing.tsx |"]);
    const out = checkCatalog({ md, entranceSources: entrance, fileExists: exists([]) });
    expect(out).toContain("표의 파일 없음: Button → src/missing.tsx");
  });

  it("출입구 export 가 표에 없으면 실패(type export 는 무시)", () => {
    const md = TABLE(["| Chip | 후보 | |"]);
    const out = checkCatalog({ md, entranceSources: entrance, fileExists: exists([]) });
    expect(out).toEqual(["src/shared/ui/kit/index.ts: export「Button」이 표의 「부품」 열에 없음"]);
  });
});
