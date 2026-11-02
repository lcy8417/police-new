import { beforeAll, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

import { AlignmentCaptureCanvas } from "./AlignmentCaptureCanvas"
import { sceneImageUrl } from "../lib/scene-image-url"

// jsdom에는 ResizeObserver가 없다 — no-op 폴리필(다른 캔버스 테스트와 동일 관례).
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
beforeAll(() => {
  globalThis.ResizeObserver =
    globalThis.ResizeObserver ?? (ResizeObserverStub as unknown as typeof ResizeObserver)
})

/** 저장 현장 이미지의 실측 (W,H) — 시나리오 10d의 대조군. */
const SAVED_W = 400
const SAVED_H = 300

function stubImageLoad(img: HTMLImageElement, width = SAVED_W, height = SAVED_H) {
  Object.defineProperty(img, "naturalWidth", { value: width, configurable: true })
  Object.defineProperty(img, "naturalHeight", { value: height, configurable: true })
  img.getBoundingClientRect = () =>
    ({
      width: 200, // 표시 폭(축소 렌더) — scale = 400/200 = 2
      height: 150,
      left: 0,
      top: 0,
      right: 200,
      bottom: 150,
      x: 0,
      y: 0,
      toJSON() {},
    }) as DOMRect
  fireEvent.load(img)
}

const noop = () => {}

function baseProps() {
  return {
    crimeNumber: "2024-100",
    polygon: [] as [number, number][],
    arrow: [] as [number, number][],
    phase: "polygon" as const,
    drawMode: "scratch" as const,
    arrowStep: "toe" as const,
    flipHorizontal: false,
    onImageNaturalSize: noop,
    onAddPoint: noop,
    onClosePolygon: noop,
    onMoveWholeShape: noop,
    onMoveVertex: noop,
    onPickArrowPoint: noop,
  }
}

describe("AlignmentCaptureCanvas — 캔버스 소스 고정(REQ-ALIGN-002b, AC-ALIGN-021)", () => {
  it("항상 sceneImageUrl(crimeNumber)만 소스로 사용한다 — editImage류 prop 자체가 없다", () => {
    render(<AlignmentCaptureCanvas {...baseProps()} />)
    const img = screen.getByAltText("정렬용 저장 현장 이미지") as HTMLImageElement
    expect(img.src).toBe(sceneImageUrl("2024-100"))
    expect(img.src).not.toContain("edit")
  })

  it("naturalWidth/naturalHeight가 저장 파일의 (W,H)와 일치한다 — '토글'을 시뮬레이션한 재렌더 양쪽 모두", () => {
    const { rerender } = render(<AlignmentCaptureCanvas {...baseProps()} />)
    const img = screen.getByAltText("정렬용 저장 현장 이미지") as HTMLImageElement
    stubImageLoad(img)
    expect(img.naturalWidth).toBe(SAVED_W)
    expect(img.naturalHeight).toBe(SAVED_H)

    // "편집" 토글 전환을 시뮬레이션 — 이 컴포넌트에는 editImage/sceneView류 prop이
    // 없으므로(구조적으로 편집 이미지를 받을 수 없음), 다른 상태(phase)만 바뀌는
    // 재렌더로 토글 전환을 흉내낸다. 소스·자연 크기는 변하지 않아야 한다.
    rerender(<AlignmentCaptureCanvas {...baseProps()} phase="arrow" />)
    const imgAfter = screen.getByAltText("정렬용 저장 현장 이미지") as HTMLImageElement
    expect(imgAfter.src).toBe(sceneImageUrl("2024-100"))
    expect(imgAfter.naturalWidth).toBe(SAVED_W)
    expect(imgAfter.naturalHeight).toBe(SAVED_H)
  })

  it("이미지 로드 시 onImageNaturalSize(naturalWidth, naturalHeight)를 호출한다", () => {
    const onImageNaturalSize = vi.fn()
    render(<AlignmentCaptureCanvas {...baseProps()} onImageNaturalSize={onImageNaturalSize} />)
    const img = screen.getByAltText("정렬용 저장 현장 이미지") as HTMLImageElement
    stubImageLoad(img)
    expect(onImageNaturalSize).toHaveBeenCalledWith(SAVED_W, SAVED_H)
  })
})

describe("AlignmentCaptureCanvas — scratch 모드 클릭 그리기(REQ-ALIGN-003)", () => {
  it("scratch + polygon 단계에서 클릭 시 onAddPoint를 호출한다", () => {
    const onAddPoint = vi.fn()
    const { container } = render(
      <AlignmentCaptureCanvas {...baseProps()} onAddPoint={onAddPoint} />
    )
    const img = screen.getByAltText("정렬용 저장 현장 이미지") as HTMLImageElement
    stubImageLoad(img)
    const surface = container.querySelector(".cursor-crosshair") as HTMLDivElement
    fireEvent.click(surface, { clientX: 50, clientY: 30 })
    expect(onAddPoint).toHaveBeenCalledTimes(1)
  })

  it("더블클릭 시 폴리곤 닫기를 요청한다(scratch 모드, 3점 이상 전제는 훅이 판정)", () => {
    const onClosePolygon = vi.fn()
    const { container } = render(
      <AlignmentCaptureCanvas
        {...baseProps()}
        polygon={[[1, 1], [2, 1], [2, 2]]}
        onClosePolygon={onClosePolygon}
      />
    )
    const surface = container.querySelector(".cursor-crosshair") as HTMLDivElement
    fireEvent.doubleClick(surface)
    expect(onClosePolygon).toHaveBeenCalledTimes(1)
  })

  it("template 모드에서는 표면 클릭이 onAddPoint를 호출하지 않는다(드래그로만 조정)", () => {
    const onAddPoint = vi.fn()
    const { container } = render(
      <AlignmentCaptureCanvas
        {...baseProps()}
        drawMode="template"
        polygon={[[10, 10], [50, 10], [50, 40]]}
        onAddPoint={onAddPoint}
      />
    )
    const img = screen.getByAltText("정렬용 저장 현장 이미지") as HTMLImageElement
    stubImageLoad(img)
    const surface = container.querySelector(".cursor-crosshair") as HTMLDivElement
    fireEvent.click(surface, { clientX: 5, clientY: 5 })
    expect(onAddPoint).not.toHaveBeenCalled()
  })

  it("review 단계에서는 입력 표면이 pointer-events-none으로 전환된다(정점 추가 없음)", () => {
    const onAddPoint = vi.fn()
    render(
      <AlignmentCaptureCanvas
        {...baseProps()}
        polygon={[[1, 1], [2, 1], [2, 2]]}
        arrow={[[1, 1], [2, 2]]}
        phase="review"
        arrowStep="complete"
        onAddPoint={onAddPoint}
      />
    )
    const surface = screen.getByTestId("alignment-surface")
    expect(surface.className).not.toContain("cursor-crosshair")
    expect(surface.className).toContain("pointer-events-none")
  })
})

describe("AlignmentCaptureCanvas — 앞굽/뒤꿈치 명시 선택(REQ-ALIGN-019)", () => {
  it("arrow 단계 + arrowStep='toe'에서 클릭하면 onPickArrowPoint('toe', ...)가 호출된다", () => {
    const onPickArrowPoint = vi.fn()
    const { container } = render(
      <AlignmentCaptureCanvas
        {...baseProps()}
        phase="arrow"
        arrowStep="toe"
        polygon={[[10, 10], [50, 10], [50, 40]]}
        onPickArrowPoint={onPickArrowPoint}
      />
    )
    const img = screen.getByAltText("정렬용 저장 현장 이미지") as HTMLImageElement
    stubImageLoad(img)
    const surface = container.querySelector(".cursor-crosshair") as HTMLDivElement
    fireEvent.click(surface, { clientX: 5, clientY: 5 })
    expect(onPickArrowPoint).toHaveBeenCalledWith("toe", 5, 5, expect.anything(), SAVED_W)
  })

  it("arrowStep='heel'일 때 클릭하면 onPickArrowPoint('heel', ...)가 호출된다", () => {
    const onPickArrowPoint = vi.fn()
    const { container } = render(
      <AlignmentCaptureCanvas
        {...baseProps()}
        phase="arrow"
        arrowStep="heel"
        arrow={[[10, 10]]}
        polygon={[[10, 10], [50, 10], [50, 40]]}
        onPickArrowPoint={onPickArrowPoint}
      />
    )
    const img = screen.getByAltText("정렬용 저장 현장 이미지") as HTMLImageElement
    stubImageLoad(img)
    const surface = container.querySelector(".cursor-crosshair") as HTMLDivElement
    fireEvent.click(surface, { clientX: 15, clientY: 15 })
    expect(onPickArrowPoint).toHaveBeenCalledWith("heel", 15, 15, expect.anything(), SAVED_W)
  })

  it("앞굽/뒤꿈치 마커에 라벨 텍스트가 렌더된다", () => {
    const { container } = render(
      <AlignmentCaptureCanvas
        {...baseProps()}
        phase="review"
        arrowStep="complete"
        polygon={[[10, 10], [50, 10], [50, 40]]}
        arrow={[[10, 10], [50, 40]]}
      />
    )
    const img = screen.getByAltText("정렬용 저장 현장 이미지") as HTMLImageElement
    stubImageLoad(img)
    expect(container.textContent).toContain("앞굽")
    expect(container.textContent).toContain("뒤꿈치")
  })
})

describe("AlignmentCaptureCanvas — 드래그 미세 조정(REQ-ALIGN-018)", () => {
  it("template 모드에서 도형 본체 mousedown 후 window mousemove로 onMoveWholeShape가 호출된다", () => {
    const onMoveWholeShape = vi.fn()
    const { container } = render(
      <AlignmentCaptureCanvas
        {...baseProps()}
        drawMode="template"
        polygon={[[10, 10], [50, 10], [50, 40]]}
        onMoveWholeShape={onMoveWholeShape}
      />
    )
    const img = screen.getByAltText("정렬용 저장 현장 이미지") as HTMLImageElement
    stubImageLoad(img)

    const shapeHandle = container.querySelector('[data-testid="alignment-shape-handle"]') as SVGPolygonElement
    fireEvent.mouseDown(shapeHandle, { clientX: 20, clientY: 20 })
    fireEvent.mouseMove(window, { clientX: 25, clientY: 24 })

    expect(onMoveWholeShape).toHaveBeenCalledWith(5, 4, SAVED_W, 200)
    fireEvent.mouseUp(window)
  })

  it("정점 핸들 mousedown 후 window mousemove로 onMoveVertex가 호출된다", () => {
    const onMoveVertex = vi.fn()
    const { container } = render(
      <AlignmentCaptureCanvas
        {...baseProps()}
        drawMode="template"
        polygon={[[10, 10], [50, 10], [50, 40]]}
        onMoveVertex={onMoveVertex}
      />
    )
    const img = screen.getByAltText("정렬용 저장 현장 이미지") as HTMLImageElement
    stubImageLoad(img)

    const vertex1 = container.querySelector('[data-testid="alignment-vertex-1"]') as SVGCircleElement
    fireEvent.mouseDown(vertex1, { clientX: 30, clientY: 5 })
    fireEvent.mouseMove(window, { clientX: 40, clientY: 8 })

    expect(onMoveVertex).toHaveBeenCalledWith(1, 40, 8, expect.anything(), SAVED_W)
    fireEvent.mouseUp(window)
  })

  it("scratch 모드에서는 도형/정점 드래그 핸들이 인터랙티브하지 않다", () => {
    const onMoveWholeShape = vi.fn()
    const { container } = render(
      <AlignmentCaptureCanvas
        {...baseProps()}
        drawMode="scratch"
        polygon={[[10, 10], [50, 10], [50, 40]]}
        onMoveWholeShape={onMoveWholeShape}
      />
    )
    const img = screen.getByAltText("정렬용 저장 현장 이미지") as HTMLImageElement
    stubImageLoad(img)
    const shapeHandle = container.querySelector('[data-testid="alignment-shape-handle"]') as SVGPolygonElement
    expect(shapeHandle.getAttribute("class") ?? "").not.toContain("pointer-events-auto")
  })
})

describe("AlignmentCaptureCanvas — 좌우 반전 프리뷰(REQ-ALIGN-020a)", () => {
  it("flipHorizontal=true면 미러 컨테이너에 scale-x-[-1] 클래스가 적용되고 입력 표면이 잠긴다", () => {
    render(
      <AlignmentCaptureCanvas
        {...baseProps()}
        polygon={[[10, 10], [50, 10], [50, 40]]}
        flipHorizontal
      />
    )
    const img = screen.getByAltText("정렬용 저장 현장 이미지") as HTMLImageElement
    expect(img.closest(".scale-x-\\[-1\\]")).not.toBeNull()
    const surface = screen.getByTestId("alignment-surface")
    expect(surface.className).toContain("pointer-events-none")
    expect(screen.getByText(/반전 미리보기/)).toBeInTheDocument()
  })

  it("flipHorizontal=false면 미러 클래스가 없고 안내 배너도 없다", () => {
    render(<AlignmentCaptureCanvas {...baseProps()} />)
    const img = screen.getByAltText("정렬용 저장 현장 이미지") as HTMLImageElement
    expect(img.closest(".scale-x-\\[-1\\]")).toBeNull()
    expect(screen.queryByText(/반전 미리보기/)).toBeNull()
  })
})

// ─── 좌표 계약: img 요소 rect == 렌더된 이미지 ───
// 클릭 좌표는 `e.clientX - imgRect.left`, 스케일은 `naturalWidth / imgRect.width`로
// 계산한다(computeScale). 따라서 object-fit 레터박스가 생기거나 폭 상한으로 종횡비가
// 깨지면 그 즉시 그리는 좌표가 통째로 어긋난다. jsdom에는 레이아웃이 없어 시각적으로는
// 잡히지 않으므로 클래스 불변식으로 방어한다.
describe("AlignmentCaptureCanvas — 이미지 사이징 좌표 불변식", () => {
  it("이미지에 object-fit/폭 상한을 걸지 않는다(크기는 고정 높이 × 종횡비로만 결정)", () => {
    render(<AlignmentCaptureCanvas {...baseProps()} />)
    const img = screen.getByAltText("정렬용 저장 현장 이미지")

    expect(img.className).not.toMatch(/object-(contain|cover|fill|scale-down)/)
    expect(img.className).not.toMatch(/max-w-/)
    // 높이는 컨테이너에 맞추고 폭은 종횡비로만 따라간다.
    expect(img.className).toContain("h-full")
    expect(img.className).toContain("w-auto")
  })

  it("오버레이 기준 래퍼가 이미지보다 좁아질 수 있는 폭 상한을 갖지 않는다", () => {
    render(<AlignmentCaptureCanvas {...baseProps()} />)
    const img = screen.getByAltText("정렬용 저장 현장 이미지")
    // 폴리곤 SVG·클릭 표면이 absolute inset-0으로 붙는 래퍼 = img의 부모.
    const wrapper = img.parentElement!

    expect(wrapper.className).not.toMatch(/max-w-/)
    expect(wrapper.className).toContain("w-fit")
  })
})
