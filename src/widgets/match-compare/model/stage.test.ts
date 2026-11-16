import { describe, expect, it } from "vitest"

import { containPoint, crimeToStage, shoeToStage, STAGE, STAGE_W } from "./stage"

describe("stage — 유류 | 발견 고정 배치 좌표", () => {
  it("무대 폭은 245 + 10 + 205 = 460", () => {
    expect(STAGE_W).toBe(460)
  })

  it("object-contain: 세로가 꽉 차면 가로 가운데로 맞춘다", () => {
    // 100×264 그림을 205×340 칸에: 배율 340/264, 폭 128.8 → 왼쪽 여백 38.1
    const [x, y] = containPoint({ w: 205, h: 340 }, { width: 100, height: 264 }, 0, 264)
    expect(x).toBeCloseTo((205 - 100 * (340 / 264)) / 2, 5)
    expect(y).toBeCloseTo(340, 5)
  })

  it("신발 칸 좌표는 유류 칸 폭 + 틈만큼 오른쪽으로 민다", () => {
    const image = { width: 400, height: 1056 }
    const [sx] = shoeToStage(image, 0, 0)
    const [px] = containPoint({ w: STAGE.shoeW, h: STAGE.h }, image, 0, 0)
    expect(sx).toBeCloseTo(STAGE.crimeW + STAGE.gap + px, 5)
    const [cx, cy] = crimeToStage({ width: 1000, height: 1500 }, 500, 750)
    expect(cx).toBeCloseTo(STAGE.crimeW / 2, 5)
    expect(cy).toBeCloseTo(STAGE.h / 2, 5)
  })
})
