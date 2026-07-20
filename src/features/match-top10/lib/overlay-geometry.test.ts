import { describe, expect, it } from "vitest"

import { scaleBoxToDisplay, scalePointToDisplay } from "./overlay-geometry"

describe("scalePointToDisplay — 원본 픽셀 좌표 → 표시 좌표 스케일", () => {
  it("정사각 축소(1000→500, scale 0.5) 시 좌표를 절반으로 스케일한다", () => {
    const [x, y] = scalePointToDisplay(
      [200, 400],
      { width: 1000, height: 1000 },
      { width: 500, height: 500 }
    )
    expect(x).toBe(100)
    expect(y).toBe(200)
  })

  it("x/y 축소율이 다른 경우(비정사각) 각 축을 독립적으로 스케일한다", () => {
    const [x, y] = scalePointToDisplay(
      [800, 300],
      { width: 800, height: 600 },
      { width: 400, height: 150 }
    )
    // scaleX = 400/800 = 0.5, scaleY = 150/600 = 0.25
    expect(x).toBe(400)
    expect(y).toBe(75)
  })

  it("원본 크기가 0(미측정)이면 NaN/Infinity 대신 0을 반환한다", () => {
    const [x, y] = scalePointToDisplay([10, 10], { width: 0, height: 0 }, { width: 500, height: 500 })
    expect(x).toBe(0)
    expect(y).toBe(0)
  })

  it("확대(scale 2) 시 좌표가 두 배로 커진다", () => {
    const [x, y] = scalePointToDisplay(
      [50, 25],
      { width: 100, height: 100 },
      { width: 200, height: 200 }
    )
    expect(x).toBe(100)
    expect(y).toBe(50)
  })
})

describe("scaleBoxToDisplay — 대응점 중심 고정 크기 박스의 표시 좌표(left/top/width/height)", () => {
  it("scale 0.5에서 중심(200,400)·boxSize 96 박스는 표시 48×48, 중심 기준 좌상단으로 이동한다", () => {
    const rect = scaleBoxToDisplay(
      [200, 400],
      96,
      { width: 1000, height: 1000 },
      { width: 500, height: 500 }
    )
    expect(rect.width).toBe(48)
    expect(rect.height).toBe(48)
    // 표시 중심 = (100, 200) → left = 100 - 24 = 76, top = 200 - 24 = 176
    expect(rect.left).toBe(76)
    expect(rect.top).toBe(176)
  })

  it("scale 1(원본=표시)에서 박스 크기는 boxSize와 동일하다", () => {
    const rect = scaleBoxToDisplay(
      [10, 10],
      96,
      { width: 300, height: 300 },
      { width: 300, height: 300 }
    )
    expect(rect.width).toBe(96)
    expect(rect.height).toBe(96)
    expect(rect.left).toBe(10 - 48)
    expect(rect.top).toBe(10 - 48)
  })

  it("x/y 축소율이 다른 경우 박스의 폭/높이도 축별로 독립 스케일된다(정사각이 유지되지 않을 수 있음)", () => {
    const rect = scaleBoxToDisplay(
      [400, 300],
      96,
      { width: 800, height: 600 },
      { width: 400, height: 150 }
    )
    // scaleX=0.5 → width 48, scaleY=0.25 → height 24
    expect(rect.width).toBe(48)
    expect(rect.height).toBe(24)
  })
})
