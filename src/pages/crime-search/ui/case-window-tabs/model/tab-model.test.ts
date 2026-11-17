import { describe, expect, it } from "vitest"

import type { Crime } from "@/entities/crime"

import { caseImagesOf, imageSeqOf, pickImage } from "./resolve-image"
import { isRatioScale, toPercentList } from "./similarity-scale"
import { caseFormOf, pickDtLabel, zonePatternsOf, zonesOf } from "./tab-values"

const crime = (aprthngNo: string, extra: Partial<Crime> = {}): Crime => ({
  aprthngNo,
  apprslReqestNo: aprthngNo.split("_")[0],
  top: [],
  mid: [],
  bottom: [],
  outline: [],
  ...extra,
})

const DATA = [crime("05019-24-0017_10"), crime("05019-24-0017_2"), crime("00001-25-0649_1"), crime("05019-24-0017_1")]

describe("resolve-image — 사건 번호 · 이미지 번호를 감정물 레코드로", () => {
  it("감정의뢰번호면 그 의뢰의 감정물을 순번 숫자 순서로", () => {
    expect(caseImagesOf(DATA, "05019-24-0017").map((c) => c.aprthngNo)).toEqual([
      "05019-24-0017_1",
      "05019-24-0017_2",
      "05019-24-0017_10",
    ])
  })

  it("감정물 번호 하나를 줘도 그 의뢰 묶음으로 푼다", () => {
    expect(caseImagesOf(DATA, "05019-24-0017_2")).toHaveLength(3)
    expect(caseImagesOf(DATA, "없는번호")).toEqual([])
  })

  it("이미지 번호는 전체 번호 · 뒤 순번 둘 다, 없으면 첫 장", () => {
    const images = caseImagesOf(DATA, "05019-24-0017")
    expect(pickImage(images, "05019-24-0017", "05019-24-0017_10")?.aprthngNo).toBe("05019-24-0017_10")
    expect(pickImage(images, "05019-24-0017", "2")?.aprthngNo).toBe("05019-24-0017_2")
    expect(pickImage(images, "05019-24-0017", null)?.aprthngNo).toBe("05019-24-0017_1")
    expect(imageSeqOf("05019-24-0017_05")).toBe("05")
  })
})

describe("similarity-scale — 유사도를 퍼센트로", () => {
  it("퍼센트 목록은 그대로", () => {
    const list = [{ similarity: 69.99 }, { similarity: "55.1" }]
    expect(isRatioScale(list.map((i) => i.similarity))).toBe(false)
    expect(toPercentList(list)).toEqual(list)
  })

  it("모두 1 이하(비율)면 ×100", () => {
    expect(toPercentList([{ similarity: 0.7 }, { similarity: "0.555" }])).toEqual([{ similarity: 70 }, { similarity: 55.5 }])
  })
})

describe("tab-values — 레코드 → 위젯 값", () => {
  it("사건 정보 폼: 채취 일시 KST 글자 그대로 자르고, 이미지 번호는 끝 순번(문자열)", () => {
    expect(pickDtLabel("2024-07-24T09:12:33")).toBe("2024-07-24 09:12")
    expect(pickDtLabel(null)).toBe("")
    const form = caseFormOf(crime("05019-24-0017_05", { crimeNm: "절도", pickDt: null }))
    expect(form).toMatchObject({ apprslReqestNo: "05019-24-0017", aprthngSn: "05", crimeNm: "절도", pickDt: "", rqestGrfcNm: "" })
  })

  it("문양: crime 튜플은 그대로, 아이콘은 이름 기준으로 경로를 한 번만 붙인다", () => {
    const c = crime("a_1", { top: [["/src/assets/Patterns/전체/s21b.png", 1]], mid: ["/src/assets/Patterns/선/n32_04.png"] })
    const zones = zonesOf(c)
    expect(zones.top).toEqual([["/src/assets/Patterns/전체/s21b.png", 1]])
    expect(zones.mid).toEqual([["/src/assets/Patterns/선/n32_04.png", 0]])
    const icons = zonePatternsOf({ top: ["s21b"], mid: c.mid })
    expect(icons.top).toEqual([{ name: "s21b", src: "/src/assets/Patterns/전체/s21b.png" }])
    expect(icons.mid[0].name).toBe("n32_04")
    expect(icons.outline).toEqual([])
  })
})
