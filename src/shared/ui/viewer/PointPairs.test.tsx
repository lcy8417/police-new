import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import type { MatchBox } from "@/entities/match"

import { PointPairs } from "./PointPairs"

const BOXES: MatchBox[] = [
  { cx: 100, cy: 120, size: 96 },
  { cx: 300, cy: 400, size: 96 },
  { cx: 200, cy: 250, size: 96 },
]

function setup(extra: Partial<React.ComponentProps<typeof PointPairs>> = {}) {
  return render(<PointPairs boxes={BOXES} side="crime" activeIndex={null} width={600} height={800} {...extra} />)
}

describe("PointPairs", () => {
  it("루트 표식 · side 변형 · 좌표계 viewBox", () => {
    const { container } = setup()
    const root = container.firstElementChild as SVGElement
    expect(root).toHaveAttribute("data-part", "PointPairs")
    expect(root).toHaveAttribute("data-part-variant", "crime")
    expect(root).toHaveAttribute("viewBox", "0 0 600 800")
    expect(root.getAttribute("class")).toContain("pointer-events-none")
  })

  it("박스 수만큼 번호(1부터)", () => {
    setup()
    for (const n of ["1", "2", "3"]) expect(screen.getByText(n)).toBeInTheDocument()
  })

  it("activeIndex 박스만 data-active", () => {
    const { container } = setup({ activeIndex: 1 })
    const boxes = container.querySelectorAll("[data-pair]")
    expect(boxes).toHaveLength(3)
    expect(boxes[1]).toHaveAttribute("data-active", "true")
    expect(boxes[0]).not.toHaveAttribute("data-active")
  })

  it("박스 중심에서 size 만큼 사각형을 그린다", () => {
    const { container } = setup()
    const rect = container.querySelector("[data-pair='0'] rect") as SVGRectElement
    expect(rect).toHaveAttribute("x", "52")
    expect(rect).toHaveAttribute("y", "72")
    expect(rect).toHaveAttribute("width", "96")
  })

  it("클릭하면 onSelect(i), 올리면 onHover(i) · 내리면 onHover(null)", () => {
    const onSelect = vi.fn()
    const onHover = vi.fn()
    const { container } = setup({ onSelect, onHover })
    const second = container.querySelector("[data-pair='1']") as SVGElement
    fireEvent.click(second)
    expect(onSelect).toHaveBeenCalledWith(1)
    fireEvent.mouseEnter(second)
    expect(onHover).toHaveBeenCalledWith(1)
    fireEvent.mouseLeave(second)
    expect(onHover).toHaveBeenLastCalledWith(null)
  })
})
