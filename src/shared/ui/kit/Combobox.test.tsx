import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { Combobox } from "./Combobox"

const ITEMS = [
  { value: "dg-e", label: "동부서", path: "대구청 › 동부서" },
  { value: "dg-w", label: "서부서", path: "대구청 › 서부서" },
  { value: "bs-e", label: "동래서", path: "부산청 › 동래서" },
]

function setup(props: Partial<React.ComponentProps<typeof Combobox>> = {}) {
  const onValueChange = vi.fn()
  render(<Combobox items={ITEMS} value={null} onValueChange={onValueChange} placeholder="관서 검색" partId="S02-31" {...props} />)
  return { onValueChange, input: screen.getByRole("combobox") as HTMLInputElement }
}

describe("Combobox", () => {
  it("루트 표식과 안내 글자", () => {
    const { input } = setup()
    expect(input).toHaveAttribute("placeholder", "관서 검색")
    expect(document.querySelector("[data-part='Combobox']")).toHaveAttribute("data-part-id", "S02-31")
  })

  it("입력하면 일치 항목만 나오고 경로가 보인다", () => {
    const { input } = setup()
    fireEvent.change(input, { target: { value: "동부" } })
    const options = screen.getAllByRole("option")
    expect(options).toHaveLength(1)
    expect(options[0]).toHaveTextContent("대구청 › 동부서")
  })

  it("경로로도 찾는다", () => {
    const { input } = setup()
    fireEvent.change(input, { target: { value: "부산청" } })
    expect(screen.getAllByRole("option")).toHaveLength(1)
  })

  it("Enter 로 첫 일치 항목을 고른다", () => {
    const { input, onValueChange } = setup()
    fireEvent.change(input, { target: { value: "동" } })
    fireEvent.keyDown(input, { key: "Enter" })
    expect(onValueChange).toHaveBeenCalledWith("dg-e")
  })

  it("방향키로 옮긴 항목을 Enter 로 고른다", () => {
    const { input, onValueChange } = setup()
    fireEvent.change(input, { target: { value: "동" } })
    fireEvent.keyDown(input, { key: "ArrowDown" })
    fireEvent.keyDown(input, { key: "Enter" })
    expect(onValueChange).toHaveBeenCalledWith("bs-e")
  })

  it("항목 클릭으로 고르면 목록이 닫힌다", () => {
    const { input, onValueChange } = setup()
    fireEvent.change(input, { target: { value: "서부" } })
    fireEvent.click(screen.getByRole("option"))
    expect(onValueChange).toHaveBeenCalledWith("dg-w")
    expect(screen.queryByRole("option")).toBeNull()
  })

  it("일치가 없으면 emptyText", () => {
    const { input, onValueChange } = setup({ emptyText: "일치하는 관서 없음" })
    fireEvent.change(input, { target: { value: "없는곳" } })
    expect(screen.getByText("일치하는 관서 없음")).toBeInTheDocument()
    fireEvent.keyDown(input, { key: "Enter" })
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it("선택된 값의 이름이 입력 칸에 보인다", () => {
    const { input } = setup({ value: "dg-w" })
    expect(input.value).toBe("서부서")
  })
})
