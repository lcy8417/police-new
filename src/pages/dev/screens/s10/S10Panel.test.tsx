import { act, fireEvent, render, screen, within } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it, vi } from "vitest"

import { S10_EXTRACT_MS } from "./mock-cases"
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

  it("카드를 누르면 편집 판이 한 화면(기본정보 · 4부위 · 문양 목록 — 탭 없음)으로 열리고, 목록에서 누르면 고른 부위에 넣고 다시 누르면 뺀다", () => {
    renderPanel()
    fireEvent.click(screen.getByRole("button", { name: "303351 열기" }))
    expect(screen.queryByRole("tab", { name: "문양정보" })).toBeNull()
    expect(screen.getByRole("region", { name: "기본정보" })).toBeInTheDocument()
    const board = screen.getByRole("group", { name: "부위별 문양" })
    fireEvent.click(within(board).getByRole("button", { name: /^중 부위/ }))
    const lib = screen.getByRole("region", { name: "문양 목록" })
    const first = within(lib).getAllByRole("button", { name: /^중에 .+ 넣기$/ })[0]
    const name = first.getAttribute("aria-label")!.replace(/^중에 /, "").replace(/ 넣기$/, "")
    fireEvent.click(first)
    expect(within(board).getByRole("button", { name: `빼기 · 중 ${name}` })).toBeInTheDocument()
    fireEvent.click(within(lib).getByRole("button", { name: `중에서 ${name} 빼기` }))
    expect(within(board).queryByRole("button", { name: `빼기 · 중 ${name}` })).toBeNull()
  })

  it("2회차 검수 — AI 추출 출처는 부위별(윤곽 없음), 한 장 · 모두 확인해도 수동이 아니라 「AI · 확인」으로 남는다", () => {
    vi.useFakeTimers()
    try {
      renderPanel()
      fireEvent.click(screen.getByRole("button", { name: "303351 열기" }))
      fireEvent.click(screen.getByRole("button", { name: /AI 문양 추출/ }))
      act(() => {
        vi.advanceTimersByTime(S10_EXTRACT_MS)
      })
      const board = screen.getByRole("group", { name: "부위별 문양" })
      const zone = (z: string) => board.querySelector(`[data-drop-zone="${z}"]`) as HTMLElement
      expect(zone("outline").querySelectorAll('[data-card-status="suggested"]')).toHaveLength(0)
      const suggested = board.querySelectorAll('[data-card-status="suggested"]')
      expect(suggested.length).toBeGreaterThan(0)
      // 한 장 확인
      fireEvent.click(within(suggested[0] as HTMLElement).getByRole("button", { name: /확인/ }))
      expect(board.querySelectorAll('[data-card-status="suggested"]')).toHaveLength(suggested.length - 1)
      // 모두 확인 → 제안 0, AI · 확인으로 남음
      fireEvent.click(screen.getByRole("button", { name: "모두 확인" }))
      expect(board.querySelectorAll('[data-card-status="suggested"]')).toHaveLength(0)
      expect(board.querySelectorAll('[data-card-status="ai"]')).toHaveLength(suggested.length)
    } finally {
      vi.useRealTimers()
    }
  })

  it("2회차 검수 — 상세 필터는 「조회」를 눌러야 목록에 걸리고, 「조건 지우기」로 풀린다", () => {
    renderPanel()
    fireEvent.click(screen.getByRole("button", { name: /^필터/ }))
    fireEvent.change(screen.getByRole("textbox", { name: "화류번호" }), { target: { value: "303351" } })
    // 입력만으로는 그대로
    expect(screen.getAllByRole("button", { name: / 열기$/ }).length).toBeGreaterThan(1)
    fireEvent.click(screen.getByRole("button", { name: "조회" }))
    expect(screen.getAllByRole("button", { name: / 열기$/ }).map((b) => b.getAttribute("aria-label"))).toEqual(["303351 열기"])
    fireEvent.click(screen.getByRole("button", { name: "조건 지우기" }))
    expect(screen.getAllByRole("button", { name: / 열기$/ }).length).toBeGreaterThan(1)
  })
})
