import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { ViewCountSwitch } from "./ViewCountSwitch"

describe("ViewCountSwitch", () => {
  it("라벨과 숫자 옵션을 그리고 현재 값만 눌림 상태다", () => {
    const { container } = render(<ViewCountSwitch options={[1, 3, 5]} value={3} onChange={() => {}} label="보기" partId="X-1" />)
    expect(container.firstElementChild).toHaveAttribute("data-part", "ViewCountSwitch")
    expect(container.firstElementChild).toHaveAttribute("data-part-id", "X-1")
    expect(screen.getByText("보기")).toBeInTheDocument()
    expect(screen.getByRole("group", { name: "보기" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "3개" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByRole("button", { name: "1개" })).toHaveAttribute("aria-pressed", "false")
  })

  it("누르면 숫자 그대로 돌려준다", () => {
    const onChange = vi.fn()
    render(<ViewCountSwitch options={[1, 3, 5]} value={1} onChange={onChange} />)
    fireEvent.click(screen.getByRole("button", { name: "5개" }))
    expect(onChange).toHaveBeenCalledWith(5)
  })

  it("글자 옵션은 글자 그대로", () => {
    const onChange = vi.fn()
    render(<ViewCountSwitch options={["한 장", "세 장"]} value="한 장" onChange={onChange} />)
    fireEvent.click(screen.getByRole("button", { name: "세 장" }))
    expect(onChange).toHaveBeenCalledWith("세 장")
  })

  it("라벨이 없으면 접근성 이름은 「보기 개수」", () => {
    render(<ViewCountSwitch options={[1, 3]} value={1} onChange={() => {}} />)
    expect(screen.getByRole("group", { name: "보기 개수" })).toBeInTheDocument()
  })
})
