import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { ThemeScope } from "./ThemeScope"

describe("ThemeScope", () => {
  it("설정 값을 범위 속성으로 단다", () => {
    const { container } = render(
      <ThemeScope prefs={{ theme: "dark", font: "pretendard", scale: "lg", reducedMotion: false }} className="x">
        <p>본문</p>
      </ThemeScope>,
    )
    const el = container.firstElementChild!
    expect(el).toHaveAttribute("data-part", "ThemeScope")
    expect(el).toHaveAttribute("data-theme", "dark")
    expect(el).toHaveAttribute("data-font", "pretendard")
    expect(el).toHaveAttribute("data-scale", "lg")
    expect(el).not.toHaveAttribute("data-motion")
    expect(el).toHaveClass("x")
    expect(el).toHaveTextContent("본문")
  })

  it("움직임 줄이기면 data-motion=reduce", () => {
    const { container } = render(
      <ThemeScope prefs={{ theme: "scas-light", font: "d2coding", scale: "md", reducedMotion: true }} />,
    )
    expect(container.firstElementChild).toHaveAttribute("data-motion", "reduce")
  })
})
