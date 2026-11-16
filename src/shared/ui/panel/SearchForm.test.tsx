import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { SearchForm } from "./SearchForm"

const ROWS = [
  { label: "감정번호", required: true, field: <input aria-label="감정번호 입력" /> },
  { label: "문서번호", field: <input aria-label="문서번호 입력" /> },
  { label: "사건명", field: <input aria-label="사건명 입력" /> },
  { label: "비고", span: 3 as const, field: <input aria-label="비고 입력" /> },
]

describe("SearchForm", () => {
  it("3열 폼에 라벨 · 필수 표시를 그린다", () => {
    const { container } = render(<SearchForm columns={3} rows={ROWS} />)
    expect(container.firstElementChild).toHaveAttribute("data-part", "SearchForm")
    expect(container.firstElementChild).toHaveAttribute("data-part-variant", "col3")
    expect(screen.getByText("감정번호")).toHaveAttribute("data-required")
    expect(screen.getByText("문서번호")).not.toHaveAttribute("data-required")
    expect(screen.getByLabelText("사건명 입력")).toBeInTheDocument()
  })

  it("2열이면 변형이 col2 다", () => {
    const { container } = render(<SearchForm columns={2} rows={ROWS} />)
    expect(container.firstElementChild).toHaveAttribute("data-part-variant", "col2")
  })

  it("조회 · 초기화 콜백을 부른다", () => {
    const onSearch = vi.fn()
    const onReset = vi.fn()
    render(<SearchForm columns={2} rows={ROWS} onSearch={onSearch} onReset={onReset} />)
    fireEvent.click(screen.getByRole("button", { name: "조회" }))
    fireEvent.click(screen.getByRole("button", { name: "초기화" }))
    expect(onSearch).toHaveBeenCalledTimes(1)
    expect(onReset).toHaveBeenCalledTimes(1)
  })

  it("콜백이 없으면 버튼 줄을 그리지 않는다", () => {
    render(<SearchForm columns={2} rows={ROWS} />)
    expect(screen.queryByRole("button")).toBeNull()
  })
})
