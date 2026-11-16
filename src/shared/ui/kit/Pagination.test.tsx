import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { Pagination } from "./Pagination"

describe("Pagination", () => {
  it("전체 개수가 있으면 「전체 n 중 a-b」", () => {
    const { container } = render(
      <Pagination total={116} page={1} pageSize={20} hasNext onPageChange={() => {}} partId="S01-34" />
    )
    expect(screen.getByText("전체 116 중 1-20")).toBeInTheDocument()
    expect(container.firstElementChild).toHaveAttribute("data-part", "Pagination")
    expect(container.firstElementChild).toHaveAttribute("data-part-id", "S01-34")
  })

  it("마지막 쪽은 끝 번호를 전체 개수로 자른다", () => {
    render(<Pagination total={116} page={6} pageSize={20} hasNext={false} onPageChange={() => {}} />)
    expect(screen.getByText("전체 116 중 101-116")).toBeInTheDocument()
  })

  it("전체 개수가 없으면 「a-b」만", () => {
    render(<Pagination page={2} pageSize={20} hasNext onPageChange={() => {}} />)
    expect(screen.getByText("21-40")).toBeInTheDocument()
    expect(screen.queryByText(/전체/)).toBeNull()
  })

  it("첫 쪽은 이전이 막힌다", () => {
    const onPageChange = vi.fn()
    render(<Pagination total={50} page={1} pageSize={20} hasNext onPageChange={onPageChange} />)
    const prev = screen.getByRole("button", { name: "이전 쪽" })
    expect(prev).toBeDisabled()
    fireEvent.click(prev)
    expect(onPageChange).not.toHaveBeenCalled()
  })

  it("hasNext 가 false 면 다음이 막힌다", () => {
    render(<Pagination total={50} page={3} pageSize={20} hasNext={false} onPageChange={() => {}} />)
    expect(screen.getByRole("button", { name: "다음 쪽" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "이전 쪽" })).toBeEnabled()
  })

  it("이전 · 다음은 쪽 번호로 콜백", () => {
    const onPageChange = vi.fn()
    render(<Pagination total={100} page={2} pageSize={20} hasNext onPageChange={onPageChange} />)
    fireEvent.click(screen.getByRole("button", { name: "다음 쪽" }))
    expect(onPageChange).toHaveBeenLastCalledWith(3)
    fireEvent.click(screen.getByRole("button", { name: "이전 쪽" }))
    expect(onPageChange).toHaveBeenLastCalledWith(1)
  })
})
