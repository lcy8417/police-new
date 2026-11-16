import { describe, expect, it } from "vitest"

import { KIT_FIXTURE_RENDERS } from "./fixtures-kit"
import { KIT_PART_FIXTURES } from "./fixtures-kit-meta"

describe("kit 진열 예시 데이터 ↔ 그리기", () => {
  it("id 집합이 같고 중복이 없다", () => {
    const ids = KIT_PART_FIXTURES.map((f) => f.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(Object.keys(KIT_FIXTURE_RENDERS).sort()).toEqual([...ids].sort())
  })
})
