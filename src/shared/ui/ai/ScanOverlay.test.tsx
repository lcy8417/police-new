import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { ScanOverlay } from "./ScanOverlay"

describe("ScanOverlay", () => {
  it("active=false 면 렌더하지 않는다", () => {
    const { container } = render(<ScanOverlay active={false} />)
    expect(container.querySelector("[data-part=ScanOverlay]")).toBeNull()
  })

  it("active=true: 부품 표식 · 장식(aria-hidden) · pointer-events-none", () => {
    const { container } = render(<ScanOverlay active partId="S01-40" />)
    const el = container.querySelector("[data-part=ScanOverlay]") as HTMLElement
    expect(el).not.toBeNull()
    expect(el).toHaveAttribute("aria-hidden", "true")
    expect(el).toHaveAttribute("data-part-id", "S01-40")
    expect(el.className).toContain("pointer-events-none")
  })

  it("움직임 줄이기: 움직임은 motion-safe: 로만(멈춘 모양 = 안 보임)", () => {
    const { container } = render(<ScanOverlay active />)
    const el = container.querySelector("[data-part=ScanOverlay]") as HTMLElement
    const animated = el.className.split(/\s+/).filter((c) => c.includes("animate-"))
    expect(animated.length).toBeGreaterThan(0)
    expect(animated.every((c) => c.startsWith("motion-safe:"))).toBe(true)
    expect(el.className).toContain("opacity-0")
  })
})
