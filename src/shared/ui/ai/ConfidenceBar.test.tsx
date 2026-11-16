import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { ConfidenceBar } from "./ConfidenceBar"

describe("ConfidenceBar", () => {
  it("percent 69.99 는 「70%」, 폭 69.99%", () => {
    render(<ConfidenceBar value={69.99} scale="percent" label="유사도" />)
    expect(screen.getByText("70%")).toBeInTheDocument()
    const meter = screen.getByRole("meter", { name: "유사도" })
    expect(meter).toHaveAttribute("aria-valuenow", "70")
    expect((meter.firstElementChild as HTMLElement).style.width).toBe("69.99%")
  })

  it("unit 0.97 은 「0.97」", () => {
    render(<ConfidenceBar value={0.97} scale="unit" />)
    expect(screen.getByText("0.97")).toBeInTheDocument()
  })

  it("percent 에서 1 이하 값도 그대로 퍼센트로 읽는다(추측 없음)", () => {
    render(<ConfidenceBar value={0.5} scale="percent" />)
    expect(screen.getByText("1%")).toBeInTheDocument()
  })

  it("임계 미만이면 data-part-state=low, 이상이면 ok", () => {
    const { rerender, container } = render(
      <ConfidenceBar value={0.42} scale="unit" threshold={0.5} />,
    )
    const root = container.querySelector("[data-part=ConfidenceBar]")!
    expect(root).toHaveAttribute("data-part-state", "low")
    rerender(<ConfidenceBar value={0.5} scale="unit" threshold={0.5} />)
    expect(root).toHaveAttribute("data-part-state", "ok")
  })

  it("임계가 없으면 상태 표식 없음", () => {
    const { container } = render(<ConfidenceBar value={0.9} scale="unit" />)
    expect(container.querySelector("[data-part=ConfidenceBar]")).not.toHaveAttribute(
      "data-part-state",
    )
  })

  it("움직임 줄이기: 막대 움직임은 motion-safe: 로만", () => {
    render(<ConfidenceBar value={0.9} scale="unit" />)
    const fill = screen.getByRole("meter").firstElementChild as HTMLElement
    const animated = fill.className.split(/\s+/).filter((c) => c.includes("animate-"))
    expect(animated.every((c) => c.startsWith("motion-safe:"))).toBe(true)
  })
})
