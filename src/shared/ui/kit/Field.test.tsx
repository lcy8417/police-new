import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Field } from "./Field"

describe("Field", () => {
  it("invalid 이면 aria-invalid 와 상태 표식이 입력에 붙는다", () => {
    render(<Field invalid aria-label="감정번호" />)
    const el = screen.getByLabelText("감정번호")
    expect(el.tagName).toBe("INPUT")
    expect(el).toHaveAttribute("aria-invalid", "true")
    expect(el).toHaveAttribute("data-part", "Field")
    expect(el).toHaveAttribute("data-part-state", "invalid")
  })

  it("readOnly 이면 readonly 속성과 상태 표식", () => {
    render(<Field readOnly aria-label="번호" defaultValue="2025-03321" />)
    const el = screen.getByLabelText("번호")
    expect(el).toHaveAttribute("readonly")
    expect(el).toHaveAttribute("data-part-state", "readonly")
  })

  it("required 이면 aria-required (빨간 별표는 라벨 몫)", () => {
    render(<Field required aria-label="사건명" />)
    const el = screen.getByLabelText("사건명")
    expect(el).toHaveAttribute("aria-required", "true")
    expect(screen.queryByText("*")).toBeNull()
  })

  it("기본 변형은 표식에 변형을 넣지 않고, 지정하면 시안 이름 그대로", () => {
    const { rerender } = render(<Field aria-label="a" />)
    expect(screen.getByLabelText("a")).not.toHaveAttribute("data-part-variant")
    rerender(<Field aria-label="a" variant="mono-sm" partId="S01-13" />)
    const el = screen.getByLabelText("a")
    expect(el).toHaveAttribute("data-part-variant", "mono-sm")
    expect(el).toHaveAttribute("data-part-id", "S01-13")
  })

  it("icon=search 는 돋보기(aria-hidden)를 그리고 입력의 접근성 이름은 그대로", () => {
    const { container } = render(<Field icon="search" aria-label="바로 찾기" invalid />)
    const input = screen.getByLabelText("바로 찾기")
    expect(input.tagName).toBe("INPUT")
    expect(input).toHaveAttribute("aria-invalid", "true")
    const icon = container.querySelector("svg")
    expect(icon).not.toBeNull()
    expect(icon).toHaveAttribute("aria-hidden", "true")
    // 표식은 바깥 틀(부품 루트)에 붙는다
    expect(container.firstElementChild).toHaveAttribute("data-part", "Field")
    expect(container.firstElementChild).toHaveAttribute("data-part-state", "invalid")
  })

  it("select 변형은 ▾ 를 그리고 입력은 그대로 접근 가능", () => {
    const { container } = render(<Field variant="select" aria-label="사건명" defaultValue="주거침입" readOnly />)
    expect(screen.getByLabelText("사건명")).toHaveValue("주거침입")
    expect(container.firstElementChild).toHaveAttribute("data-part-variant", "select")
    expect(container.textContent).toContain("▾")
  })
})
