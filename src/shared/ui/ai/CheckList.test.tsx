import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { CheckList } from "./CheckList"

const ITEMS = [
  { tone: "warn", text: "같은 사진 의심", detail: "크기 98% 같음", action: <button>삭제</button> },
  { tone: "bad", text: "흐린 사진" },
  { tone: "ok", text: "자 인식" },
] as const

describe("CheckList", () => {
  it("줄마다 톤 표(글리프 + 읽는 이름)를 그린다", () => {
    const { container } = render(<CheckList items={[...ITEMS]} />)
    expect(container.querySelector("[data-part=CheckList]")).toBeInTheDocument()
    expect(screen.getAllByRole("listitem")).toHaveLength(3)
    expect(screen.getByRole("img", { name: "주의" })).toHaveTextContent("!")
    expect(screen.getByRole("img", { name: "문제" })).toHaveTextContent("×")
    expect(screen.getByRole("img", { name: "정상" })).toHaveTextContent("✓")
  })

  it("글자 · 두 번째 줄 · 오른쪽 덧붙임을 그린다", () => {
    render(<CheckList items={[...ITEMS]} />)
    expect(screen.getByText("크기 98% 같음")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "삭제" })).toBeInTheDocument()
  })

  it("첫 줄은 윗선이 없고 topLine 이면 있다", () => {
    const { rerender } = render(<CheckList items={[...ITEMS]} />)
    expect(screen.getAllByRole("listitem")[0].className).toContain("border-t-0")
    expect(screen.getAllByRole("listitem")[1].className).not.toContain("border-t-0")
    rerender(<CheckList items={[...ITEMS]} topLine />)
    expect(screen.getAllByRole("listitem")[0].className).not.toContain("border-t-0")
  })

  it("dense 는 변형 표식과 좁은 안쪽 간격", () => {
    const { container } = render(<CheckList items={[...ITEMS]} dense />)
    expect(container.querySelector("[data-part=CheckList]")).toHaveAttribute("data-part-variant", "dense")
    expect(screen.getAllByRole("listitem")[0].className).toContain("py-[4px]")
  })

  it("글리프를 바꿀 수 있다(시안 S08 의 ·)", () => {
    render(<CheckList items={[{ tone: "warn", text: "아직 안 봄", icon: "·" }]} />)
    expect(screen.getByRole("img", { name: "주의" })).toHaveTextContent("·")
  })
})
