import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { PaneHead } from "./PaneHead"

describe("PaneHead", () => {
  it("제목(h3) = brand 밑줄 2px · brand-3 글자, 오른쪽 끝 자리 · 흐린 설명 · id", () => {
    const { container } = render(<PaneHead title="현장 이미지" sub="AI 제안 3" id="h" end={<button type="button">검색</button>} partId="S01-64" />)
    const head = screen.getByRole("heading", { level: 3, name: "현장 이미지" })
    expect(head).toHaveAttribute("id", "h")
    expect(head.className).toContain("border-brand")
    expect(head.className).toContain("text-brand-3")
    const root = container.querySelector('[data-slot="panel-pane-head"]') as HTMLElement
    expect(root).toHaveAttribute("data-part", "PaneHead")
    expect(root).toHaveAttribute("data-part-id", "S01-64")
    expect(root.className).toContain("border-b")
    expect(screen.getByText("AI 제안 3")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "검색" }).parentElement?.className).toContain("ml-auto")
  })

  it("as 로 제목 단계를 바꾸고, tip 이면 ⓘ 단추(이름에 설명)", () => {
    render(<PaneHead title="매칭 조건" as="h4" tip="지금 검색은 필수 문양만으로 찾습니다" />)
    expect(screen.getByRole("heading", { level: 4, name: "매칭 조건" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "도움말 — 지금 검색은 필수 문양만으로 찾습니다" })).toBeInTheDocument()
  })
})
