import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { ColumnPicker } from "./ColumnPicker"

const COLS = [
  { key: "no", label: "감정번호", locked: true },
  { key: "name", label: "사건명" },
  { key: "place", label: "채취장소" },
  { key: "date", label: "채취일시" },
]

function open() {
  fireEvent.click(screen.getByRole("button", { name: /열 선택/ }))
}

describe("ColumnPicker", () => {
  it("처음엔 닫혀 있고 눌러 열면 열 순서대로 체크 목록이 나온다", () => {
    const { container } = render(<ColumnPicker columns={COLS} visible={["no", "name"]} onChange={() => {}} partId="X-1" />)
    expect(container.firstElementChild).toHaveAttribute("data-part", "ColumnPicker")
    expect(screen.queryByRole("checkbox")).toBeNull()
    expect(screen.getByRole("button", { name: /열 선택/ })).toHaveTextContent("2/4")
    open()
    const boxes = screen.getAllByRole("checkbox")
    expect(boxes.map((b) => b.closest("label")?.textContent)).toEqual(["감정번호고정", "사건명", "채취장소", "채취일시"])
    expect(boxes.map((b) => (b as HTMLInputElement).checked)).toEqual([true, true, false, false])
  })

  it("잠긴 열은 비활성이고 visible 에 없어도 켜져 있다", () => {
    render(<ColumnPicker columns={COLS} visible={["name"]} onChange={() => {}} />)
    open()
    const locked = screen.getByRole("checkbox", { name: /감정번호/ })
    expect(locked).toBeDisabled()
    expect(locked).toBeChecked()
  })

  it("열을 켜면 SCAS 순서를 지킨 목록으로 알린다", () => {
    const onChange = vi.fn()
    render(<ColumnPicker columns={COLS} visible={["no", "date"]} onChange={onChange} />)
    open()
    fireEvent.click(screen.getByRole("checkbox", { name: "사건명" }))
    expect(onChange).toHaveBeenCalledWith(["no", "name", "date"])
  })

  it("열을 끄면 빠진 목록으로 알린다", () => {
    const onChange = vi.fn()
    render(<ColumnPicker columns={COLS} visible={["no", "name", "date"]} onChange={onChange} />)
    open()
    fireEvent.click(screen.getByRole("checkbox", { name: "채취일시" }))
    expect(onChange).toHaveBeenCalledWith(["no", "name"])
  })

  it("전체 보기 · 기본으로", () => {
    const onChange = vi.fn()
    render(<ColumnPicker columns={COLS} visible={["no"]} onChange={onChange} defaultVisible={["name"]} />)
    open()
    fireEvent.click(screen.getByRole("button", { name: "전체 보기" }))
    expect(onChange).toHaveBeenLastCalledWith(["no", "name", "place", "date"])
    fireEvent.click(screen.getByRole("button", { name: "기본으로" }))
    expect(onChange).toHaveBeenLastCalledWith(["no", "name"])
  })

  it("기본값이 없으면 기본으로 = 전체", () => {
    const onChange = vi.fn()
    render(<ColumnPicker columns={COLS} visible={["no"]} onChange={onChange} />)
    open()
    fireEvent.click(screen.getByRole("button", { name: "기본으로" }))
    expect(onChange).toHaveBeenLastCalledWith(["no", "name", "place", "date"])
  })

  it("Esc 와 바깥 누름으로 닫힌다", () => {
    render(
      <div>
        <button type="button">바깥</button>
        <ColumnPicker columns={COLS} visible={["no"]} onChange={() => {}} />
      </div>
    )
    open()
    expect(screen.getByRole("button", { name: /열 선택/ })).toHaveAttribute("aria-expanded", "true")
    fireEvent.keyDown(screen.getByRole("group", { name: "보일 열" }), { key: "Escape" })
    expect(screen.queryByRole("checkbox")).toBeNull()
    expect(screen.getByRole("button", { name: /열 선택/ })).toHaveFocus()
    open()
    fireEvent.mouseDown(screen.getByRole("button", { name: "바깥" }))
    expect(screen.queryByRole("checkbox")).toBeNull()
  })
})
