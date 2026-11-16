import { describe, expect, it } from "vitest"

import type { CaseListRow } from "@/widgets/case-list"

import { FLOW_STAGES, caseFlowOf, flowStageOf, s02FactsOf, tabMarksOf } from "./case-flow"
import { makeCaseImages, makeCaseRows, stageLabel } from "./mock-cases"

const rows = makeCaseRows()
const rowOf = (no: string) => rows.find((r) => r.aprthngNo === no) as CaseListRow
/** AI 점검이 가리키는 이미지 번호 전부 */
const imageRefs = (row: CaseListRow, plus = true) => {
  const flow = caseFlowOf(row, makeCaseImages(row), plus)
  const ai = flow.ai ? [...flow.ai.flip, flow.ai.duplicate?.[0], flow.ai.duplicate?.[1], flow.ai.blur].filter(Boolean) : []
  return (ai as string[]).map(Number)
}

describe("사건 창 흐름 파생(case-flow)", () => {
  it("흐름은 5칸(결재 없음), 지금 칸은 목록 「사건 진행」과 같은 근거 — 옛 결재 · 결재완료는 감정서 끝", () => {
    expect([...FLOW_STAGES]).toEqual(["접수", "1차 작업", "검색·판정", "교차 검증", "감정서"])
    const expected: Record<string, string> = { 결재: "감정서", 감정서: "감정서", "교차 검증": "교차 검증", 검증요청: "교차 검증", 결재완료: "감정서" }
    for (const row of rows.slice(0, 7)) {
      const label = stageLabel(row.stage)
      const now = FLOW_STAGES[flowStageOf(row)]
      if (label === "이미지 확인 중") expect(["1차 작업", "검색·판정"]).toContain(now)
      else expect(now).toBe(expected[label])
    }
  })

  it("0633(4장 · 다 끝남): 5칸 모두 끝, 지금 칸 없음", () => {
    const row = rowOf("00001-25-0633")
    const flow = caseFlowOf(row, makeCaseImages(row), true)
    expect(flow.stages.map((s) => [s.name, s.state])).toEqual(FLOW_STAGES.map((n) => [n, "done"]))
    expect(flow.infoBlanks).toBe(0)
  })

  it("어느 사건이든 AI 점검의 이미지 번호는 그 사건 장수 안(4장 사건에 _5 이상 없음)", () => {
    for (const row of rows.slice(0, 7)) {
      const n = row.shoeCount + row.tireCount
      for (const ref of imageRefs(row)) expect(ref).toBeLessThanOrEqual(n)
    }
    // 1차 작업 중인 4장 사건(가상): 같은 사진 의심(_4↔_5) · 흐린 사진(_9) · _7 반전은 나오지 않는다
    const four = { ...rowOf("00001-25-0649"), shoeCount: 4, tireCount: 0, progress: { registered: 4, searched: 0, confirmed: 0 }, results: { found: 0, missed: 0, unable: 0 } }
    const flow = caseFlowOf(four, makeCaseImages(four), true)
    expect(flow.currentStage).toBe(1)
    expect(flow.ai).toMatchObject({ duplicate: undefined, flip: ["2"], blur: undefined })
    for (const ref of imageRefs(four)) expect(ref).toBeLessThanOrEqual(4)
  })

  it("0649(12장 · AI 1차 작업 중): 접수 끝 · 1차 작업 지금 · 나머지 아직", () => {
    const row = rowOf("00001-25-0649")
    const flow = caseFlowOf(row, makeCaseImages(row), true)
    expect(flow.currentStage).toBe(1)
    expect(flow.stages.map((s) => s.state)).toEqual(["done", "now", "todo", "todo", "todo"])
  })

  it("?plus=0: AI 점검은 빠지고 흐름 5칸은 그대로", () => {
    const row = rowOf("00001-25-0649")
    const flow = caseFlowOf(row, makeCaseImages(row), false)
    expect(flow.stages).toHaveLength(5)
    expect(flow.ai).toBeNull()
  })

  it("탭 표시: 사건 정보 = 빈 칸 수, 이미지 편집 = AI 점검이 걸린 장이면 !, 결과 확인 = 확인 안 된 장 수", () => {
    const row = rowOf("00001-25-0649")
    const images = makeCaseImages(row)
    const flow = caseFlowOf(row, images, true)
    expect(tabMarksOf(flow, images, "5")).toMatchObject({ info: { kind: "blanks", count: 1 }, edit: { kind: "problem" }, confirm: { kind: "count", count: 11 } })
    expect(tabMarksOf(flow, images, "1")).toMatchObject({ edit: { kind: "done" }, pattern: { kind: "done" }, search: { kind: "done" }, compare: { kind: "done" } })
    const done = rowOf("00001-25-0633")
    const doneImages = makeCaseImages(done)
    expect(tabMarksOf(caseFlowOf(done, doneImages, true), doneImages, "4")).toMatchObject({ info: { kind: "done" }, compare: { kind: "notApplicable" }, confirm: { kind: "done" } })
  })

  it("S02 값: 장수 · 사건 이름 · 의뢰관서가 행과 같고, 빈 칸이 없는 사건은 채취 방법이 채워져 있다", () => {
    const row = rowOf("00001-25-0633")
    const facts = s02FactsOf(row, caseFlowOf(row, makeCaseImages(row), true), 4, "1")
    expect(facts).toMatchObject({ imageCount: 4, form: { crimeNm: "강도", rqestGrfcNm: "서울청 › 강서서", pickMthCode: "전사판채취법" }, flipRefs: [] })
  })
})
