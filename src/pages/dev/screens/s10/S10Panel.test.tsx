import { fireEvent, render, screen, within } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it, vi } from "vitest"

import { S10Content } from "./S10DevPage"

vi.mock("sonner", () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }) }))

const renderPanel = () =>
  render(
    <MemoryRouter initialEntries={["/dev/s01?case=ready&shoe=1&as=admin"]}>
      <S10Content caseName="ready" inPanel />
    </MemoryRouter>,
  )

describe("신발 DB 패널(S10Content inPanel)", () => {
  it("쪽 제목 · 위치 표시 · 자동 넘기기 · 엑셀 없이 거르기 한 줄과 카드만 그린다", () => {
    renderPanel()
    expect(screen.queryByText("신발문양 관리")).toBeNull()
    expect(screen.queryByRole("button", { name: "엑셀" })).toBeNull()
    expect(screen.queryByRole("button", { name: /자동/ })).toBeNull()
    expect(screen.getByRole("search", { name: "신발 거르기" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "303351 열기" })).toBeInTheDocument()
  })

  it("카드를 누르면 편집 판(문양정보)이 열리고, 문양 목록에서 누르면 고른 부위에 넣고 다시 누르면 뺀다", () => {
    renderPanel()
    fireEvent.click(screen.getByRole("button", { name: "303351 열기" }))
    expect(screen.getByRole("tab", { name: "문양정보", selected: true })).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "중 부위 고르기" }))
    const grid = screen.getByRole("group", { name: "문양 격자" })
    const first = within(grid).getAllByRole("button")[0]
    const name = first.getAttribute("aria-label")!.replace(/ 넣기$/, "")
    fireEvent.click(first)
    expect(screen.getByRole("button", { name: `중 ${name} 빼기` })).toBeInTheDocument()
    fireEvent.click(within(grid).getByRole("button", { name: `${name} 빼기` }))
    expect(screen.queryByRole("button", { name: `중 ${name} 빼기` })).toBeNull()
  })
})
