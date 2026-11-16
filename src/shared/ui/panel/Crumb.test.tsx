import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Crumb } from "./Crumb"

describe("Crumb", () => {
  it("경로를 구분자로 이어 그린다", () => {
    render(<Crumb items={["사건관리", "상세"]} />)
    expect(screen.getByText("사건관리")).toBeInTheDocument()
    expect(screen.getByText("상세")).toBeInTheDocument()
    expect(screen.getAllByText("›")).toHaveLength(1)
  })

  it("루트에 부품 표식을 붙이고 마지막 항목이 현재 위치다", () => {
    const { container } = render(<Crumb items={["사건관리", "상세"]} />)
    expect(container.firstElementChild).toHaveAttribute("data-part", "Crumb")
    expect(screen.getByText("상세")).toHaveAttribute("aria-current", "page")
  })
})
