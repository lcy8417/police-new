import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

import type { Point } from "../lib/alignment-geometry"
import { AlignmentDrawCanvas, AlignmentDrawSurface, type AlignmentDrawHandle } from "./AlignmentDrawCanvas"

// 판 안 정렬 지정 캔버스 — 누름 · 끌기 · 키를 훅 함수로 옮기는지(좌표 환산은 훅 몫이라 여기서는 넘기는 값만 본다).
// 그림 자연 크기 200×300, 표시 상자 100×150(배율 2) — 표시 좌표 = 저장 좌표 / 2.

const NATURAL = { width: 200, height: 300 }
const BOX = { left: 0, top: 0, width: 100, height: 150, right: 100, bottom: 150, x: 0, y: 0, toJSON: () => ({}) }

const originalWidth = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, "naturalWidth")
const originalHeight = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, "naturalHeight")
const originalRect = HTMLImageElement.prototype.getBoundingClientRect

beforeAll(() => {
  Object.defineProperty(HTMLImageElement.prototype, "naturalWidth", { configurable: true, get: () => NATURAL.width })
  Object.defineProperty(HTMLImageElement.prototype, "naturalHeight", { configurable: true, get: () => NATURAL.height })
  HTMLImageElement.prototype.getBoundingClientRect = () => BOX as DOMRect
})
afterAll(() => {
  if (originalWidth) Object.defineProperty(HTMLImageElement.prototype, "naturalWidth", originalWidth)
  if (originalHeight) Object.defineProperty(HTMLImageElement.prototype, "naturalHeight", originalHeight)
  HTMLImageElement.prototype.getBoundingClientRect = originalRect
})

function handle(over: Partial<AlignmentDrawHandle> = {}): AlignmentDrawHandle {
  return {
    phase: "polygon",
    drawMode: "scratch",
    polygon: [],
    arrow: [],
    arrowStep: "toe",
    flipHorizontal: false,
    canClosePolygon: false,
    seedTemplate: vi.fn(),
    addPoint: vi.fn(),
    closePolygon: vi.fn(),
    removeLastPoint: vi.fn(),
    setRectangle: vi.fn(),
    dragVertex: vi.fn(),
    dragShape: vi.fn(),
    pickArrowPoint: vi.fn(),
    ...over,
  }
}

/** 그림을 읽힌 뒤 입력 표면 */
function setup(align: AlignmentDrawHandle) {
  const view = render(
    <div className="h-[300px] w-[300px]">
      <AlignmentDrawSurface src="/scene.png" align={align} />
    </div>
  )
  fireEvent.load(screen.getByRole("img", { name: "정렬용 저장 현장 이미지" }))
  return { surface: screen.getByTestId("alignment-draw-surface"), ...view }
}

const press = (el: HTMLElement, x: number, y: number) => {
  fireEvent.pointerDown(el, { button: 0, clientX: x, clientY: y, pointerId: 1 })
  fireEvent.pointerUp(el, { button: 0, clientX: x, clientY: y, pointerId: 1 })
}
const drag = (el: HTMLElement, from: Point, to: Point) => {
  fireEvent.pointerDown(el, { button: 0, clientX: from[0], clientY: from[1], pointerId: 1 })
  fireEvent.pointerMove(el, { clientX: (from[0] + to[0]) / 2, clientY: (from[1] + to[1]) / 2, pointerId: 1 })
  fireEvent.pointerMove(el, { clientX: to[0], clientY: to[1], pointerId: 1 })
  fireEvent.pointerUp(el, { button: 0, clientX: to[0], clientY: to[1], pointerId: 1 })
}

/** 저장 좌표 삼각형(표시 (10,10) · (60,10) · (60,60)) */
const TRIANGLE: Point[] = [
  [20, 20],
  [120, 20],
  [120, 120],
]
/** 저장 좌표 네모(표시 (10,10)~(80,120)) */
const SQUARE: Point[] = [
  [20, 20],
  [160, 20],
  [160, 240],
  [20, 240],
]

describe("AlignmentDrawSurface — 점 찍기(11/17 「폴리곤 치기 좀 쉽게」)", () => {
  it("그림을 읽으면 자연 크기를 훅에 알린다(밑창 틀 시드)", () => {
    const align = handle()
    setup(align)
    expect(align.seedTemplate).toHaveBeenCalledWith(200, 300)
  })

  it("누르면 점(클릭 좌표 · 그림 상자 · 자연 폭을 그대로 훅에) — 마지막 점 바로 옆을 또 누르면 겹점을 넣지 않는다", () => {
    const align = handle({ polygon: [[20, 20]] })
    const { surface } = setup(align)
    press(surface, 50, 40)
    expect(align.addPoint).toHaveBeenCalledWith(50, 40, expect.objectContaining({ width: 100, height: 150 }), 200)
    press(surface, 12, 11) // 마지막 점(표시 10,10) 바로 옆 — 두 번 누름의 두 번째
    expect(align.addPoint).toHaveBeenCalledTimes(1)
  })

  it("3점 이상이면 첫 점(고리)을 누르거나 두 번 누름 · Enter 로 닫는다", () => {
    const align = handle({ polygon: TRIANGLE, canClosePolygon: true })
    const { surface } = setup(align)
    press(surface, 11, 12)
    expect(align.closePolygon).toHaveBeenCalledTimes(1)
    expect(align.addPoint).not.toHaveBeenCalled()
    fireEvent.doubleClick(surface)
    expect(align.closePolygon).toHaveBeenCalledTimes(2)
    fireEvent.keyDown(window, { key: "Enter" })
    expect(align.closePolygon).toHaveBeenCalledTimes(3)
  })

  it("Backspace(Delete) = 마지막 점 지우기 — 글자 칸에서는 듣지 않는다", () => {
    const align = handle({ polygon: TRIANGLE, canClosePolygon: true })
    setup(align)
    fireEvent.keyDown(window, { key: "Backspace" })
    expect(align.removeLastPoint).toHaveBeenCalledTimes(1)
    const input = document.createElement("input")
    document.body.appendChild(input)
    fireEvent.keyDown(input, { key: "Backspace" })
    expect(align.removeLastPoint).toHaveBeenCalledTimes(1)
    input.remove()
  })

  it("점을 끌면 그 점만 옮긴다(dragVertex) — 새 점은 넣지 않는다", () => {
    const align = handle({ polygon: TRIANGLE, canClosePolygon: true })
    const { surface } = setup(align)
    drag(surface, [60, 10], [70, 30]) // 두 번째 점(표시 60,10)
    expect(align.dragVertex).toHaveBeenLastCalledWith(1, 70, 30, expect.objectContaining({ width: 100 }), 200)
    expect(align.addPoint).not.toHaveBeenCalled()
  })
})

describe("AlignmentDrawSurface — 사각형 · 닫힌 틀 · 방향", () => {
  it("사각형: 끌면 두 모서리 클릭 좌표로 네모(setRectangle), 조금만 끌면 아무것도", () => {
    const align = handle({ drawMode: "rect" })
    const { surface } = setup(align)
    drag(surface, [10, 20], [70, 120])
    expect(align.setRectangle).toHaveBeenCalledWith(10, 20, 70, 120, expect.objectContaining({ width: 100 }), 200)
    drag(surface, [10, 20], [13, 22])
    expect(align.setRectangle).toHaveBeenCalledTimes(1)
  })

  it("닫힌 틀: 안쪽을 끌면 통째로(dragShape), 끌지 않고 누르면 앞굽 — 방향 단계는 뒤꿈치", () => {
    const align = handle({ drawMode: "template", polygon: SQUARE })
    const { surface } = setup(align)
    drag(surface, [40, 60], [50, 70])
    expect(align.dragShape).toHaveBeenCalled()
    expect(align.pickArrowPoint).not.toHaveBeenCalled()
    press(surface, 40, 30)
    expect(align.pickArrowPoint).toHaveBeenCalledWith("toe", 40, 30, expect.objectContaining({ width: 100 }), 200)
  })

  it("방향 단계: 누르면 다음 점(뒤꿈치), 저장 대기(review)에서는 누름이 방향을 바꾸지 않는다", () => {
    const align = handle({ drawMode: "scratch", phase: "arrow", arrowStep: "heel", polygon: SQUARE, arrow: [[60, 40]] })
    const { surface, unmount } = setup(align)
    press(surface, 40, 130)
    expect(align.pickArrowPoint).toHaveBeenCalledWith("heel", 40, 130, expect.anything(), 200)
    unmount()
    const done = handle({ phase: "review", arrowStep: "complete", drawMode: "template", polygon: SQUARE, arrow: [[60, 40], [60, 200]] })
    const again = setup(done)
    press(again.surface, 40, 60)
    expect(done.pickArrowPoint).not.toHaveBeenCalled()
    // 저장된 정렬도 점을 끌어 고친다(단계와 무관)
    drag(again.surface, [80, 10], [90, 20])
    expect(done.dragVertex).toHaveBeenCalledWith(1, 90, 20, expect.anything(), 200)
  })

  it("앞굽 · 뒤꿈치 표시와 화살표", () => {
    setup(handle({ phase: "review", arrowStep: "complete", drawMode: "template", polygon: SQUARE, arrow: [[60, 40], [60, 200]] }))
    expect(screen.getByText("앞굽")).toBeInTheDocument()
    expect(screen.getByText("뒤꿈치")).toBeInTheDocument()
    expect(document.querySelector("[data-align-shape]")).not.toBeNull()
  })

  it("좌우 반전 미리보기 중에는 입력을 받지 않고 안내를 보인다", () => {
    const align = handle({ flipHorizontal: true, polygon: TRIANGLE, canClosePolygon: true })
    const { surface } = setup(align)
    press(surface, 50, 50)
    fireEvent.keyDown(window, { key: "Enter" })
    expect(align.addPoint).not.toHaveBeenCalled()
    expect(align.closePolygon).not.toHaveBeenCalled()
    expect(surface.className).toContain("scale-x-[-1]")
    expect(screen.getByText(/좌우 반전 미리보기/)).toBeInTheDocument()
  })
})

describe("AlignmentDrawCanvas — 저장 원본 고정(REQ-ALIGN-002b)", () => {
  it("그림은 항상 sceneImageUrl(aprthngNo)", () => {
    render(<AlignmentDrawCanvas aprthngNo="05019-24-0017_2" align={handle()} />)
    expect(screen.getByRole("img", { name: "정렬용 저장 현장 이미지" })).toHaveAttribute("src", "/crime_images/05019-24-0017_2.png")
  })
})
