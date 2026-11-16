import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { LiveDot } from "./LiveDot"

function dotOf(root: Element) {
  return root.querySelector("[data-live-dot]") as HTMLElement
}

describe("LiveDot", () => {
  it("label 은 sr-only 가 아닌 보이는 글자이고 변형이 상태 이름", () => {
    render(<LiveDot state="busy" label="처리 중" />)
    const label = screen.getByText("처리 중")
    expect(label.className).not.toContain("sr-only")
    expect(label.closest(".sr-only")).toBeNull()
    const root = label.closest("[data-part]")!
    expect(root).toHaveAttribute("data-part", "LiveDot")
    expect(root).toHaveAttribute("data-part-variant", "busy")
  })

  it("hideLabel 을 명시해야만 글자가 sr-only 로 바뀐다", () => {
    render(<LiveDot state="busy" label="처리 중" hideLabel />)
    expect(screen.getByText("처리 중").className).toContain("sr-only")
  })

  it("busy 와 idle 은 색 말고도 다르다: 글자 · 점 모양(채움/빈 고리)", () => {
    const { container, rerender } = render(<LiveDot state="busy" label="처리 중" />)
    const busyDot = dotOf(container).className
    expect(busyDot).toContain("bg-ai")
    expect(screen.getByText("처리 중")).toBeInTheDocument()
    rerender(<LiveDot state="idle" label="대기" />)
    const idleDot = dotOf(container).className
    expect(screen.getByText("대기")).toBeInTheDocument()
    expect(idleDot).toContain("border")
    expect(idleDot).toContain("bg-transparent")
    expect(idleDot).not.toContain("bg-ai")
    expect(idleDot).not.toContain("animate-")
  })

  it("움직임 줄이기: 맥박은 motion-safe: 로만", () => {
    const { container } = render(<LiveDot state="busy" label="처리 중" />)
    const animated = dotOf(container).className.split(/\s+/).filter((c) => c.includes("animate-"))
    expect(animated.length).toBeGreaterThan(0)
    expect(animated.every((c) => c.startsWith("motion-safe:"))).toBe(true)
  })
})
