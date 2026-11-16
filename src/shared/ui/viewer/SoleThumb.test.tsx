import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { SoleThumb } from "./SoleThumb"

describe("SoleThumb", () => {
  it("루트에 부품 표식 · 크기 변형 · 그림 대체글", () => {
    render(<SoleThumb src="s.png" alt="밑창 1" />)
    const btn = screen.getByRole("button", { name: "밑창 1" })
    expect(btn).toHaveAttribute("data-part", "SoleThumb")
    expect(btn).toHaveAttribute("data-part-variant", "md")
    expect(screen.getByAltText("밑창 1")).toHaveAttribute("src", "s.png")
  })

  it("size 가 변형 이름이 된다", () => {
    render(<SoleThumb src="s.png" alt="a" size="lg" />)
    expect(screen.getByRole("button")).toHaveAttribute("data-part-variant", "lg")
  })

  it("selected 면 aria-pressed=true, 아니면 false", () => {
    const { rerender } = render(<SoleThumb src="s.png" alt="a" selected />)
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true")
    rerender(<SoleThumb src="s.png" alt="a" />)
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false")
  })

  it("누르면 onClick", () => {
    const onClick = vi.fn()
    render(<SoleThumb src="s.png" alt="a" onClick={onClick} />)
    fireEvent.click(screen.getByRole("button"))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
