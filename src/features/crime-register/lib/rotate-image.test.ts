import { describe, it, expect } from "vitest"

import { rotatedBounds } from "./rotate-image"

describe("rotatedBounds", () => {
  it("is unchanged at 0° and 180°", () => {
    expect(rotatedBounds(100, 50, 0)).toEqual({ width: 100, height: 50 })
    expect(rotatedBounds(100, 50, 180)).toEqual({ width: 100, height: 50 })
  })

  it("swaps width/height at 90°", () => {
    expect(rotatedBounds(100, 50, 90)).toEqual({ width: 50, height: 100 })
  })

  it("grows to the diagonal bounding box at 45°", () => {
    // 100·cos45 + 100·sin45 ≈ 141.42 → 141
    expect(rotatedBounds(100, 100, 45)).toEqual({ width: 141, height: 141 })
  })

  it("is symmetric for negative angles", () => {
    expect(rotatedBounds(120, 80, -30)).toEqual(rotatedBounds(120, 80, 30))
  })
})
