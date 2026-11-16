import { fireEvent, render, screen, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { FEATURES } from "@/entities/session"

import type { CaseListRow, CaseListScreenProps } from "../model/types"
import { CaseListScreen } from "./CaseListScreen"

const ROW: CaseListRow = {
  aprthngNo: "00001-25-0646", docNo: "문서-1", caseName: "주거침입", requestOffice: "대구청", scasNo: "2025-03318",
  processOffice: "경찰청", occurOffice: "수성서", kind: "현장", shoeCount: 3, tireCount: 0, suspect: "유",
  registeredAt: "2025-07-23", confirmedAt: "", caseResult: "", receiver: "", author: "",
  results: { found: 1, missed: 1, unable: 1 }, progress: { registered: 1, searched: 0, confirmed: 2 }, thumbSrc: "data:,",
}

function props(over: Partial<CaseListScreenProps> = {}): CaseListScreenProps {
  return {
    status: "ready", onRetry: vi.fn(), isAdmin: false, features: [FEATURES.CRIME_REGISTER, FEATURES.CRIME_SEARCH],
    rows: [ROW], total: 1, page: 1, pageSize: 14, onPageChange: vi.fn(),
    onOpenCase: vi.fn(), onRegister: vi.fn(), onSearchCase: vi.fn(), onConfirmCase: vi.fn(), ...over,
  }
}

describe("CaseListScreen", () => {
  it("행을 누르면 onOpenCase(감정번호)", () => {
    const p = props()
    render(<CaseListScreen {...p} />)
    fireEvent.click(screen.getByText("00001-25-0646"))
    expect(p.onOpenCase).toHaveBeenCalledWith("00001-25-0646")
    expect(p.onOpenCase).toHaveBeenCalledTimes(1)
  })

  it("사건 진행 칸 단추는 그 단계에서 할 일 하나만(검색 안 한 장 → 검색, 확인 대기 → 확인) · 행 이동 없음", () => {
    const p = props({ rows: [ROW, { ...ROW, aprthngNo: "00001-25-0645", progress: { registered: 0, searched: 2, confirmed: 0 } }] })
    render(<CaseListScreen {...p} />)
    const [first, second] = screen.getAllByRole("row").slice(1)
    // 썸네일(이름 없는 그림 단추)은 빼고 글자 단추만
    const labels = (row: HTMLElement) => within(row).getAllByRole("button").map((b) => b.textContent).filter(Boolean)
    expect(labels(first)).toEqual(["검색"])
    expect(labels(second)).toEqual(["확인"])
    fireEvent.click(within(first).getByRole("button", { name: "검색" }))
    fireEvent.click(within(second).getByRole("button", { name: "확인" }))
    expect(p.onSearchCase).toHaveBeenCalledWith("00001-25-0646")
    expect(p.onConfirmCase).toHaveBeenCalledWith("00001-25-0645")
    expect(p.onOpenCase).not.toHaveBeenCalled()
  })

  it("보기 전용(SHOE_VIEW만)이면 등록 · 검색 · 확인 버튼이 없다", () => {
    render(<CaseListScreen {...props({ features: [FEATURES.SHOE_VIEW] })} />)
    expect(screen.queryByRole("button", { name: "등록" })).toBeNull()
    expect(screen.queryByRole("button", { name: "검색" })).toBeNull()
    expect(screen.queryByRole("button", { name: "확인" })).toBeNull()
  })

  it("11/17 컴팩트: 머리 · 행이 같은 격자 클래스, 열 8개 · 엑셀 · 열 선택 · 상세 검색 · 「결재」 글자 없음", () => {
    const row: CaseListRow = { ...ROW, progress: { registered: 0, searched: 0, confirmed: 3 }, stage: 3 }
    const { container } = render(<CaseListScreen {...props({ rows: [row] })} />)
    const [head, body] = screen.getAllByRole("row")
    const gridOf = (el: HTMLElement) => el.className.split(" ").find((c) => c.startsWith("grid-cols-"))
    expect(gridOf(head)).toBe(gridOf(body))
    expect(screen.getAllByRole("columnheader")).toHaveLength(8)
    expect(screen.queryByRole("button", { name: "엑셀" })).toBeNull()
    expect(screen.queryByRole("button", { name: /열 선택/ })).toBeNull()
    expect(screen.queryByRole("button", { name: "상세 검색" })).toBeNull()
    expect(container.textContent).not.toMatch(/결재/)
    expect(screen.getByText("감정서")).toBeInTheDocument()
  })

  it("검증요청 · 검증은 onMockAction 으로 이름을 알리고, +α 를 끄면 [data-plus] 가 없다", () => {
    const onMockAction = vi.fn()
    const rows: CaseListRow[] = [
      { ...ROW, progress: { registered: 0, searched: 0, confirmed: 2 }, stage: 0 },
      { ...ROW, aprthngNo: "00001-25-0640", progress: { registered: 0, searched: 0, confirmed: 2 }, stage: 1 },
    ]
    const { container, rerender } = render(<CaseListScreen {...props({ rows, onMockAction })} />)
    fireEvent.click(screen.getByRole("button", { name: "검증요청" }))
    fireEvent.click(screen.getByRole("button", { name: "검증" }))
    expect(onMockAction.mock.calls.map((c) => c[0])).toEqual(["검증요청", "검증"])
    rerender(<CaseListScreen {...props({ rows, showPlus: false })} />)
    expect(container.querySelectorAll("[data-plus]")).toHaveLength(0)
  })
})
