import { describe, expect, it } from "vitest"

import { PART_FIXTURES } from "./fixtures-meta"
import { FIXTURE_RENDERS } from "./fixtures"

// 데이터(fixtures-meta, Node/Playwright 가 읽음)와 그리는 쪽(fixtures.tsx, 진열 화면만 읽음)의 id 집합은 같아야 한다.
describe("진열 예시 데이터 ↔ 그리기", () => {
  it("id 집합이 같다", () => {
    expect(Object.keys(FIXTURE_RENDERS).sort()).toEqual(PART_FIXTURES.map((f) => f.id).sort())
  })

  it("id 는 중복이 없고 S00-00 꼴이다", () => {
    const ids = PART_FIXTURES.map((f) => f.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id).toMatch(/^S\d{2}-\d{2}$/)
  })
})
