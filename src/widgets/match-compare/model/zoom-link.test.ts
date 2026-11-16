import { describe, expect, it } from "vitest"

import { linkPoint, viewToRatio } from "./zoom-link"

const crime = {
  width: 1000,
  height: 1500,
  zones: { x: [230, 770] as const, top: 80, bounds: [540, 960] as const, bottom: 1400 },
}
const shoe = {
  width: 400,
  height: 1056,
  zones: { x: [-16, 416] as const, top: 0, bounds: [368, 704] as const, bottom: 1056 },
}

describe("linkPoint — 상 · 중 · 하 위치 비율이 같은 자리로", () => {
  it("구역 경계는 구역 경계로, 구역 가운데는 구역 가운데로", () => {
    const b = linkPoint({ x: 0.5, y: 540 / 1500 }, crime, shoe)
    expect(b.y * 1056).toBeCloseTo(368)
    expect(b.x).toBeCloseTo(0.5)
    const mid = linkPoint({ x: 0.5, y: 750 / 1500 }, crime, shoe)
    expect(mid.y * 1056).toBeCloseTo(536)
  })

  it("구역 선이 없으면 비율 그대로 · 범위 밖은 0~1 로 자름", () => {
    expect(linkPoint({ x: 0.3, y: 0.7 }, { width: 10, height: 10 }, shoe)).toEqual({ x: 0.3, y: 0.7 })
    expect(linkPoint({ x: 0, y: 1 }, crime, shoe).y).toBe(1)
  })
})

describe("viewToRatio — 회전 · 확대를 되돌린 그림 비율", () => {
  it("회전 · 확대 없으면 상자 비율, 확대 기준점은 그대로 남는다", () => {
    expect(viewToRatio(50, 25, { width: 100, height: 100 }, 0)).toEqual({ x: 0.5, y: 0.25 })
    const o = { x: 0.3, y: 0.6 }
    const r = viewToRatio(30, 60, { width: 100, height: 100 }, 0, { origin: o, scale: 3 })
    expect(r.x).toBeCloseTo(0.3)
    expect(r.y).toBeCloseTo(0.6)
  })

  it("180° 돌린 그림은 반대쪽 자리", () => {
    const r = viewToRatio(10, 20, { width: 100, height: 100 }, 180)
    expect(r.x).toBeCloseTo(0.9)
    expect(r.y).toBeCloseTo(0.8)
  })
})
