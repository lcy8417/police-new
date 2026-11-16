import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { ZoneBands, type ZoneBand } from "./ZoneBands"

const ZONES: ZoneBand[] = [
  { key: "top", label: "상", from: 0, to: 0.35 },
  { key: "mid", label: "중", from: 0.35, to: 0.67 },
  { key: "bottom", label: "하", from: 0.67, to: 1 },
]

describe("ZoneBands", () => {
  it("띠 3개와 라벨", () => {
    const { container } = render(<ZoneBands zones={ZONES} />)
    expect(container.querySelectorAll("[data-zone]")).toHaveLength(3)
    for (const l of ["상", "중", "하"]) expect(screen.getByText(l)).toBeInTheDocument()
  })

  it("루트는 클릭을 막지 않는다(pointer-events-none)", () => {
    const { container } = render(<ZoneBands zones={ZONES} />)
    const root = container.firstElementChild as HTMLElement
    expect(root).toHaveAttribute("data-part", "ZoneBands")
    expect(root.className).toContain("pointer-events-none")
  })

  it("from · to 비율이 위치와 높이(%)가 된다", () => {
    const { container } = render(<ZoneBands zones={ZONES} />)
    const mid = container.querySelector("[data-zone='mid']") as HTMLElement
    expect(mid.style.top).toBe("35%")
    expect(mid.style.height).toBe("32%")
  })

  it("확신도 표시는 없다(띠 색은 키별 토큰 클래스)", () => {
    const { container } = render(<ZoneBands zones={ZONES} />)
    expect(container.textContent).toBe("상중하")
  })
})
