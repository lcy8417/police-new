import { describe, expect, it } from "vitest"

import { SAMPLE_PHOTOS, SAMPLE_SHOES_WITH_IMAGE, sampleIndex, samplePhotoUrl, sampleShoe, sampleSoleUrl } from "./sample-images"
import { SAMPLE_SHOES } from "./sample-shoes"

describe("sample-images", () => {
  it("표본 신발 40켤레가 모두 그림 glob 번호 목록에 있다(두 목록 짝)", () => {
    expect(SAMPLE_SHOES).toHaveLength(40)
    expect(SAMPLE_SHOES_WITH_IMAGE.map((s) => s.ftwrId)).toEqual(SAMPLE_SHOES.map((s) => s.ftwrId))
  })

  it("같은 사건의 1 · 2 장은 이웃 자리, 같은 열쇠는 같은 자리", () => {
    const a = sampleIndex("00001-25-0649_1", 60)
    expect(sampleIndex("00001-25-0649_2", 60)).toBe((a + 1) % 60)
    expect(sampleIndex("00001-25-0649_1", 60)).toBe(a)
    expect(sampleIndex(-1, 60)).toBe(59)
    expect(sampleIndex("x", 0)).toBe(-1)
  })

  it("테스트에서는 현장 사진을 쓰지 않아 가짜 그림이 나온다", () => {
    expect(SAMPLE_PHOTOS).toHaveLength(0)
    expect(samplePhotoUrl("00001-25-0649_1", { tag: "1" })).toMatch(/^data:image\/svg\+xml/)
    expect(sampleSoleUrl("00001-25-0649_1", { kind: "scene" })).toMatch(/^data:image\/svg\+xml/)
  })

  it("표본 번호면 그 신발, 아니면 번호마다 고정된 표본 신발", () => {
    expect(sampleShoe("205078")?.ftwrGroupNm).toBe("CONVERSE (컨버스)-001")
    expect(sampleShoe("303349")?.ftwrId).toBe(sampleShoe("303349")?.ftwrId)
    expect(sampleSoleUrl("205078")).toContain("B205078")
    // 이진화본은 캔버스가 없는 테스트에서 가짜 그림
    expect(sampleSoleUrl("205078", { kind: "bin" })).toMatch(/^data:image\/svg\+xml/)
  })
})
