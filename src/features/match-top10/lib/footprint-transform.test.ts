import { describe, expect, it } from "vitest"

import {
  applySceneCropTransform,
  boundingBoxOfPolygon,
  centerToCropRegion,
  normalizeShoeBoxSize,
  normalizeShoePoint,
} from "./footprint-transform"

describe("boundingBoxOfPolygon — 정렬 폴리곤의 축정렬 경계상자(원본 픽셀 좌표)", () => {
  it("사각형 폴리곤의 좌상단/폭/높이를 정확히 계산한다", () => {
    const rect = boundingBoxOfPolygon([
      [100, 200],
      [300, 200],
      [300, 500],
      [100, 500],
    ])
    expect(rect).toEqual({ left: 100, top: 200, width: 200, height: 300 })
  })

  it("정점이 임의 순서(볼록/오목 무관)여도 min/max로 경계상자를 구한다", () => {
    const rect = boundingBoxOfPolygon([
      [50, 400],
      [10, 100],
      [300, 250],
      [150, 50],
    ])
    expect(rect).toEqual({ left: 10, top: 50, width: 290, height: 350 })
  })

  it("빈 배열이면 0크기 경계상자를 반환한다(크래시 대신 안전한 기본값)", () => {
    expect(boundingBoxOfPolygon([])).toEqual({ left: 0, top: 0, width: 0, height: 0 })
  })
})

describe("applySceneCropTransform — 대응점(fx,fy)을 크롭 로컬 좌표로 환산(오프셋 뺄셈 + 선택적 미러)", () => {
  const crop = { left: 100, top: 200, width: 400 }

  it("반전 없음: 크롭 원점만큼 뺀 좌표를 반환한다", () => {
    const [x, y] = applySceneCropTransform([150, 260], crop, false)
    expect(x).toBe(50)
    expect(y).toBe(60)
  })

  it("반전 있음: x를 크롭 폭 기준으로 미러링한다(y는 불변)", () => {
    // 로컬 x = 150-100 = 50 → 미러 = 400-50 = 350
    const [x, y] = applySceneCropTransform([150, 260], crop, true)
    expect(x).toBe(350)
    expect(y).toBe(60)
  })

  it("크롭 좌상단 모서리 점은 반전 없이 (0,0), 반전 시 (width,0)로 이동한다", () => {
    expect(applySceneCropTransform([100, 200], crop, false)).toEqual([0, 0])
    expect(applySceneCropTransform([100, 200], crop, true)).toEqual([400, 0])
  })

  it("결합 라운드트립: 반전을 두 번 적용하면(미러의 대합 성질) 원래 로컬 좌표로 돌아온다", () => {
    const local = applySceneCropTransform([150, 260], crop, false) // [50, 60]
    const mirroredOnce = applySceneCropTransform([150, 260], crop, true) // [350, 60]
    // mirroredOnce를 다시 같은 폭 기준으로 미러링하면 local과 같아야 한다(대합).
    const mirroredTwice: [number, number] = [crop.width - mirroredOnce[0], mirroredOnce[1]]
    expect(mirroredTwice).toEqual(local)
  })
})

describe("centerToCropRegion — 중심점+한 변 크기를 크롭 영역(left/top/width/height)으로", () => {
  it("중심(100,100)·size 96 → left/top은 중심에서 48을 뺀 값", () => {
    const region = centerToCropRegion([100, 100], 96)
    expect(region).toEqual({ left: 52, top: 52, width: 96, height: 96 })
  })
})

describe("normalizeShoePoint — Shoerinsics 좌표계를 대상(RGB 등) 표시 이미지의 원본 픽셀 좌표계로 정규화", () => {
  it("측정된 실측값(Shoerinsics 300x756 → B 1280x3224)으로 상대 0..1 정규화 후 대상 크기를 곱한다", () => {
    const source = { width: 300, height: 756 }
    const target = { width: 1280, height: 3224 }
    const [x, y] = normalizeShoePoint([150, 378], source, target)
    // 150/300=0.5 → 0.5*1280=640, 378/756=0.5 → 0.5*3224=1612
    expect(x).toBeCloseTo(640, 5)
    expect(y).toBeCloseTo(1612, 5)
  })

  it("source와 target이 동일하면 항등 변환이다(스케치/이진 모드 — 표시 이미지가 곧 Shoerinsics)", () => {
    const size = { width: 300, height: 756 }
    const [x, y] = normalizeShoePoint([42, 99], size, size)
    expect(x).toBeCloseTo(42, 5)
    expect(y).toBeCloseTo(99, 5)
  })

  it("source 폭/높이가 0(미측정)이면 NaN/Infinity 대신 0을 반환한다", () => {
    const [x, y] = normalizeShoePoint([10, 10], { width: 0, height: 0 }, { width: 500, height: 500 })
    expect(x).toBe(0)
    expect(y).toBe(0)
  })
})

describe("normalizeShoeBoxSize — 박스 한 변(size)을 대상 이미지 축척으로 정규화", () => {
  it("96px 박스(Shoerinsics 300폭 기준)를 B(1280폭) 기준으로 정규화하면 폭 비율만큼 커진다", () => {
    const size = normalizeShoeBoxSize(96, { width: 300, height: 756 }, { width: 1280, height: 3224 })
    // 96 * (1280/300) = 409.6
    expect(size).toBeCloseTo(409.6, 5)
  })

  it("source와 target이 같으면 원래 크기를 그대로 반환한다", () => {
    const same = { width: 300, height: 756 }
    expect(normalizeShoeBoxSize(96, same, same)).toBeCloseTo(96, 5)
  })
})
