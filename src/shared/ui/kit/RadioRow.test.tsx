import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { RadioRow } from "./RadioRow"

const OPTIONS = [
  { value: "A", label: "신발" },
  { value: "B", label: "맨발" },
]

describe("RadioRow", () => {
  it("라디오 묶음이고 선택값만 aria-checked", () => {
    render(<RadioRow name="kind" options={OPTIONS} value="A" onValueChange={() => {}} partId="S02-31" />)
    const group = screen.getByRole("radiogroup")
    expect(group).toHaveAttribute("data-part", "RadioRow")
    expect(group).toHaveAttribute("data-part-id", "S02-31")
    expect(screen.getByRole("radio", { name: /신발/ })).toHaveAttribute("aria-checked", "true")
    expect(screen.getByRole("radio", { name: /맨발/ })).toHaveAttribute("aria-checked", "false")
  })

  it("선택값이 없으면 모두 해제", () => {
    render(<RadioRow name="kind" options={OPTIONS} value={null} onValueChange={() => {}} />)
    for (const r of screen.getAllByRole("radio")) expect(r).toHaveAttribute("aria-checked", "false")
  })

  it("누르면 값으로 콜백", () => {
    const onValueChange = vi.fn()
    render(<RadioRow name="kind" options={OPTIONS} value="A" onValueChange={onValueChange} />)
    fireEvent.click(screen.getByRole("radio", { name: /맨발/ }))
    expect(onValueChange).toHaveBeenCalledWith("B")
  })

  it("disabled 면 콜백을 부르지 않는다", () => {
    const onValueChange = vi.fn()
    render(<RadioRow name="kind" options={OPTIONS} value="A" onValueChange={onValueChange} disabled />)
    fireEvent.click(screen.getByRole("radio", { name: /맨발/ }))
    expect(onValueChange).not.toHaveBeenCalled()
    expect(screen.getByRole("radiogroup")).toHaveAttribute("data-part-state", "disabled")
  })
})
