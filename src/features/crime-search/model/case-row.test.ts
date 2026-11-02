import { describe, expect, it } from "vitest"

import { matchesPickDt } from "./case-row"

// 서버는 채취 일시를 항상 `YYYY-MM-DDTHH:MM:SS`로 준다(설계서 §5). 사용자는 등록 폼과 같은
// `YYYY-MM-DD HH:mm`(공백 구분)로 입력하므로, 입력의 공백을 `T`로 바꾼 앞부분 일치로 비교한다.
describe("matchesPickDt", () => {
  const PICK_DT = "2024-01-29T05:31:00"

  it("pickDt filter normalizes — 분·초·날짜 단위 입력이 모두 같은 사건과 일치한다", () => {
    expect(matchesPickDt(PICK_DT, "2024-01-29 05:31")).toBe(true)
    expect(matchesPickDt(PICK_DT, "2024-01-29 05:31:00")).toBe(true)
    expect(matchesPickDt(PICK_DT, "2024-01-29")).toBe(true)
  })

  it("pickDt가 null이면 입력이 있을 때 불일치한다", () => {
    expect(matchesPickDt(null, "2024-01-29")).toBe(false)
  })

  it("다른 시각·날짜는 불일치한다", () => {
    expect(matchesPickDt(PICK_DT, "2024-01-29 05:32")).toBe(false)
    expect(matchesPickDt(PICK_DT, "2024-01-30")).toBe(false)
  })

  it("입력이 비어 있으면(필터 미적용) pickDt와 무관하게 일치한다", () => {
    expect(matchesPickDt(PICK_DT, "")).toBe(true)
    expect(matchesPickDt(null, "")).toBe(true)
    expect(matchesPickDt(null, "   ")).toBe(true)
  })

  it("입력 앞뒤 공백은 무시한다", () => {
    expect(matchesPickDt(PICK_DT, "  2024-01-29 05:31  ")).toBe(true)
  })
})
