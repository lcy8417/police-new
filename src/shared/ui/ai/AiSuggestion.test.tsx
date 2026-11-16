import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { AiSuggestion } from "./AiSuggestion"

describe("AiSuggestion", () => {
  it("제안 · 근거를 그리고 적용 버튼이 콜백을 부른다", () => {
    const onApply = vi.fn()
    const { container } = render(
      <AiSuggestion title="기울기 맞추기" reason="족적 축 −4.2°" actionLabel="맞추기" onApply={onApply} />,
    )
    expect(container.querySelector("[data-part=AiSuggestion]")).toBeInTheDocument()
    expect(screen.getByText("기울기 맞추기")).toBeInTheDocument()
    expect(screen.getByText("족적 축 −4.2°")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "맞추기" }))
    expect(onApply).toHaveBeenCalledTimes(1)
  })

  it("onApply 가 없으면 버튼을 그리지 않는다", () => {
    render(<AiSuggestion title="제안" />)
    expect(screen.queryByRole("button")).toBeNull()
  })

  it("기본 버튼 글자는 「적용」", () => {
    render(<AiSuggestion title="제안" onApply={() => {}} />)
    expect(screen.getByRole("button", { name: "적용" })).toBeInTheDocument()
  })

  it("확신도가 기준 미만이면 low 상태 + 낮음 알림, 이상이면 없다", () => {
    const { container, rerender } = render(<AiSuggestion title="t" confidence={0.71} />)
    const root = container.querySelector("[data-part=AiSuggestion]")!
    expect(root).toHaveAttribute("data-part-state", "low")
    expect(screen.getByLabelText("확신도 0.71 낮음")).toHaveTextContent("0.71")
    rerender(<AiSuggestion title="t" confidence={0.93} />)
    expect(root).not.toHaveAttribute("data-part-state")
    expect(screen.getByLabelText("확신도 0.93")).toBeInTheDocument()
  })
})
