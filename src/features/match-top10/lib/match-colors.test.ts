import { describe, expect, it } from "vitest"

import { MATCH_TOP10_COLORS, matchTop10Color } from "./match-colors"

describe("matchTop10Color — 1-based 순위 → 팔레트 색 매핑", () => {
  it("1번은 첫 색, 6번은 마지막 색을 반환한다", () => {
    expect(matchTop10Color(1)).toBe(MATCH_TOP10_COLORS[0])
    expect(matchTop10Color(6)).toBe(MATCH_TOP10_COLORS[5])
  })

  it("7번(팔레트 길이 초과)은 1번과 같은 색으로 순환한다", () => {
    expect(matchTop10Color(7)).toBe(matchTop10Color(1))
  })

  it("0 이하 입력은 1번 색으로 방어한다", () => {
    expect(matchTop10Color(0)).toBe(MATCH_TOP10_COLORS[0])
    expect(matchTop10Color(-3)).toBe(MATCH_TOP10_COLORS[0])
  })
})
