import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Avatar } from "./Avatar"

describe("Avatar", () => {
  it("이름의 첫 글자를 보인다", () => {
    render(<Avatar name="박○○" />)
    const el = screen.getByText("박")
    expect(el).toHaveAttribute("data-part", "Avatar")
    expect(el).toHaveAttribute("aria-label", "박○○")
  })

  it("tone 이 있으면 변형", () => {
    render(<Avatar name="이○○" tone="teal" partId="S01-32" />)
    const el = screen.getByText("이")
    expect(el).toHaveAttribute("data-part-variant", "teal")
    expect(el).toHaveAttribute("data-part-id", "S01-32")
  })

  it("기본은 변형 속성이 없다", () => {
    render(<Avatar name="김○○" />)
    expect(screen.getByText("김")).not.toHaveAttribute("data-part-variant")
  })
})
