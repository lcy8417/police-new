import { fireEvent, render, screen, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import type { CaseWindowImage, CaseWindowProps } from "../model/types"
import { CaseWindow } from "./CaseWindow"

const IMAGES: CaseWindowImage[] = [
  { no: "1", imageNo: "00001-25-0649_1", kind: "신발", status: "발견" },
  { no: "2", imageNo: "00001-25-0649_2", kind: "신발", status: "검색됨" },
  { no: "3", imageNo: "00001-25-0649_3", kind: "타이어", status: "등록" },
]

function setup(over: Partial<CaseWindowProps> = {}) {
  const props: CaseWindowProps = {
    summary: { aprthngNo: "00001-25-0649", caseName: "주거침입", requestOffice: "대구청", registeredAt: "2025-07-24", imageCount: 3, stageLabel: "이미지 확인 중" },
    images: IMAGES,
    selectedImage: "2",
    tab: "info",
    openCases: [
      { aprthngNo: "00001-25-0649", caseName: "주거침입" },
      { aprthngNo: "00001-25-0647", caseName: "절도" },
    ],
    onClose: vi.fn(),
    onPrev: vi.fn(),
    onNext: vi.fn(),
    onSelectImage: vi.fn(),
    onSelectTab: vi.fn(),
    onSelectOpenCase: vi.fn(),
    onCloseOpenCase: vi.fn(),
    onConfirmResult: vi.fn(),
    children: <p>본문 내용</p>,
    ...over,
  }
  render(<CaseWindow {...props} />)
  return props
}

describe("CaseWindow", () => {
  it("dialog 이름 · 머리 꼬리표 · 본문 슬롯", () => {
    setup()
    const dialog = screen.getByRole("dialog", { name: "00001-25-0649 주거침입 사건 창" })
    expect(within(dialog).getByText("대구청")).toBeInTheDocument()
    expect(within(dialog).getByText("3장")).toBeInTheDocument()
    expect(within(dialog).getByText("이미지 확인 중")).toBeInTheDocument()
    expect(within(dialog).getByRole("tabpanel")).toHaveTextContent("본문 내용")
  })

  it("왼쪽 목록: 줄 수 = 장수, 신발 · 타이어 묶음, 고른 줄 aria-current, 누르면 그 이미지", () => {
    const props = setup()
    const rail = screen.getByRole("navigation", { name: "00001-25-0649 현장 이미지" })
    const rows = within(rail).getAllByRole("button")
    expect(rows).toHaveLength(3)
    expect(within(rail).getByText("타이어")).toBeInTheDocument()
    expect(rows[1]).toHaveAttribute("aria-current", "true")
    expect(rows[0]).toHaveTextContent("발견")
    fireEvent.click(rows[2])
    expect(props.onSelectImage).toHaveBeenCalledWith("3")
  })

  it("작업 탭: 이미지 탭 5개 + 끝의 사건 단위 「결과 확인」", () => {
    const props = setup({ tab: "search" })
    const tabs = within(screen.getByRole("tablist", { name: "작업" })).getAllByRole("tab")
    expect(tabs.map((t) => t.textContent)).toEqual(["사건 정보", "이미지 편집", "문양 코드", "검색 결과", "정밀 대조", "결과 확인사건 전체"])
    expect(tabs[3]).toHaveAttribute("aria-selected", "true")
    fireEvent.click(tabs[4])
    expect(props.onSelectTab).toHaveBeenCalledWith("compare")
    fireEvent.click(tabs[5])
    expect(props.onConfirmResult).toHaveBeenCalled()
  })

  it("열린 사건 탭 줄: 지금 사건이 고른 탭, 다른 탭 누름 · 닫기", () => {
    const props = setup()
    const strip = screen.getByRole("tablist", { name: "열린 사건" })
    expect(within(strip).getByRole("tab", { name: "00001-25-0649 · 주거침입" })).toHaveAttribute("aria-selected", "true")
    fireEvent.click(within(strip).getByRole("tab", { name: "00001-25-0647 · 절도" }))
    expect(props.onSelectOpenCase).toHaveBeenCalledWith("00001-25-0647")
    fireEvent.click(screen.getByRole("button", { name: "00001-25-0647 · 절도 탭 닫기" }))
    expect(props.onCloseOpenCase).toHaveBeenCalledWith("00001-25-0647")
  })

  it("‹ › 잠김 · ✕ 닫기", () => {
    const props = setup({ prevOff: true })
    expect(screen.getByRole("button", { name: "앞 사건" })).toBeDisabled()
    fireEvent.click(screen.getByRole("button", { name: "다음 사건" }))
    fireEvent.click(screen.getByRole("button", { name: "창 닫기" }))
    expect(props.onNext).toHaveBeenCalled()
    expect(props.onClose).toHaveBeenCalled()
  })
})
