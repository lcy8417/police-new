import { describe, expect, it } from "vitest"

import { requestListPath } from "@/entities/request"

import { ALL_PERIOD_FROM, periodFrom, sourceParam } from "./case-list-filters"

// 2026-11-17 12:00 KST
const NOW = Date.UTC(2026, 10, 17, 3, 0, 0)

describe("사건 목록 출처 · 기간 칩", () => {
  it("출처: 안 고름 · 둘 다 = ALL, 과거만 = SCAS, 새 사건만 = APP", () => {
    expect(sourceParam([])).toBe("ALL")
    expect(sourceParam(["SCAS"])).toBe("SCAS")
    expect(sourceParam(["APP"])).toBe("APP")
    expect(sourceParam(["APP", "SCAS"])).toBe("ALL")
  })

  it("기간: 없음 = 서버 기본, 여럿이면 가장 넓은 것, 전체 = 아주 이른 날", () => {
    expect(periodFrom([], NOW)).toBeUndefined()
    expect(periodFrom(["3m"], NOW)).toBe("2026-08-17")
    expect(periodFrom(["3m", "1y"], NOW)).toBe("2025-11-16")
    expect(periodFrom(["1y", "all"], NOW)).toBe(ALL_PERIOD_FROM)
  })

  it("A1 주소에 src · from 이 실린다(비우면 안 실림)", () => {
    expect(requestListPath({ src: "SCAS", from: ALL_PERIOD_FROM })).toBe("/requests?src=SCAS&from=1990-01-01")
    expect(requestListPath({})).toBe("/requests")
  })
})
