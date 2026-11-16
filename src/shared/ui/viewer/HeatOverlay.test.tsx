import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { HeatOverlay } from "./HeatOverlay"

describe("HeatOverlay", () => {
  it("그림만: pointer-events-none · 스크린 읽기에서 숨김 · 부품 표식", () => {
    const { container } = render(<HeatOverlay />)
    const el = container.querySelector("[data-part=HeatOverlay]")!
    expect(el).toBeInTheDocument()
    expect(el.getAttribute("class")).toContain("pointer-events-none")
    expect(el).toHaveAttribute("aria-hidden", "true")
    expect(el).toHaveAttribute("data-part-variant", "match")
  })

  it("match 는 번짐 3 + 소실 점선 고리, spots 는 원 3개", () => {
    const { container, rerender } = render(<HeatOverlay />)
    expect(container.querySelectorAll("ellipse")).toHaveLength(4)
    expect(container.querySelector("ellipse[stroke-dasharray]")).toBeInTheDocument()
    rerender(<HeatOverlay variant="spots" />)
    expect(container.querySelectorAll("circle")).toHaveLength(3)
  })

  it("opacity 기본: match 1 · spots 0.55, 직접 주면 그 값", () => {
    const { container, rerender } = render(<HeatOverlay />)
    const el = () => container.querySelector("svg")!
    expect(el().getAttribute("opacity")).toBe("1")
    rerender(<HeatOverlay variant="spots" />)
    expect(el().getAttribute("opacity")).toBe("0.55")
    rerender(<HeatOverlay opacity={0.3} />)
    expect(el().getAttribute("opacity")).toBe("0.3")
  })

  it("children 이 있으면 기본 번짐 대신 그것을 그린다", () => {
    const { container } = render(
      <HeatOverlay>
        <rect data-x="1" width="10" height="10" />
      </HeatOverlay>,
    )
    expect(container.querySelector("rect[data-x]")).toBeInTheDocument()
    expect(container.querySelector("ellipse")).toBeNull()
  })

  it("같은 화면에 둘을 그려도 그라데이션 id 가 겹치지 않는다", () => {
    const { container } = render(
      <>
        <HeatOverlay />
        <HeatOverlay />
      </>,
    )
    const ids = Array.from(container.querySelectorAll("radialGradient")).map((g) => g.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
