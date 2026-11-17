import { describe, expect, it } from "vitest"

import type { Crime } from "@/entities/crime"

import { caseMatches, groupCrimes, imageNoFromPick, imageSeqOf, toCaseListRow } from "./case-groups"

const crime = (aprthngNo: string, extra: Partial<Crime> = {}): Crime => ({
  aprthngNo,
  apprslReqestNo: aprthngNo.replace(/_\d+$/, ""),
  top: [],
  mid: [],
  bottom: [],
  outline: [],
  ...extra,
})

describe("case-groups — 감정물 → 사건 묶음", () => {
  it("감정의뢰번호로 묶고 이미지는 순번(숫자) 순서, 등록일은 가장 이른 날", () => {
    const [g] = groupCrimes([
      crime("A-1_10", { frstRegistDt: "2026-11-12T10:00:00", crimeNm: "절도" }),
      crime("A-1_2", { frstRegistDt: "2026-11-11T09:00:00", rqestGrfcNm: "종로경찰서" }),
    ])
    expect(g.caseNo).toBe("A-1")
    expect(g.images.map((i) => i.no)).toEqual(["2", "10"])
    expect(g.registeredAt).toBe("2026-11-11")
    expect(g.caseName).toBe("절도")
    expect(g.requestOffice).toBe("종로경찰서")
  })

  it("감정의뢰번호가 없으면 감정물 한 장이 한 사건, 순번은 감정물 번호 그대로", () => {
    const [g] = groupCrimes([crime("SOLO", { apprslReqestNo: undefined })])
    expect(g.caseNo).toBe("SOLO")
    expect(imageSeqOf("SOLO")).toBe("SOLO")
    expect(g.images).toEqual([{ no: "SOLO", aprthngNo: "SOLO" }])
  })

  it("찾기는 사건 번호 · 사건명 · 의뢰관서 · 이미지 감정물 번호, 이미지 고르기는 전체 번호 · 순번 둘 다", () => {
    const [g] = groupCrimes([crime("A-1_1", { crimeNm: "주거침입" }), crime("A-1_2")])
    expect(caseMatches(g, "주거")).toBe(true)
    expect(caseMatches(g, "a-1_2")).toBe(true)
    expect(caseMatches(g, "없음")).toBe(false)
    expect(imageNoFromPick(g, "A-1_2")).toBe("2")
    expect(imageNoFromPick(g, "1")).toBe("1")
    expect(imageNoFromPick(g, "A-9_1")).toBeNull()
  })

  it("목록 행: 서버에 없는 결과는 0, 진행은 등록 장수, 썸네일은 첫 장", () => {
    const [g] = groupCrimes([crime("A-1_1"), crime("A-1_2")])
    const row = toCaseListRow(g, (no) => `/img/${no}`)
    expect(row.results).toEqual({ found: 0, missed: 0, unable: 0 })
    expect(row.progress).toEqual({ registered: 2, searched: 0, confirmed: 0 })
    expect(row.thumbSrc).toBe("/img/A-1_1")
    expect(row.docNo).toBe("")
  })
})
