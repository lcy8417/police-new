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

  it("결과형태 1–4열 Segmented 로 열 수가 바뀐다(신규 기능 끔 — 1차 기본 4열)", () => {
    renderAt("?case=ready&plus=0")
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
    // 상세조회 칸(+α)에도 「다음」이 있어 쪽 넘김 안에서 찾는다
    const pager = document.querySelector('[data-part="Pagination"]') as HTMLElement
    fireEvent.click(within(pager).getByRole("button", { name: /다음/ }))
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

  it("readonly 보기에서 쓰기 버튼(확인대상 등록 류)이 없거나 disabled(신규 기능 끔 — 1차 그대로)", () => {
    renderAt("?case=ready&as=readonly&plus=0")
    // 이 화면에 지금 기능의 쓰기 동작은 없다. SCAS 「확인대상보기」는 준비 중(비활성)
    expect(screen.getByRole("button", { name: "확인대상보기" })).toBeDisabled()
    expect(screen.queryByRole("button", { name: /저장|등록/ })).toBeNull()
  })

  it("?plus=0 이면 [data-plus] 가 하나도 없고 1차 내용(카드 · 전체 건수 · 쪽 넘김)은 그대로", () => {
    renderAt("?case=ready&plus=0")
    expect(document.querySelectorAll("[data-plus]")).toHaveLength(0)
    expect(screen.queryByText(/AI가 먼저 보라는/)).toBeNull()
    expect(screen.queryByText(/유사도 분포/)).toBeNull()
    expect(screen.queryByText("★")).toBeNull()
    expect(screen.getByText("전체 857건")).toBeInTheDocument()
    expect(document.querySelectorAll("[data-result-card]")).toHaveLength(20)
    expect(screen.getByText("No. 00758")).toBeInTheDocument()
    expect(document.querySelector('[data-part="Pagination"]')).not.toBeNull()
  })
})

describe("S05 r2 — 시안 +α", () => {
  it("대표 +α 가 시안 문구로 보인다(AI 10건 · 유사도 분포 · 본 위치 · 보기 거르기 · 상세조회 칸)", () => {
    renderAt("?case=ready")
    expect(screen.getByText("AI가 먼저 보라는 10건")).toBeInTheDocument()
    expect(document.querySelectorAll("[data-ai-top-item]")).toHaveLength(10)
    expect(screen.getByText("상·중 헤링본 주기 일치")).toBeInTheDocument()
    expect(screen.getByText("유사도 분포")).toBeInTheDocument()
    expect(screen.getByText("136위 / 857건")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "이미 본 것 흐리게" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByText("현장문양검색결과 상세조회")).toBeInTheDocument()
    expect(screen.getByText("1위 / 857건")).toBeInTheDocument()
  })

  it("+α 를 켜면 결과형태 기본은 「촘촘 8열」이고 1–4열로 바꿀 수 있다", () => {
    renderAt("?case=ready")
    const grid = document.querySelector("[data-result-grid]") as HTMLElement
    expect(grid).toHaveAttribute("data-columns", "8")
    expect(screen.getByRole("button", { name: "촘촘 8열" })).toHaveAttribute("aria-pressed", "true")
    fireEvent.click(within(screen.getByRole("group", { name: "결과형태" })).getByRole("button", { name: "4열" }))
    expect(grid).toHaveAttribute("data-columns", "4")
  })

  it("「137위부터 이어 보기」 → 137위 쪽으로 가고, 본 위치 선 · 빠른 비교 창이 뜬다", () => {
    renderAt("?case=ready")
    fireEvent.click(screen.getByRole("button", { name: "137위부터 이어 보기" }))
    expect(document.querySelector('[data-result-card][data-rank="137"]')).not.toBeNull()
    expect(screen.getByText("여기까지 봤음 · 136위 · 07-24 17:52")).toBeInTheDocument()
    const peek = screen.getByRole("dialog", { name: "빠른 비교" })
    expect(within(peek).getByText("137위 · 305102 · 58.4%")).toBeInTheDocument()
    expect(within(peek).getByText("하 부위 다름 → 확인대상 신중")).toBeInTheDocument()
    // 이미 본 카드(136위 이하)는 흐리게, 137위는 초점
    expect(document.querySelector('[data-result-card][data-rank="136"]')).toHaveAttribute("data-seen", "true")
    expect(document.querySelector('[data-result-card][data-rank="137"]')).toHaveAttribute("data-focus", "true")
  })

  it("카드 ☆ 를 누르면 확인대상 칸에 들어간다(제어형)", () => {
    renderAt("?case=ready")
    const box = document.querySelector("[data-target-box]") as HTMLElement
    expect(within(box).getByText("2건")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "1위 00758 확인대상 넣기" }))
    expect(within(box).getByText("3건")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "1위 00758 확인대상 빼기" })).toHaveAttribute("aria-pressed", "true")
  })

  it("보는 사람 — 감정관은 ☆ · 그룹등록 · 확인 막대, 기술책임자는 「기술책임자 · 보기만」 + 잠김", () => {
    const a = renderAt("?case=ready&as=analyst")
    expect(screen.getByRole("button", { name: "1위 00758 확인대상 넣기" })).toBeEnabled()
    expect(screen.getByRole("button", { name: "그룹등록" })).toBeEnabled()
    expect(screen.getByText("확인대상에 등록하시겠습니까?")).toBeInTheDocument()
    expect(screen.queryByText("기술책임자 · 보기만")).toBeNull()
    expect(screen.queryByText("수사관 · 볼 수 없음")).toBeNull()
    a.unmount()

    renderAt("?case=ready&as=verifier")
    expect(screen.getByText("기술책임자 · 보기만")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "1위 00758 확인대상 넣기" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "그룹등록" })).toBeDisabled()
    expect(screen.getAllByRole("button", { name: "확인대상 제외" })[0]).toBeDisabled()
    expect(screen.queryByText("확인대상에 등록하시겠습니까?")).toBeNull()
  })

  it("보는 사람 — 수사관에게는 「수사관 · 볼 수 없음」", () => {
    renderAt("?case=ready&as=investigator")
    expect(screen.getByText("수사관 · 볼 수 없음")).toBeInTheDocument()
    expect(screen.queryByText("기술책임자 · 보기만")).toBeNull()
  })

  it("움직임 줄이기: 움직임은 모두 motion-safe: 로만, 막대는 목표 폭(끝난 모양)", () => {
    renderAt("?case=ready")
    fireEvent.click(screen.getByRole("button", { name: "137위부터 이어 보기" }))
    const animated = Array.from(document.querySelectorAll('[class*="animate-"]')).flatMap((el) =>
      String(el.getAttribute("class"))
        .split(/\s+/)
        .filter((c) => c.includes("animate-")),
    )
    expect(animated.length).toBeGreaterThan(0)
    expect(animated.every((c) => c.startsWith("motion-safe:"))).toBe(true)
    // 훑기 선(ScanOverlay)이 초점 카드에 있고, 유사도 막대 채움은 인라인 목표 폭
    expect(document.querySelector('[data-result-card][data-rank="137"] [data-part="ScanOverlay"]')).not.toBeNull()
    const fill = document.querySelector('[data-result-card][data-rank="137"] [data-part="AiProgress"] i') as HTMLElement
    expect(fill.style.width).toMatch(/%$/)
  })
})
