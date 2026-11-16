import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { AiProgress } from "./AiProgress"

describe("AiProgress", () => {
  it("running: 부품 표식 · progressbar · aria-valuenow(0~100)", () => {
    render(<AiProgress state="running" value={0.62} label="이미지 확인" />)
    const el = screen.getByRole("progressbar", { name: "이미지 확인" })
    expect(el).toHaveAttribute("data-part", "AiProgress")
    expect(el).toHaveAttribute("data-part-variant", "running")
    expect(el).toHaveAttribute("aria-valuenow", "62")
    expect((el.firstElementChild as HTMLElement).style.width).toBe("62%")
  })

  it("running 에 value 가 없으면 aria-valuenow 를 뺀다", () => {
    render(<AiProgress state="running" />)
    expect(screen.getByRole("progressbar")).not.toHaveAttribute("aria-valuenow")
  })

  it("done: 기본 100%", () => {
    render(<AiProgress state="done" />)
    const el = screen.getByRole("progressbar")
    expect(el).toHaveAttribute("data-part-variant", "done")
    expect(el).toHaveAttribute("aria-valuenow", "100")
  })

  it("failed: 글자 「실패」와 failed 변형", () => {
    render(<AiProgress state="failed" value={0.4} />)
    expect(screen.getByText("실패")).toBeInTheDocument()
    expect(screen.getByRole("progressbar").closest("[data-part]")).toHaveAttribute(
      "data-part-variant",
      "failed",
    )
  })

  it("범위 밖 값은 0~1 로 자른다", () => {
    render(<AiProgress state="running" value={1.7} />)
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100")
  })

  it("움직임 줄이기: 움직임은 motion-safe: 로만 걸린다(멈춘 모양이 최종)", () => {
    render(<AiProgress state="running" value={0.5} />)
    const fill = screen.getByRole("progressbar").firstElementChild as HTMLElement
    const animated = fill.className.split(/\s+/).filter((c) => c.includes("animate-"))
    expect(animated.length).toBeGreaterThan(0)
    expect(animated.every((c) => c.startsWith("motion-safe:"))).toBe(true)
  })

  it("className 은 어느 상태에서든 부품 루트에 붙는다", () => {
    const { container, rerender } = render(<AiProgress state="running" className="w-[96px]" />)
    expect(container.querySelector("[data-part=AiProgress]")).toHaveClass("w-[96px]")
    rerender(<AiProgress state="failed" className="w-[96px]" />)
    expect(container.querySelector("[data-part=AiProgress]")).toHaveClass("w-[96px]")
  })

  it("partId 는 data-part-id 로", () => {
    render(<AiProgress state="done" partId="S02-30" />)
    expect(screen.getByRole("progressbar")).toHaveAttribute("data-part-id", "S02-30")
  })
})
