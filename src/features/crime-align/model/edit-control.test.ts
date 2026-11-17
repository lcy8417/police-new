import { describe, expect, it, vi } from "vitest"

import { alignEditControl } from "./edit-control"
import type { UseAlignment } from "./use-alignment"

// 판 안 정렬 지정 도구 막대 묶음 — 훅 값 · 동작을 그대로 옮기는지

function fake(over: Partial<UseAlignment> = {}): UseAlignment {
  const fn = () => vi.fn()
  return {
    phase: "polygon",
    drawMode: "scratch",
    polygon: [
      [1, 1],
      [2, 2],
      [3, 1],
    ],
    toe: null,
    heel: null,
    arrow: [],
    arrowStep: "toe",
    flipHorizontal: false,
    addPoint: fn(),
    closePolygon: fn(),
    removeLastPoint: fn(),
    seedTemplate: fn(),
    startFromScratch: fn(),
    moveWholeShape: fn(),
    moveVertexAt: fn(),
    pickArrowPoint: fn(),
    clearArrowPoint: fn(),
    toggleFlip: fn(),
    reset: fn(),
    startRect: fn(),
    startTemplate: fn(),
    setRectangle: fn(),
    dragVertex: fn(),
    dragShape: fn(),
    clearArrow: fn(),
    restart: fn(),
    discard: fn(),
    save: vi.fn(async () => undefined),
    isSaving: false,
    isLoading: false,
    isAligned: false,
    canClosePolygon: true,
    canSave: false,
    ...over,
  }
}

describe("alignEditControl", () => {
  it("값: 점 수 · 닫기 가능(점 찍기 영역 단계에서만) · 저장 가능 · 반전", () => {
    const c = alignEditControl(fake())
    expect(c).toMatchObject({ phase: "polygon", drawMode: "scratch", pointCount: 3, canClose: true, canSave: false, flip: false })
    expect(alignEditControl(fake({ drawMode: "template" })).canClose).toBe(false)
    expect(alignEditControl(fake({ phase: "arrow" })).canClose).toBe(false)
  })

  it("동작: 그리기 방식 → 점 찍기 · 사각형 · 밑창 틀 시작, 나머지는 훅 함수 그대로", () => {
    const a = fake()
    const c = alignEditControl(a)
    c.onDrawMode("scratch")
    c.onDrawMode("rect")
    c.onDrawMode("template")
    expect(a.startFromScratch).toHaveBeenCalledTimes(1)
    expect(a.startRect).toHaveBeenCalledTimes(1)
    expect(a.startTemplate).toHaveBeenCalledTimes(1)
    expect(c.onClose).toBe(a.closePolygon)
    expect(c.onUndo).toBe(a.removeLastPoint)
    expect(c.onRestart).toBe(a.restart)
    expect(c.onRedoArrow).toBe(a.clearArrow)
    expect(c.onFlip).toBe(a.toggleFlip)
    expect(c.onCancel).toBe(a.discard)
  })
})
