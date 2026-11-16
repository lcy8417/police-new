import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { StatTile } from "./StatTile"

describe("StatTile", () => {
  it("라벨 · 숫자 · 단위 · 보조 글자를 그린다", () => {
    const { container } = render(<StatTile label="결과 확인 전" value="14" unit="건" sub="이미지 98장" />)
    const root = container.querySelector("[data-part=StatTile]")!
    expect(root).toBeInTheDocument()
    expect(screen.getByText("결과 확인 전")).toBeInTheDocument()
    expect(screen.getByText("14")).toBeInTheDocument()
    expect(screen.getByText("건")).toBeInTheDocument()
    expect(screen.getByText("이미지 98장")).toBeInTheDocument()
  })

  it("기본 톤은 변형 표식이 없고, 톤 · 크기가 있으면 변형 이름에 담긴다", () => {
    const { container, rerender } = render(<StatTile label="a" value="1" />)
    const root = container.querySelector("[data-part=StatTile]")!
    expect(root).not.toHaveAttribute("data-part-variant")
    rerender(<StatTile label="a" value="1" tone="warn" />)
    expect(root).toHaveAttribute("data-part-variant", "warn")
    rerender(<StatTile label="a" value="1" tone="warn" size="sm" />)
    expect(root).toHaveAttribute("data-part-variant", "warn-sm")
  })

  it("children 은 숫자와 보조 글자 사이에 들어간다", () => {
    render(
      <StatTile label="k" value="9" sub="보조">
        <span>막대</span>
      </StatTile>,
    )
    const bar = screen.getByText("막대")
    expect(bar.compareDocumentPosition(screen.getByText("보조")) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.getByText("9").compareDocumentPosition(bar) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it("label · value 없이 children 만으로도 그린다(AI 사전 처리 카드)", () => {
    render(<StatTile tone="ai"><b>AI 사전 처리</b></StatTile>)
    expect(screen.getByText("AI 사전 처리")).toBeInTheDocument()
  })

  it("danger 숫자 톤은 글자색 클래스가 다르다", () => {
    render(<StatTile label="k" value="3" valueTone="danger" />)
    expect(screen.getByText("3").className).toContain("text-danger-fg")
  })
})
