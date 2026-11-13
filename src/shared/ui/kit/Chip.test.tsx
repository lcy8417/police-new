import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Chip } from "./Chip"

describe("Chip", () => {
  it("루트에 부품 표식과 변형을 붙인다", () => {
    render(<Chip variant="violet-h20">대조</Chip>)
    const el = screen.getByText("대조")
    expect(el).toHaveAttribute("data-part", "Chip")
    expect(el).toHaveAttribute("data-part-variant", "violet-h20")
  })

  it("on 이면 상태 on", () => {
    render(<Chip on>선택</Chip>)
    expect(screen.getByText("선택")).toHaveAttribute("data-part-state", "on")
  })

  it("기본은 상태 속성이 없다", () => {
    render(<Chip>보통</Chip>)
    const el = screen.getByText("보통")
    expect(el).not.toHaveAttribute("data-part-state")
    expect(el).not.toHaveAttribute("data-part-variant")
  })

  it("partId 는 data-part-id 로", () => {
    render(<Chip variant="blue" partId="S01-20">감정관</Chip>)
    expect(screen.getByText("감정관")).toHaveAttribute("data-part-id", "S01-20")
  })
})
