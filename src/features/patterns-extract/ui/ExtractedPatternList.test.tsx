import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"

import { PATTERNS_ROOT } from "@/entities/pattern"
import { ExtractedPatternList } from "./ExtractedPatternList"

const ITEMS = [
  { code: "s21b", score: 0.55 },
  { code: "s21c", score: 0.95 },
]

describe("ExtractedPatternList (통합 추출란)", () => {
  it("score 내림차순으로 렌더링한다 (REQ-SCENE-009)", () => {
    render(<ExtractedPatternList items={ITEMS} />)

    const buttons = screen.getAllByRole("button")
    expect(buttons).toHaveLength(2)
    expect(buttons[0]).toHaveTextContent("s21c")
    expect(buttons[1]).toHaveTextContent("s21b")
  })

  it("draggable 항목의 dataTransfer에 PATTERNS_ROOT로 hydrate된 전체 경로를 싣는다", () => {
    render(<ExtractedPatternList items={ITEMS} />)

    const button = screen.getByRole("button", { name: /s21c/ })
    expect(button).toHaveAttribute("draggable", "true")

    let captured = ""
    const dataTransfer = {
      setData: (_type: string, value: string) => {
        captured = value
      },
      effectAllowed: "",
    }
    const event = new Event("dragstart", { bubbles: true }) as unknown as DragEvent
    Object.defineProperty(event, "dataTransfer", { value: dataTransfer })
    button.dispatchEvent(event)

    expect(captured).toBe(`${PATTERNS_ROOT}s21c.png`)
  })

  it("빈 목록이면 안내 문구를 보여준다", () => {
    render(<ExtractedPatternList items={[]} />)
    expect(screen.getByText("추출 결과가 없습니다")).toBeInTheDocument()
  })

  it("isInserted가 true인 항목은 드래그 불가로 비활성화한다", () => {
    render(
      <ExtractedPatternList items={ITEMS} isInserted={(code) => code === "s21b"} />
    )

    const inserted = screen.getByRole("button", { name: /s21b/ })
    const notInserted = screen.getByRole("button", { name: /s21c/ })
    expect(inserted).toBeDisabled()
    expect(inserted).toHaveAttribute("draggable", "false")
    expect(notInserted).not.toBeDisabled()
  })
})
