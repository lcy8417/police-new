import { fireEvent, render, screen, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { StageStrip, TaskBoxes, type StageStripItem, type TaskBoxItem } from "./StageStrip"
import { StepNum } from "./StateBox"

const STAGES: StageStripItem[] = [
  { key: 0, state: "done", label: "접수", note: "끝" },
  { key: 1, state: "problem", label: "1차 작업", note: "확인 2개", dot: true },
  { key: 2, state: "pending", label: "검색·판정", note: "2개 남음", now: true },
  { key: 3, state: "pending", label: "결재", note: "아직", final: true },
]

describe("StageStrip", () => {
  it("칸 수 · 상태 표식, 지금 칸만 aria-current=step + 채움, 마지막 칸 앞 ›", () => {
    const { container } = render(<StageStrip label="사건 진행 단계" items={STAGES} onPick={() => undefined} />)
    const strip = screen.getByRole("group", { name: "사건 진행 단계" })
    expect(strip).toHaveAttribute("data-part", "StageStrip")
    const cells = within(strip).getAllByRole("button")
    expect(cells).toHaveLength(4)
    expect(cells.map((c) => c.getAttribute("data-cell-state"))).toEqual(["done", "problem", "pending", "pending"])
    expect(cells[2]).toHaveAttribute("aria-current", "step")
    expect(cells[2].className).toContain("bg-brand-3")
    expect(cells[2].className).toContain("outline-brand")
    expect(cells.filter((c) => c.hasAttribute("aria-current"))).toHaveLength(1)
    expect(cells[0]).toHaveTextContent("✓")
    expect(screen.getByLabelText("확인할 문제 있음")).toBeInTheDocument()
    expect(container.textContent).toContain("›")
  })

  it("칸을 누르면 onPick(key)", () => {
    const onPick = vi.fn()
    render(<StageStrip label="단계" items={STAGES} onPick={onPick} />)
    fireEvent.click(screen.getByRole("button", { name: /1차 작업/ }))
    expect(onPick).toHaveBeenCalledWith(1)
  })
})

describe("TaskBoxes", () => {
  const ITEMS: TaskBoxItem[] = [
    { key: "a", state: "done", label: "결과 확인 검토", note: "끝", hint: "결과 확인 탭" },
    { key: "b", state: "pending", label: "결재 올리기", note: "지금", hint: "결과 확인 탭", now: true, current: true },
  ]

  it("「↳ 이 단계 할 일」 목록, 지금 상자 채움 + 테, 누르면 onPress(key), 오른쪽 자리", () => {
    const onPress = vi.fn()
    render(<TaskBoxes label="이 단계 할 일" items={ITEMS} onPress={onPress} right={<span>✓ 저장됨 09:12</span>} />)
    expect(screen.getByText("↳ 이 단계 할 일")).toBeInTheDocument()
    const list = screen.getByRole("list", { name: "이 단계 할 일" })
    const boxes = within(list).getAllByRole("button")
    expect(boxes).toHaveLength(2)
    expect(boxes[1].className).toContain("bg-brand-3")
    expect(boxes[1].className).toContain("outline-brand")
    expect(boxes[0]).toHaveAttribute("title", "결과 확인 탭")
    fireEvent.click(boxes[1])
    expect(onPress).toHaveBeenCalledWith("b")
    expect(screen.getByText("✓ 저장됨 09:12")).toBeInTheDocument()
  })
})

describe("StepNum", () => {
  it("끝 ✓ · 해당 없음 – · 나머지 번호", () => {
    const { container } = render(
      <>
        <StepNum state="done" n={1} />
        <StepNum state="notApplicable" n={2} />
        <StepNum state="pending" n={3} size={16} />
      </>
    )
    expect([...container.querySelectorAll("i")].map((i) => i.textContent)).toEqual(["✓", "–", "3"])
  })
})
