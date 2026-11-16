import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { FEATURES } from "@/entities/session"

import type { CaseListFilters, CaseListRow, CaseListScreenProps } from "../model/types"
import { CaseListScreen } from "./CaseListScreen"

const FILTERS: CaseListFilters = {
  aprthngNo: "", docNo: "", caseName: "", registeredFrom: "", registeredTo: "", victim: "", kind: "all",
  place: "", arrested: "", author: "", processOffice: "", requestOffice: "", occurOffice: "", caseResult: "",
  awaitingResult: false, otherOrg: "",
}

const ROW: CaseListRow = {
  aprthngNo: "00001-25-0646", docNo: "문서-1", caseName: "주거침입", requestOffice: "대구청", scasNo: "2025-03318",
  processOffice: "경찰청", occurOffice: "수성서", kind: "현장", shoeCount: 3, tireCount: 0, suspect: "유",
  registeredAt: "2025-07-23", confirmedAt: "", caseResult: "", receiver: "", author: "",
  results: { found: 1, missed: 1, unable: 1 }, progress: { registered: 1, searched: 0, confirmed: 2 }, thumbSrc: "data:,",
}

function props(over: Partial<CaseListScreenProps> = {}): CaseListScreenProps {
  return {
    status: "ready", onRetry: vi.fn(), isAdmin: false, features: [FEATURES.CRIME_REGISTER, FEATURES.CRIME_SEARCH],
    rows: [ROW], total: 1, page: 1, pageSize: 14, onPageChange: vi.fn(), filters: FILTERS, onFiltersChange: vi.fn(),
    onSearch: vi.fn(), onReset: vi.fn(),    onOpenCase: vi.fn(), onRegister: vi.fn(), onSearchCase: vi.fn(), onConfirmCase: vi.fn(), ...over,
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

  it("행 끝 「검색」 · 「확인」 은 행 이동 없이 각 콜백만 부른다", () => {
    const p = props()
    render(<CaseListScreen {...p} />)
    fireEvent.click(screen.getByRole("button", { name: "검색" }))
    fireEvent.click(screen.getByRole("button", { name: "확인" }))
    expect(p.onSearchCase).toHaveBeenCalledWith("00001-25-0646")
    expect(p.onConfirmCase).toHaveBeenCalledWith("00001-25-0646")
    expect(p.onOpenCase).not.toHaveBeenCalled()
  })

  it("보기 전용(SHOE_VIEW만)이면 등록 · 검색 · 확인 버튼이 없다", () => {
    render(<CaseListScreen {...props({ features: [FEATURES.SHOE_VIEW] })} />)
    expect(screen.queryByRole("button", { name: "등록" })).toBeNull()
    expect(screen.queryByRole("button", { name: "검색" })).toBeNull()
    expect(screen.queryByRole("button", { name: "확인" })).toBeNull()
  })

  it("「SCAS 열 전체 보기」는 열 25개", () => {
    const { container } = render(<CaseListScreen {...props()} />)
    expect(container.querySelectorAll("thead th")).toHaveLength(14)
    fireEvent.click(screen.getByRole("button", { name: /SCAS 열 전체 보기/ }))
    expect(container.querySelectorAll("thead th")).toHaveLength(25)
  })
})
