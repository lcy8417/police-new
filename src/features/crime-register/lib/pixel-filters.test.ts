import { describe, it, expect } from "vitest"

import {
  DEFAULT_ADJUSTMENTS,
  type Adjustments,
  binarizeByte,
  buildCssFilter,
  buildGammaLut,
  clampByte,
  isIdentityAdjustments,
  luminance,
} from "./pixel-filters"

const with_ = (patch: Partial<Adjustments>): Adjustments => ({ ...DEFAULT_ADJUSTMENTS, ...patch })

describe("buildCssFilter", () => {
  it("emits neutral brightness+contrast for the default adjustments", () => {
    expect(buildCssFilter(DEFAULT_ADJUSTMENTS)).toBe("brightness(100%) contrast(100%)")
  })

  it("maps the -100..100 sliders onto CSS percentages", () => {
    expect(buildCssFilter(with_({ brightness: -100 }))).toBe("brightness(0%) contrast(100%)")
    expect(buildCssFilter(with_({ contrast: 100 }))).toBe("brightness(100%) contrast(200%)")
  })

  it("appends grayscale before invert when toggled", () => {
    expect(buildCssFilter(with_({ grayscale: true }))).toBe(
      "brightness(100%) contrast(100%) grayscale(1)"
    )
    expect(buildCssFilter(with_({ grayscale: true, invert: true }))).toBe(
      "brightness(100%) contrast(100%) grayscale(1) invert(1)"
    )
  })
})

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

describe("binarizeByte", () => {
  it("splits at the threshold, inclusive of the threshold value", () => {
    expect(binarizeByte(200, 127)).toBe(255)
    expect(binarizeByte(100, 127)).toBe(0)
    expect(binarizeByte(127, 127)).toBe(255)
  })
})

describe("isIdentityAdjustments", () => {
  it("is true only for the neutral default", () => {
    expect(isIdentityAdjustments(DEFAULT_ADJUSTMENTS)).toBe(true)
  })

  it("is false once any field moves — including a 0 threshold (0 !== null)", () => {
    expect(isIdentityAdjustments(with_({ brightness: 1 }))).toBe(false)
    expect(isIdentityAdjustments(with_({ gamma: 1.2 }))).toBe(false)
    expect(isIdentityAdjustments(with_({ threshold: 0 }))).toBe(false)
    expect(isIdentityAdjustments(with_({ invert: true }))).toBe(false)
    expect(isIdentityAdjustments(with_({ grayscale: true }))).toBe(false)
  })
})
