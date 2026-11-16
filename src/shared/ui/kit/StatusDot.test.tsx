import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { StatusDot } from "./StatusDot"

describe("StatusDot", () => {
  it("글자가 보이고 변형은 tone", () => {
    render(<StatusDot tone="warn" label="지연" partId="S11-31" />)
    const el = screen.getByText("지연").closest("[data-part]")
    expect(el).toHaveAttribute("data-part", "StatusDot")
    expect(el).toHaveAttribute("data-part-variant", "warn")
    expect(el).toHaveAttribute("data-part-id", "S11-31")
    expect(screen.getByText("지연")).toBeVisible()
  })

  it("점은 장식(aria-hidden)이라 색만으로 구분하지 않는다", () => {
    const { container } = render(<StatusDot tone="ok" label="정상" />)
    expect(container.querySelector("[aria-hidden='true']")).not.toBeNull()
    expect(screen.getByText("정상")).toBeInTheDocument()
  })

  it.each(["ok", "warn", "danger", "off"] as const)("%s 톤을 받는다", (tone) => {
    const { container } = render(<StatusDot tone={tone} label="x" />)
    expect(container.firstElementChild).toHaveAttribute("data-part-variant", tone)
  })
})
