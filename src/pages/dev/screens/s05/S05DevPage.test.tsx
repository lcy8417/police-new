import { fireEvent, render, screen, within } from "@testing-library/react"
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom"
import { describe, expect, it } from "vitest"

import { S05DevPage } from "./S05DevPage"

function Where() {
  const { pathname, search } = useLocation()
  return <p data-testid="where">{`${pathname}${search}`}</p>
}

const renderAt = (query: string) =>
  render(
    <MemoryRouter initialEntries={[`/dev/s05${query}`]}>
      <Routes>
        <Route path="/dev/s05" element={<S05DevPage />} />
        <Route path="/dev/s06" element={<Where />} />
      </Routes>
    </MemoryRouter>
  )

const card = (ftwrId: string) => screen.getByText(`No. ${ftwrId}`).closest("[data-result-card]") as HTMLElement

describe("S05 검색 결과 진열 페이지", () => {
  it("ready 케이스에 결과 카드(No. · #순위 · 유사도 % · TOP)를 그린다", () => {
    renderAt("?case=ready")
    const first = card("00758")
    expect(within(first).getByText("#1")).toBeInTheDocument()
    expect(within(first).getByText("TOP 1")).toBeInTheDocument()
    // 2위 69.99 → 「70%」(퍼센트 0~100 응답을 반올림)
    expect(within(card("305659")).getByText("70%")).toBeInTheDocument()
    expect(within(card("305659")).getByText("TOP 2")).toBeInTheDocument()
  })

  it("신발 ID 앞자리 0을 지킨다(00758)", () => {
    renderAt("?case=ready")
    expect(screen.getByText("No. 00758")).toBeInTheDocument()
    expect(screen.queryByText("No. 758")).toBeNull()
  })

  it("4위부터는 TOP 표시가 없다", () => {
    renderAt("?case=ready")
    const cards = document.querySelectorAll("[data-result-card]")
    expect(within(cards[3] as HTMLElement).queryByText(/TOP/)).toBeNull()
  })

  it("유사도 색 등급: 80 이상 ok · 60 이상 warn · 그 아래 danger", () => {
    renderAt("?case=ready")
    expect(within(card("00758")).getByText("84%").closest("[data-grade]")).toHaveAttribute("data-grade", "ok")
    expect(within(card("305659")).getByText("70%").closest("[data-grade]")).toHaveAttribute("data-grade", "warn")
    const cards = document.querySelectorAll("[data-result-card]")
    const last = cards[cards.length - 1] as HTMLElement
    expect(last.querySelector("[data-grade]")).toHaveAttribute("data-grade", "danger")
  })

  it("결과형태 1–4열 Segmented 로 열 수가 바뀐다", () => {
    renderAt("?case=ready")
    const seg = screen.getByRole("group", { name: "결과형태" })
    expect(seg).toHaveAttribute("data-part", "Segmented")
    expect(within(seg).getAllByRole("button").map((b) => b.textContent)).toEqual(["1열", "2열", "3열", "4열"])
    const grid = document.querySelector("[data-result-grid]") as HTMLElement
    expect(grid).toHaveAttribute("data-columns", "4")
    fireEvent.click(within(seg).getByRole("button", { name: "2열" }))
    expect(grid).toHaveAttribute("data-columns", "2")
  })

  it("「이진화보기」/「원본보기」 문자열 그대로 전환한다(제어형)", () => {
    renderAt("?case=ready")
    const binary = screen.getByRole("button", { name: "이진화보기" })
    const raw = screen.getByRole("button", { name: "원본보기" })
    expect(binary).toHaveAttribute("aria-pressed", "true")
    fireEvent.click(raw)
    expect(screen.getByRole("button", { name: "원본보기" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByRole("button", { name: "이진화보기" })).toHaveAttribute("aria-pressed", "false")
  })

  it("Pagination 으로 다음 쪽에 가면 순위가 이어진다", () => {
    renderAt("?case=ready")
    expect(document.querySelector('[data-part="Pagination"]')).not.toBeNull()
    expect(screen.getByText("전체 857 중 1-20")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: /다음/ }))
    expect(screen.getByText("전체 857 중 21-40")).toBeInTheDocument()
    expect(screen.getByText("#21")).toBeInTheDocument()
  })

  it("카드를 누르면 S06 으로 가고 보는 사람(as)을 유지한다", () => {
    renderAt("?case=ready&as=admin")
    fireEvent.click(card("00758"))
    expect(screen.getByTestId("where")).toHaveTextContent("/dev/s06?ftwr=00758&rank=1&as=admin")
  })

  it("loading 케이스는 aria-busy=\"true\"", () => {
    const { container } = renderAt("?case=loading")
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
    expect(document.querySelector("[data-result-card]")).toBeNull()
  })

  it("error 케이스는 「다시」 버튼이 있고 「결과 없음」이 없다", () => {
    renderAt("?case=error")
    expect(screen.getByRole("button", { name: "다시" })).toBeInTheDocument()
    expect(screen.queryByText(/결과 없음/)).toBeNull()
    expect(document.querySelector("[data-result-card]")).toBeNull()
  })

  it("empty 케이스는 「결과 없음」을 보인다", () => {
    renderAt("?case=empty")
    expect(screen.getByText(/결과 없음/)).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "다시" })).toBeNull()
  })

  it("readonly 보기에서 쓰기 버튼(확인대상 등록 류)이 없거나 disabled", () => {
    renderAt("?case=ready&as=readonly")
    // 이 화면에 지금 기능의 쓰기 동작은 없다. SCAS 「확인대상보기」는 준비 중(비활성)
    expect(screen.getByRole("button", { name: "확인대상보기" })).toBeDisabled()
    expect(screen.queryByRole("button", { name: /저장|등록/ })).toBeNull()
  })

  it("시안의 +α(AI가 먼저 보라는 10건 · 유사도 분포 · 빠른 비교 · 확인대상 ★)는 담지 않는다", () => {
    renderAt("?case=ready")
    expect(screen.queryByText(/AI가 먼저 보라는/)).toBeNull()
    expect(screen.queryByText(/유사도 분포/)).toBeNull()
    expect(screen.queryByText(/빠른 비교/)).toBeNull()
    expect(screen.queryByText("★")).toBeNull()
  })
})
