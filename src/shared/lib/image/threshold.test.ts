import { describe, it, expect } from "vitest"

import {
  buildGammaLut,
  clampByte,
  luminance,
  thresholdByte,
  type ThresholdMode,
} from "./threshold"

describe("clampByte", () => {
  it("rounds and clamps into 0..255", () => {
    expect(clampByte(-5)).toBe(0)
    expect(clampByte(300)).toBe(255)
    expect(clampByte(127.6)).toBe(128)
    expect(clampByte(127.4)).toBe(127)
  })
})

describe("buildGammaLut", () => {
  it("is a 256-entry ramp with fixed endpoints", () => {
    const lut = buildGammaLut(2)
    expect(lut).toHaveLength(256)
    expect(lut[0]).toBe(0)
    expect(lut[255]).toBe(255)
  })

  it("gamma = 1 is the identity ramp", () => {
    const lut = buildGammaLut(1)
    expect(lut[0]).toBe(0)
    expect(lut[128]).toBe(128)
    expect(lut[255]).toBe(255)
  })

  it("is monotonically non-decreasing", () => {
    const lut = buildGammaLut(1.8)
    for (let i = 1; i < 256; i++) {
      expect(lut[i]).toBeGreaterThanOrEqual(lut[i - 1])
    }
  })

  it("gamma > 1 lifts mid-tones, gamma < 1 deepens them", () => {
    expect(buildGammaLut(2)[64]).toBeGreaterThan(64)
    expect(buildGammaLut(0.5)[64]).toBeLessThan(64)
  })
})

describe("luminance", () => {
  it("returns the Rec.601 luma", () => {
    expect(luminance(255, 255, 255)).toBeCloseTo(255)
    expect(luminance(0, 0, 0)).toBe(0)
    expect(luminance(255, 0, 0)).toBeCloseTo(76.245)
  })
})

describe("thresholdByte", () => {
  // OpenCV THRESH_*의 정확한 의미(strict `>`, maxval=255)를 경계값으로 검증한다.
  // 경계 픽셀(gray === t)은 "초과 아님"으로 처리된다.
  const t = 127
  const grays = [0, t - 1, t, t + 1, 255]

  it("standard(BINARY): gray > t ? 255 : 0", () => {
    const mode: ThresholdMode = "standard"
    expect(grays.map((g) => thresholdByte(g, t, mode))).toEqual([0, 0, 0, 255, 255])
  })

  it("standard_inv(BINARY_INV): gray > t ? 0 : 255", () => {
    const mode: ThresholdMode = "standard_inv"
    expect(grays.map((g) => thresholdByte(g, t, mode))).toEqual([255, 255, 255, 0, 0])
  })

  it("trunc(TRUNC): gray > t ? t : gray", () => {
    const mode: ThresholdMode = "trunc"
    expect(grays.map((g) => thresholdByte(g, t, mode))).toEqual([0, t - 1, t, t, t])
  })

  it("tozero(TOZERO): gray > t ? gray : 0", () => {
    const mode: ThresholdMode = "tozero"
    expect(grays.map((g) => thresholdByte(g, t, mode))).toEqual([0, 0, 0, t + 1, 255])
  })

  it("tozero_inv(TOZERO_INV): gray > t ? 0 : gray", () => {
    const mode: ThresholdMode = "tozero_inv"
    expect(grays.map((g) => thresholdByte(g, t, mode))).toEqual([0, t - 1, t, 0, 0])
  })
})
