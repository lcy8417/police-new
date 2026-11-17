import { describe, expect, it } from "vitest"

import type { Shoe } from "@/entities/shoe"

import { primaryWorkStatus, toCardInfo, toShoeListFilters, toStageSummary } from "./live-data"
import type { ShoeDbFilters } from "./types"

const EMPTY: ShoeDbFilters = {
  ftwrId: "",
  makrCode: "",
  sex: "all",
  regFrom: "",
  regTo: "",
  brandCode: "",
  approval: "all",
  office: null,
  groupNm: "",
  patternInput: "all",
  shoeKind: "",
  remark: "",
}

const shoe = (ftwrId: string, workStatus?: string[]): Shoe => ({ ftwrId, top: [], mid: [], bottom: [], outline: [], workStatus })

describe("toShoeListFilters — 상세 조건 · 작업 단계 칩 → J1 거르기", () => {
  it("빈 값 · 「전체」는 보내지 않는다", () => {
    expect(toShoeListFilters(EMPTY, null)).toEqual({})
    expect(toShoeListFilters(null, null)).toEqual({})
  })

  it("걸린 값만 · 앞뒤 공백 없이 · 신발 ID 는 문자열 그대로(앞자리 0)", () => {
    const f = {
      ...EMPTY,
      ftwrId: " 00758 ",
      approval: "no",
      patternInput: "in",
      regFrom: "2026-03-01",
      regTo: "2026-03-31",
      office: "12",
      sex: "M",
      groupNm: "crocs",
    }
    expect(toShoeListFilters(f, "approve")).toEqual({
      ftwrId: "00758",
      approval: "no",
      patternInput: "in",
      registFrom: "2026-03-01",
      registTo: "2026-03-31",
      registOrg: "12",
      sex: "M",
      groupNm: "crocs",
      stage: "approve",
    })
  })
})

describe("작업 상태(J1 work_status) → 카드", () => {
  it("문양 · 승인 대기가 측면 없음보다 먼저, 할 일이 없으면 없음", () => {
    expect(primaryWorkStatus(shoe("a", ["측면 없음", "승인 대기"]))).toBe("승인 대기")
    expect(primaryWorkStatus(shoe("a", ["측면 없음"]))).toBe("측면 없음")
    expect(primaryWorkStatus(shoe("a", []))).toBeUndefined()
    expect(primaryWorkStatus(shoe("a"))).toBeUndefined()
  })

  it("카드 정보에는 AI 표식이 없다(서버 저장 안 함)", () => {
    expect(toCardInfo([shoe("00758", ["문양 대기", "측면 없음"]), shoe("00901", [])])).toEqual({
      "00758": { status: "문양 대기" },
    })
  })
})

describe("toStageSummary — J8 → 작업 단계 줄", () => {
  it("단계 4칸 · 미승인 막대 · 오늘 승인(50매 기준) · 고른 칩이 파랑", () => {
    const summary = toStageSummary(
      {
        stages: [
          { key: "pattern", count: 3 },
          { key: "group", count: 2 },
          { key: "approve", count: 5 },
          { key: "approved", count: 7 },
        ],
        backlog: { month: "2026-11", total: 4, parts: [{ key: "pattern", count: 1 }, { key: "group", count: 0 }, { key: "approve", count: 3 }] },
        todayApproved: 2,
      },
      "approve",
    )
    expect(summary.stages.map((s) => [s.title.split(" · ")[0], s.count, s.active])).toEqual([
      ["등록됨", 3, false],
      ["문양 입력됨", 2, false],
      ["승인 대기", 5, true],
      ["승인", 7, false],
    ])
    expect(summary.backlog).toMatchObject({ monthLabel: "2026-11 미승인", total: 4, todayDone: 2, todayLimit: 50 })
    expect(summary.backlog.parts.map((p) => p.count)).toEqual([1, 0, 3])
  })
})
