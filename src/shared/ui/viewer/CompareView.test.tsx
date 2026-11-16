import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { CompareView } from "./CompareView"

const base = {
  left: <span>왼쪽 그림</span>,
  right: <span>오른쪽 그림</span>,
  leftLabel: "현장 족적",
  rightLabel: "등록 신발",
}

describe("CompareView", () => {
  it.each(["side", "overlay", "slide"] as const)("mode=%s 가 변형 이름이 된다", (mode) => {
    const { container } = render(<CompareView {...base} mode={mode} />)
    const root = container.firstElementChild as HTMLElement
    expect(root).toHaveAttribute("data-part", "CompareView")
    expect(root).toHaveAttribute("data-part-variant", mode)
  })

  it("모든 모드에서 라벨 둘과 그림 둘이 보인다", () => {
    for (const mode of ["side", "overlay", "slide"] as const) {
      const { unmount } = render(<CompareView {...base} mode={mode} />)
      expect(screen.getByText("현장 족적")).toBeInTheDocument()
      expect(screen.getByText("등록 신발")).toBeInTheDocument()
      expect(screen.getByText("왼쪽 그림")).toBeInTheDocument()
      expect(screen.getByText("오른쪽 그림")).toBeInTheDocument()
      unmount()
    }
  })

  it("onModeChange 가 있으면 전환 버튼을 그리고 누르면 호출한다", () => {
    const onModeChange = vi.fn()
    render(<CompareView {...base} mode="side" onModeChange={onModeChange} />)
    expect(screen.getByRole("button", { name: "나란히" })).toHaveAttribute("aria-pressed", "true")
    fireEvent.click(screen.getByRole("button", { name: "겹쳐" }))
    expect(onModeChange).toHaveBeenCalledWith("overlay")
  })

  it("onModeChange 가 없으면 전환 버튼이 없다", () => {
    render(<CompareView {...base} mode="side" />)
    expect(screen.queryByRole("button")).toBeNull()
  })

  it("slide 모드는 가르는 막대(range)를 둔다", () => {
    const { container, rerender } = render(<CompareView {...base} mode="slide" />)
    expect(container.querySelector("input[type='range']")).not.toBeNull()
    rerender(<CompareView {...base} mode="side" />)
    expect(container.querySelector("input[type='range']")).toBeNull()
  })
})
