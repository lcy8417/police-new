/**
 * 정적 검사(AC-ALIGN-021 시나리오 10d(b)): 정렬 슬라이스(`features/crime-align/**`)
 * 소스 파일에 `editImage` 참조가 0건이어야 한다. REQ-ALIGN-002b(HARD)는 정렬 캔버스가
 * 원본/편집 토글 상태와 무관하게 항상 저장 원본만 사용하도록 요구하며, 이 컴포넌트
 * 트리는 애초에 `editImage`/`edit.displayImage`류 prop을 받지 않는다 — 이 테스트는
 * 그 불변식이 소스 레벨에서도 깨지지 않았음을 회귀 검증한다.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const THIS_FILE = fileURLToPath(import.meta.url);
const SLICE_ROOT = join(dirname(THIS_FILE), ".."); // features/crime-align

function collectSourceFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      files.push(...collectSourceFiles(full));
    } else if (/\.(ts|tsx)$/.test(entry) && !/\.test\.(ts|tsx)$/.test(entry)) {
      files.push(full);
    }
  }
  return files;
}

describe("features/crime-align — editImage 참조 0건(REQ-ALIGN-002b 정적 검사)", () => {
  it("editImage 토큰이 슬라이스 어떤 소스 파일에도 등장하지 않는다", () => {
    const files = collectSourceFiles(SLICE_ROOT);
    expect(files.length).toBeGreaterThan(0);

    const offenders: string[] = [];
    for (const file of files) {
      const content = readFileSync(file, "utf-8");
      if (content.includes("editImage")) {
        offenders.push(file);
      }
    }

    expect(offenders).toEqual([]);
  });
});
