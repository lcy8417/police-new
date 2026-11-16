import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { BoardFrame } from "./BoardFrame"
import { ListFoot, ListGroupHead, ListHeadRow, ListNameCell, ListNote, ListRow } from "./ListTable"

describe("BoardFrame", () => {
  it("흰 판 · 모서리 14 · 테, 부품 표식", () => {
    const { container } = render(<BoardFrame partId="S01-91">x</BoardFrame>)
    const frame = container.firstElementChild as HTMLElement
    expect(frame).toHaveAttribute("data-part", "BoardFrame")
    expect(frame.className).toContain("rounded-[14px]")
    expect(frame.className).toContain("bg-panel")
  })
})

describe("ListTable", () => {
  it("칸 머리는 읽지 않는 흰 바탕 줄이다", () => {
    const { container } = render(<ListHeadRow>감정번호</ListHeadRow>)
    const head = container.firstElementChild as HTMLElement
    expect(head).toHaveAttribute("aria-hidden", "true")
    expect(head.className).toContain("bg-panel")
    expect(head.className).toContain("text-[10.5px]")
  })

  it("고른 줄은 옅은 brand 바탕 + brand 안쪽 테, 아니면 없음", () => {
    const { container, rerender } = render(<ListRow>a</ListRow>)
    const row = container.firstElementChild as HTMLElement
    expect(row).toHaveAttribute("data-state", "default")
    expect(row.className).not.toContain("ring-brand")
    rerender(<ListRow selected>a</ListRow>)
    expect(row).toHaveAttribute("data-state", "selected")
    expect(row.className).toContain("bg-brand-bg")
    expect(row.className).toContain("ring-brand")
  })

  it("묶음 머리는 이름과 오른쪽 수를 보인다", () => {
    render(<ListGroupHead title="교차 검증" aside="3건" />)
    expect(screen.getByText("교차 검증")).toBeInTheDocument()
    expect(screen.getByText("3건")).toBeInTheDocument()
  })

  it("이름 칸은 머리글자 동그라미 + 이름, 빈 이름은 「이름 없음」", () => {
    const { rerender } = render(<ListNameCell name="박○○" nameTestId="n" />)
    expect(screen.getByTestId("n")).toHaveTextContent("박○○")
    rerender(<ListNameCell name="  " nameTestId="n" />)
    expect(screen.getByTestId("n")).toHaveTextContent("이름 없음")
  })

  it("아래 한 줄 · 안내 한 줄(action 은 「·」 뒤에)", () => {
    const onRetry = vi.fn()
    render(
      <>
        <ListFoot>116 / 전체 116</ListFoot>
        <ListNote
          action={
            <button type="button" onClick={onRetry}>
              다시
            </button>
          }
        >
          확인 못 함
        </ListNote>
      </>,
    )
    expect(screen.getByText("116 / 전체 116")).toBeInTheDocument()
    expect(screen.getByText("확인 못 함")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "다시" }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
