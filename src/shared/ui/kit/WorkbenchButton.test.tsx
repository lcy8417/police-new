import { fireEvent, render, screen } from "@testing-library/react"
import { Save } from "lucide-react"
import { describe, expect, it, vi } from "vitest"

import { WorkbenchButton } from "./WorkbenchButton"

describe("WorkbenchButton", () => {
  it("기본은 soft · md, 표식을 단다", () => {
    render(<WorkbenchButton>확인</WorkbenchButton>)
    const b = screen.getByRole("button", { name: "확인" })
    expect(b).toHaveAttribute("type", "button")
    expect(b).toHaveAttribute("data-part", "WorkbenchButton")
    expect(b).toHaveAttribute("data-part-variant", "soft")
    expect(b.className).toContain("h-[28px]")
  })

  it("primary · sm 이면 변형 이름에 -sm 이 붙고 높이 24", () => {
    render(
      <WorkbenchButton variant="primary" size="sm" icon={Save}>
        저장
      </WorkbenchButton>
    )
    const b = screen.getByRole("button", { name: "저장" })
    expect(b).toHaveAttribute("data-part-variant", "primary-sm")
    expect(b.className).toContain("h-[24px]")
    // 아이콘은 읽지 않는다
    expect(b.querySelector("svg")).toHaveAttribute("aria-hidden", "true")
  })

  it("aria-pressed 면 켜짐 상태(on)로 그리고, 누르면 onClick", () => {
    const onClick = vi.fn()
    render(
      <WorkbenchButton variant="ghost" aria-pressed onClick={onClick}>
        확대경
      </WorkbenchButton>
    )
    const b = screen.getByRole("button", { name: "확대경" })
    expect(b).toHaveAttribute("data-part-state", "on")
    expect(b.className).toContain("bg-brand-bg")
    fireEvent.click(b)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it("잠기면 누를 수 없다", () => {
    const onClick = vi.fn()
    render(
      <WorkbenchButton disabled onClick={onClick}>
        검색
      </WorkbenchButton>
    )
    fireEvent.click(screen.getByRole("button", { name: "검색" }))
    expect(onClick).not.toHaveBeenCalled()
  })
})
