import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { PatternIcon } from "./PatternIcon"

describe("PatternIcon", () => {
  it("받은 src 를 그대로 그린다(경로를 바꾸지 않음)", () => {
    const src = "/src/assets/Patterns/전체/n32_04.png"
    const { container } = render(<PatternIcon name="n32_04" src={src} />)
    const root = container.firstElementChild as HTMLElement
    expect(root).toHaveAttribute("data-part", "PatternIcon")
    expect(root).toHaveAttribute("data-part-variant", "md")
    expect(screen.getByAltText("n32_04")).toHaveAttribute("src", src)
  })

  it("size 가 변형 이름이 된다", () => {
    const { container } = render(<PatternIcon name="a" src="a.png" size="sm" />)
    expect(container.firstElementChild).toHaveAttribute("data-part-variant", "sm")
  })

  it("essential 이면 「필수」 글자", () => {
    const { rerender } = render(<PatternIcon name="a" src="a.png" essential />)
    expect(screen.getByText("필수")).toBeInTheDocument()
    rerender(<PatternIcon name="a" src="a.png" />)
    expect(screen.queryByText("필수")).toBeNull()
  })

  it("count 를 보인다(0 도 보인다)", () => {
    const { rerender } = render(<PatternIcon name="a" src="a.png" count={3} />)
    expect(screen.getByText("3")).toBeInTheDocument()
    rerender(<PatternIcon name="a" src="a.png" count={0} />)
    expect(screen.getByText("0")).toBeInTheDocument()
  })

  it("selected · ai 는 상태 표식", () => {
    const { container, rerender } = render(<PatternIcon name="a" src="a.png" selected />)
    expect(container.firstElementChild).toHaveAttribute("data-part-state", "sel")
    rerender(<PatternIcon name="a" src="a.png" ai />)
    expect(container.firstElementChild).toHaveAttribute("data-part-state", "ai")
  })

  it("선택 · AI 는 색 말고 그림 대체글(화면낭독)로도 알린다", () => {
    const { rerender } = render(<PatternIcon name="a" src="a.png" selected />)
    expect(screen.getByAltText("a 선택됨")).toBeInTheDocument()
    rerender(<PatternIcon name="a" src="a.png" ai />)
    expect(screen.getByAltText("a AI 제안")).toBeInTheDocument()
    rerender(<PatternIcon name="a" src="a.png" />)
    expect(screen.getByAltText("a")).toBeInTheDocument()
  })

  it("position relative 는 배지가 있을 때만", () => {
    const { container, rerender } = render(<PatternIcon name="a" src="a.png" />)
    expect(container.firstElementChild).not.toHaveClass("relative")
    rerender(<PatternIcon name="a" src="a.png" essential />)
    expect(container.firstElementChild).toHaveClass("relative")
  })
})
