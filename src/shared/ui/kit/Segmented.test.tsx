import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { Segmented } from "./Segmented"

const ITEMS = [
  { value: "원본", label: "원본" },
  { value: "이진화", label: "이진화" },
  { value: "반전", label: "반전" },
]

describe("Segmented", () => {
  it("루트에 부품 표식을 붙이고 현재 칸만 눌림 상태다", () => {
    const { container } = render(<Segmented items={ITEMS} value="원본" onValueChange={() => {}} partId="S01-31" />)
    const root = container.firstElementChild
    expect(root).toHaveAttribute("data-part", "Segmented")
    expect(root).toHaveAttribute("data-part-id", "S01-31")
    expect(screen.getByRole("button", { name: "원본" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByRole("button", { name: "이진화" })).toHaveAttribute("aria-pressed", "false")
    expect(screen.getByRole("button", { name: "반전" })).toHaveAttribute("aria-pressed", "false")
  })

  it("칸을 누르면 그 값으로 콜백을 부른다", () => {
    const onValueChange = vi.fn()
    render(<Segmented items={ITEMS} value="원본" onValueChange={onValueChange} />)
    fireEvent.click(screen.getByRole("button", { name: "이진화" }))
    expect(onValueChange).toHaveBeenCalledWith("이진화")
  })

  it("scas 이면 변형 scas", () => {
    const { container } = render(<Segmented items={ITEMS} value="원본" onValueChange={() => {}} scas />)
    expect(container.firstElementChild).toHaveAttribute("data-part-variant", "scas")
    // 눌린 칸 바탕은 실제로 있는 토큰(bg-foreground = --t-fg). 없는 bg-fg 는 칠해지지 않는 버그였다.
    const pressed = container.querySelector('button[aria-pressed="true"]')!
    expect(pressed.className).toContain("bg-foreground")
    expect(pressed.className).not.toMatch(/(^|\s)bg-fg(\s|$)/)
  })
})
