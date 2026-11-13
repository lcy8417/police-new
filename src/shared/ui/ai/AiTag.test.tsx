import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { AiTag } from "./AiTag"

describe("AiTag", () => {
  it("기본 글자는 AI, 부품 표식과 기본 변형을 붙인다", () => {
    render(<AiTag />)
    const el = screen.getByText("AI")
    expect(el).toHaveAttribute("data-part", "AiTag")
    expect(el).toHaveAttribute("data-part-variant", "default")
  })

  it("children 이 기본 글자를 대신한다", () => {
    render(<AiTag>AI 제안</AiTag>)
    expect(screen.getByText("AI 제안")).toHaveAttribute("data-part", "AiTag")
  })

  it("done 은 기본 글자 AI✓", () => {
    render(<AiTag variant="done" />)
    const el = screen.getByText("AI✓")
    expect(el).toHaveAttribute("data-part-variant", "done")
  })

  it("progress 는 진행 점(장식)과 글자를 함께 그린다", () => {
    render(<AiTag variant="progress">7/12</AiTag>)
    const el = screen.getByText("7/12")
    expect(el).toHaveAttribute("data-part-variant", "progress")
    const dot = el.firstElementChild as HTMLElement
    expect(dot).not.toBeNull()
    expect(dot).toHaveAttribute("aria-hidden", "true")
  })

  it("partId 는 data-part-id 로", () => {
    render(<AiTag partId="S02-21" />)
    expect(screen.getByText("AI")).toHaveAttribute("data-part-id", "S02-21")
  })
})
