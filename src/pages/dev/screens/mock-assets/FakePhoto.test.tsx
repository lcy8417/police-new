import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { FakePhoto, fakePhotoUrl } from "./FakePhoto"
import { FakeSole, fakeSoleUrl } from "./FakeSole"

describe("FakePhoto", () => {
  it("look 별 변형과 번호표 · 자", () => {
    const { container } = render(<FakePhoto tag="2" />)
    const svg = container.querySelector("svg") as SVGElement
    expect(svg).toHaveAttribute("data-part-variant", "raw")
    expect(svg.textContent).toContain("2")
    expect(svg.textContent).toContain("cm")
  })

  it("binary 는 번호표와 cm 글자가 없다", () => {
    const { container } = render(<FakePhoto look="binary" tag="2" />)
    expect(container.querySelector("svg")).toHaveAttribute("data-part-variant", "binary")
    expect(container.textContent).not.toContain("cm")
  })

  it("invert 는 필터를 건다 · rotate 와 flip 이 변환에 들어간다", () => {
    const { container } = render(<FakePhoto look="invert" rotate={7} flip />)
    expect((container.querySelector("svg") as SVGElement).style.filter).toContain("invert")
    const g = container.querySelector("g[transform*='rotate(7)']")
    expect(g?.getAttribute("transform")).toContain("scale(-1 1)")
  })

  it("zones 가 무늬 정의 3개가 된다", () => {
    const { container } = render(<FakePhoto zones={["lines", "wave", "tri"]} />)
    expect(container.querySelectorAll("pattern")).toHaveLength(3)
  })

  it("데이터 URL 은 svg 이고 hex 색이 없다", () => {
    const url = decodeURIComponent(fakePhotoUrl({ look: "raw" }))
    expect(url.startsWith("data:image/svg+xml")).toBe(true)
    expect(url).toContain("<svg")
    expect(url).not.toMatch(/#[0-9a-fA-F]{6}\b/)
    expect(url).not.toContain("var(")
  })
})

describe("FakeSole", () => {
  it("kind 변형 · 띠 3개", () => {
    const { container } = render(<FakeSole kind="scene" cut />)
    expect(container.querySelector("svg")).toHaveAttribute("data-part-variant", "scene")
    expect(container.querySelectorAll("pattern")).toHaveLength(3)
  })

  it("ruler 면 viewBox 가 넓어지고 flip 이 변환이 된다", () => {
    const { container } = render(<FakeSole ruler flip />)
    expect(container.querySelector("svg")).toHaveAttribute("viewBox", "0 0 114 264")
    expect(container.querySelector("g[transform='translate(100 0) scale(-1 1)']")).not.toBeNull()
  })

  it("데이터 URL", () => {
    const url = decodeURIComponent(fakeSoleUrl({ kind: "bin" }))
    expect(url).toContain("<svg")
    expect(url).not.toContain("var(")
  })
})
