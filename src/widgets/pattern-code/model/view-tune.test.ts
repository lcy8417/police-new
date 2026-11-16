import { describe, expect, it } from "vitest"

import { DEFAULT_VIEW_TUNE, lensOffset, LENS_MAX, LENS_MIN, stepLens, stepTune, viewTuneClass, viewTuneLabels } from "./view-tune"

describe("viewTuneClass · viewTuneLabels", () => {
  it("기본은 빈 클래스 · 빈 꼬리표", () => {
    expect(viewTuneClass(DEFAULT_VIEW_TUNE)).toEqual({ outer: "", inner: "" })
    expect(viewTuneLabels(DEFAULT_VIEW_TUNE)).toEqual([])
  })

  it("대비 · 밝기 · 반전은 안쪽 겹, 감마는 바깥 겹", () => {
    const t = { ...DEFAULT_VIEW_TUNE, contrast: 2, brightness: -1, gamma: 1, invert: true } as const
    expect(viewTuneClass(t)).toEqual({ outer: "brightness-[1.09] contrast-[.94]", inner: "brightness-75 contrast-150 invert" })
    expect(viewTuneLabels(t)).toEqual(["대비 +2", "밝기 −1", "감마 1.25", "반전"])
  })

  it("이진화를 켜면 대비 걸음 대신 이진화가 대비를 맡는다", () => {
    const t = { ...DEFAULT_VIEW_TUNE, contrast: 1, binary: true } as const
    expect(viewTuneClass(t).inner).toBe("grayscale contrast-[8]")
    expect(viewTuneLabels(t)).toEqual(["이진화"])
  })
})

describe("걸음 · 확대경", () => {
  it("stepTune 은 −2 ~ +2 에서 멈춘다", () => {
    expect(stepTune(2, 1)).toBe(2)
    expect(stepTune(-2, -1)).toBe(-2)
    expect(stepTune(0, 1)).toBe(1)
  })

  it("stepLens 는 범위 안에서 24px 씩", () => {
    expect(stepLens(144, 1)).toBe(168)
    expect(stepLens(LENS_MAX, 1)).toBe(LENS_MAX)
    expect(stepLens(LENS_MIN, -1)).toBe(LENS_MIN)
  })

  it("lensOffset — 마우스 자리가 원 한가운데(정수)", () => {
    expect(lensOffset(100, 50, 2, 144)).toEqual({ left: -128, top: -28 })
    expect(lensOffset(10.4, 10.4, 3, 100)).toEqual({ left: 19, top: 19 })
  })
})
