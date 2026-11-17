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

  it("전체 0 이면 범위 없이 「전체 0」", () => {
    render(<Pagination total={0} page={1} pageSize={20} hasNext={false} onPageChange={() => {}} />)
    expect(screen.getByText("전체 0")).toBeInTheDocument()
  })

  it("마지막 쪽을 넘는 쪽 번호는 마지막 쪽 범위로 보인다", () => {
    render(<Pagination total={116} page={9} pageSize={20} hasNext={false} onPageChange={() => {}} />)
    expect(screen.getByText("전체 116 중 101-116")).toBeInTheDocument()
  })

  it("첫 쪽은 이전이 막힌다", () => {
    const onPageChange = vi.fn()
    render(<Pagination total={50} page={1} pageSize={20} hasNext onPageChange={onPageChange} />)
    const prev = screen.getByRole("button", { name: "이전" })
    expect(prev).toBeDisabled()
    fireEvent.click(prev)
    expect(onPageChange).not.toHaveBeenCalled()
  })

  it("hasNext 가 false 면 다음이 막힌다", () => {
    render(<Pagination total={50} page={3} pageSize={20} hasNext={false} onPageChange={() => {}} />)
    expect(screen.getByRole("button", { name: "다음" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "이전" })).toBeEnabled()
  })

  it("jump: 쪽 번호를 넣고 Enter → 그 쪽, 범위 밖은 처음 · 끝으로 맞춤", () => {
    const onPageChange = vi.fn()
    const { container } = render(
      <Pagination jump total={115788} page={33} pageSize={50} hasNext onPageChange={onPageChange} />
    )
    expect(container.firstElementChild).toHaveAttribute("data-part-variant", "jump")
    expect(screen.getByText("전체 115788 중 1601-1650")).toBeInTheDocument()
    expect(screen.getByText("/ 2316쪽")).toBeInTheDocument()
    const input = screen.getByRole("textbox", { name: "쪽 번호" })
    expect(input).toHaveValue("33")
    fireEvent.change(input, { target: { value: "120" } })
    fireEvent.keyDown(input, { key: "Enter" })
    expect(onPageChange).toHaveBeenLastCalledWith(120)
    fireEvent.change(input, { target: { value: "99999" } })
    fireEvent.click(screen.getByRole("button", { name: "이동" }))
    expect(onPageChange).toHaveBeenLastCalledWith(2316)
    fireEvent.change(input, { target: { value: "0" } })
    fireEvent.keyDown(input, { key: "Enter" })
    expect(onPageChange).toHaveBeenLastCalledWith(1)
  })

  it("jump: 숫자가 아니거나 지금 쪽이면 가지 않고 지금 쪽 번호로 돌아간다", () => {
    const onPageChange = vi.fn()
    render(<Pagination jump total={500} page={3} pageSize={50} hasNext onPageChange={onPageChange} />)
    const input = screen.getByRole("textbox", { name: "쪽 번호" })
    fireEvent.change(input, { target: { value: "abc" } })
    fireEvent.keyDown(input, { key: "Enter" })
    fireEvent.change(input, { target: { value: "3" } })
    fireEvent.keyDown(input, { key: "Enter" })
    expect(onPageChange).not.toHaveBeenCalled()
    expect(input).toHaveValue("3")
  })

  it("jump: 처음 · 끝 단추, 첫 쪽은 처음 · 이전이 막히고 끝 쪽은 다음 · 끝이 막힌다", () => {
    const onPageChange = vi.fn()
    const { rerender } = render(<Pagination jump total={500} page={4} pageSize={50} hasNext onPageChange={onPageChange} />)
    fireEvent.click(screen.getByRole("button", { name: "끝" }))
    expect(onPageChange).toHaveBeenLastCalledWith(10)
    fireEvent.click(screen.getByRole("button", { name: "처음" }))
    expect(onPageChange).toHaveBeenLastCalledWith(1)
    rerender(<Pagination jump total={500} page={1} pageSize={50} hasNext onPageChange={onPageChange} />)
    expect(screen.getByRole("button", { name: "처음" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "이전" })).toBeDisabled()
    rerender(<Pagination jump total={500} page={10} pageSize={50} hasNext={false} onPageChange={onPageChange} />)
    expect(screen.getByRole("button", { name: "다음" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "끝" })).toBeDisabled()
    expect(screen.getByRole("textbox", { name: "쪽 번호" })).toHaveValue("10")
  })

  it("jump 이라도 전체 개수를 모르면 기본 모양(쪽 번호 칸 없음)", () => {
    render(<Pagination jump page={2} pageSize={20} hasNext onPageChange={() => {}} />)
    expect(screen.queryByRole("textbox", { name: "쪽 번호" })).toBeNull()
    expect(screen.getByText("21-40")).toBeInTheDocument()
  })

  it("이전 · 다음은 쪽 번호로 콜백", () => {
    const onPageChange = vi.fn()
    render(<Pagination total={100} page={2} pageSize={20} hasNext onPageChange={onPageChange} />)
    fireEvent.click(screen.getByRole("button", { name: "다음" }))
    expect(onPageChange).toHaveBeenLastCalledWith(3)
    fireEvent.click(screen.getByRole("button", { name: "이전" }))
    expect(onPageChange).toHaveBeenLastCalledWith(1)
  })
})
