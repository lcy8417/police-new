import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { CountDot } from "./CountDot"
import { StatePill } from "./StatePill"

describe("StatePill", () => {
  it("사실 · 상태는 회색 알약, 문제만 danger 바탕 + 「!」", () => {
    render(
      <>
        <StatePill tone="fact">현장</StatePill>
        <StatePill tone="problem">불능 1</StatePill>
      </>,
    )
    const fact = screen.getByText("현장")
    expect(fact.className).toContain("bg-strip")
    expect(fact).toHaveAttribute("data-part", "StatePill")
    expect(fact).toHaveAttribute("data-part-variant", "fact")
    const problem = screen.getByText(/불능 1/)
    expect(problem).toHaveTextContent("! 불능 1")
    expect(problem.className).toContain("bg-danger-bg")
  })

  it("해당 없음은 비우면 「–」", () => {
    render(<StatePill tone="notApplicable" />)
    expect(screen.getByText("–")).toBeInTheDocument()
  })

  it("단추형: 누르면 onClick, blocked 면 onBlocked(까닭), busy 면 막힘", () => {
    const onClick = vi.fn()
    const onBlocked = vi.fn()
    const { rerender } = render(<StatePill tone="pending" label="검색" onClick={onClick}>아직</StatePill>)
    fireEvent.click(screen.getByRole("button", { name: "검색 아직" }))
    expect(onClick).toHaveBeenCalledTimes(1)
    rerender(
      <StatePill tone="pending" label="검색" onClick={onClick} blocked="권한 없음" onBlocked={onBlocked}>
        아직
      </StatePill>,
    )
    fireEvent.click(screen.getByRole("button", { name: "검색 아직" }))
    expect(onBlocked).toHaveBeenCalledWith("권한 없음")
    expect(onClick).toHaveBeenCalledTimes(1)
    rerender(<StatePill tone="pending" label="검색" onClick={onClick} busy>아직</StatePill>)
    expect(screen.getByRole("button", { name: "검색 아직" })).toBeDisabled()
  })
})

describe("CountDot", () => {
  it("0 · 모름은 그리지 않고 100 이상은 99+", () => {
    const { container, rerender } = render(<CountDot count={0} />)
    expect(container.firstChild).toBeNull()
    rerender(<CountDot count={null} />)
    expect(container.firstChild).toBeNull()
    rerender(<CountDot count={3} />)
    expect(container.firstElementChild).toHaveTextContent("3")
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true")
    rerender(<CountDot count={120} selected />)
    expect(container.firstElementChild).toHaveTextContent("99+")
    expect(container.firstElementChild).toHaveAttribute("data-state", "on")
  })
})
