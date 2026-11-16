import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { EvidenceImage } from "./EvidenceImage"

describe("EvidenceImage", () => {
  it("루트에 부품 표식과 기본 변형(raw)을 붙인다", () => {
    const { container } = render(<EvidenceImage src="x.png" alt="현장 족적" />)
    const root = container.firstElementChild as HTMLElement
    expect(root).toHaveAttribute("data-part", "EvidenceImage")
    expect(root).toHaveAttribute("data-part-variant", "raw")
    expect(screen.getByAltText("현장 족적")).toHaveAttribute("src", "x.png")
  })

  it.each(["binary", "invert", "contrast"] as const)("look=%s 면 변형 이름이 같다", (look) => {
    const { container } = render(<EvidenceImage src="x.png" alt="a" look={look} />)
    expect(container.firstElementChild).toHaveAttribute("data-part-variant", look)
  })

  it("caption · tag 글자를 보인다", () => {
    render(<EvidenceImage src="x.png" alt="a" caption="00001-25-0646_1" tag="2" />)
    expect(screen.getByText("00001-25-0646_1")).toBeInTheDocument()
    expect(screen.getByText("2")).toBeInTheDocument()
  })

  it("ruler 가 있으면 cm 자를 그리고, 없으면 그리지 않는다", () => {
    const { container, rerender } = render(<EvidenceImage src="x.png" alt="a" ruler />)
    expect(container.querySelector("[data-part-slot='ruler']")).not.toBeNull()
    rerender(<EvidenceImage src="x.png" alt="a" />)
    expect(container.querySelector("[data-part-slot='ruler']")).toBeNull()
  })

  it("children 장식은 pointer-events-none 겹 안에 얹는다", () => {
    render(
      <EvidenceImage src="x.png" alt="a">
        <span>장식</span>
      </EvidenceImage>
    )
    expect(screen.getByText("장식").parentElement?.className).toContain("pointer-events-none")
  })

  it("partId 는 data-part-id 로", () => {
    const { container } = render(<EvidenceImage src="x.png" alt="a" partId="S05-31" />)
    expect(container.firstElementChild).toHaveAttribute("data-part-id", "S05-31")
  })
})
