import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { FilterBar, type FilterBarProps } from "./FilterBar"

const FILTERS: FilterBarProps["filters"] = [
  {
    key: "status",
    label: "상태",
    options: [
      { value: "ok", label: "확인", count: 4 },
      { value: "wait", label: "대기", count: 2 },
    ],
    value: ["ok"],
  },
]

function setup(props: Partial<FilterBarProps> = {}) {
  const fns = { onQueryChange: vi.fn(), onFilterChange: vi.fn(), onClear: vi.fn() }
  const utils = render(<FilterBar query="" filters={FILTERS} {...fns} {...props} />)
  return { ...fns, ...utils }
}

describe("FilterBar", () => {
  it("검색어를 바꾸면 알린다", () => {
    const { onQueryChange } = setup()
    fireEvent.change(screen.getByRole("textbox", { name: "검색어" }), { target: { value: "침입" } })
    expect(onQueryChange).toHaveBeenCalledWith("침입")
  })

  it("검색어가 있을 때만 × 가 나오고 누르면 비운다", () => {
    const { onQueryChange, rerender, ...fns } = setup()
    expect(screen.queryByRole("button", { name: "검색어 지우기" })).toBeNull()
    rerender(<FilterBar query="침입" filters={FILTERS} {...fns} onQueryChange={onQueryChange} />)
    fireEvent.click(screen.getByRole("button", { name: "검색어 지우기" }))
    expect(onQueryChange).toHaveBeenCalledWith("")
  })

  it("칩은 여러 개 고를 수 있고 선택 상태가 aria-pressed 로 보인다", () => {
    const { onFilterChange } = setup()
    expect(screen.getByRole("group", { name: "상태" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /확인/ })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByRole("button", { name: /대기/ })).toHaveAttribute("aria-pressed", "false")
    fireEvent.click(screen.getByRole("button", { name: /대기/ }))
    expect(onFilterChange).toHaveBeenCalledWith("status", ["ok", "wait"])
    fireEvent.click(screen.getByRole("button", { name: /확인/ }))
    expect(onFilterChange).toHaveBeenLastCalledWith("status", [])
  })

  it("개수는 있을 때만 칩에 붙는다", () => {
    setup()
    expect(screen.getByRole("button", { name: "확인 4" })).toBeInTheDocument()
  })

  it("조건 지우기: 조건이 없으면 비활성, 있으면 누를 수 있다", () => {
    const { onClear } = setup()
    const btn = screen.getByRole("button", { name: "조건 지우기" })
    expect(btn).toBeEnabled()
    fireEvent.click(btn)
    expect(onClear).toHaveBeenCalled()
  })

  it("조건이 하나도 없으면 조건 지우기가 꺼진다", () => {
    setup({ filters: [{ ...FILTERS[0], value: [] }] })
    expect(screen.getByRole("button", { name: "조건 지우기" })).toBeDisabled()
  })

  it("결과 개수를 「n / 전체 m」로 보인다", () => {
    setup({ resultCount: 3, total: 12 })
    expect(screen.getByText("3 / 전체 12")).toBeInTheDocument()
  })

  it("전체가 없으면 「n건」, 둘 다 없으면 안 보인다", () => {
    const { rerender, ...fns } = setup({ resultCount: 3 })
    expect(screen.getByText("3건")).toBeInTheDocument()
    rerender(<FilterBar query="" filters={FILTERS} {...fns} />)
    expect(screen.queryByText(/건$/)).toBeNull()
  })
})
