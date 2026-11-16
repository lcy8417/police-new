import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { LiveDot } from "./LiveDot"

describe("LiveDot", () => {
  it("label 이 보이고(접근 이름) 변형이 상태 이름", () => {
    render(<LiveDot state="busy" label="처리 중" />)
    const label = screen.getByText("처리 중")
    expect(label).toBeVisible()
    const root = label.closest("[data-part]")!
    expect(root).toHaveAttribute("data-part", "LiveDot")
    expect(root).toHaveAttribute("data-part-variant", "busy")
  })

  it("busy 만 맥박, idle 은 맥박 없음", () => {
    const { container, rerender } = render(<LiveDot state="busy" label="처리 중" />)
    const root = container.querySelector("[data-part=LiveDot]") as HTMLElement
    expect(root.className).toContain("motion-safe:animate-ai-pulse")
    rerender(<LiveDot state="idle" label="대기" />)
    expect(root.className).not.toContain("animate-")
    expect(root).toHaveAttribute("data-part-variant", "idle")
  })

  it("움직임 줄이기: 움직임은 motion-safe: 로만", () => {
    const { container } = render(<LiveDot state="busy" label="처리 중" />)
    const root = container.querySelector("[data-part=LiveDot]") as HTMLElement
    const animated = root.className.split(/\s+/).filter((c) => c.includes("animate-"))
    expect(animated.every((c) => c.startsWith("motion-safe:"))).toBe(true)
  })
})
