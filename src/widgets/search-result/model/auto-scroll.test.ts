import { describe, expect, it } from "vitest"

import { nextPageTop, nextScrollTop, passedRank } from "./auto-scroll"

describe("자동 스크롤 계산", () => {
  it("속도 방식은 지난 시간만큼 내려가고 끝을 넘지 않는다(긴 멈춤은 100ms 로 자름)", () => {
    expect(nextScrollTop(0, 500, 60, 1000)).toBe(6)
    expect(nextScrollTop(0, 50, 60, 1000)).toBe(3)
    expect(nextScrollTop(998, 50, 60, 1000)).toBe(1000)
  })

  it("쪽 넘김은 한 화면(32px 겹침) 아래로, 지나간 카드 중 가장 큰 순위를 본 것으로", () => {
    expect(nextPageTop(0, 600, 5000)).toBe(568)
    expect(nextPageTop(4900, 600, 5000)).toBe(5000)
    expect(
      passedRank(
        [
          { rank: 3, bottom: 90 },
          { rank: 4, bottom: 100 },
          { rank: 5, bottom: 130 },
        ],
        100,
      ),
    ).toBe(4)
    expect(passedRank([{ rank: 1, bottom: 200 }], 100)).toBeNull()
  })
})
