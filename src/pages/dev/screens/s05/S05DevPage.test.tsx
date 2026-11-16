import { act, fireEvent, render, screen, within } from "@testing-library/react"
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { S05DevPage } from "./S05DevPage"

const toastMock = vi.hoisted(() => Object.assign(vi.fn(), { success: vi.fn() }))
vi.mock("sonner", () => ({ toast: toastMock }))

// r3 보기 설정은 localStorage 에 기억되므로 테스트마다 비운다
beforeEach(() => {
  window.localStorage.clear()
  toastMock.mockClear()
})

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

  it("결과형태 1–4열 Segmented 로 열 수가 바뀐다(신규 기능 끔 — 1차 기본 4열 · r3 확장 5 · 6열)", () => {
    renderAt("?case=ready&plus=0")
    const seg = screen.getByRole("group", { name: "결과형태" })
    expect(seg).toHaveAttribute("data-part", "Segmented")
    expect(within(seg).getAllByRole("button").map((b) => b.textContent).slice(0, 4)).toEqual(["1열", "2열", "3열", "4열"])
    // r3 확장
    expect(within(seg).getAllByRole("button").map((b) => b.textContent).slice(4)).toEqual(["5열", "6열"])
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

// ── r3 편의: 필터 · 보기 개수 · 썸네일 · 자동 모드 · 단축키 · 전체 화면 ──

const cardCount = () => document.querySelectorAll("[data-result-card]").length
const focusedRank = () => document.querySelector('[data-result-card][data-focus="true"]')?.getAttribute("data-rank") ?? null
const bar = () => screen.getByRole("search")
const chip = (name: RegExp) => within(bar()).getByRole("button", { name })
const tick = (ms: number) => act(() => void vi.advanceTimersByTime(ms))
// 여러 걸음은 한 걸음씩(브라우저처럼 걸음 사이에 화면이 다시 그려지게)
const steps = (n: number, ms: number) => {
  for (let i = 0; i < n; i++) tick(ms)
}
const pressKey = (key: string) => fireEvent.keyDown(window, { key })
const goAuto = () => fireEvent.click(within(screen.getByRole("group", { name: "이동 방식" })).getByRole("button", { name: "자동" }))

describe("S05 r3 — 필터 · 빠른 찾기", () => {
  it("유사도 등급 칩이 지금 쪽을 거르고, 결과 개수 「n / 전체 m」, 조건 지우기로 돌아온다", () => {
    renderAt("?case=ready")
    expect(cardCount()).toBe(20)
    fireEvent.click(chip(/^80↑/))
    expect(cardCount()).toBe(1)
    expect(screen.getByText("No. 00758")).toBeInTheDocument()
    expect(within(bar()).getByText("1 / 전체 20")).toBeInTheDocument()
    fireEvent.click(chip(/^60↑/))
    // 묶음 안은 「또는」 — 80 이상 1 + 60~80 8
    expect(cardCount()).toBe(9)
    fireEvent.click(within(bar()).getByRole("button", { name: "조건 지우기" }))
    expect(cardCount()).toBe(20)
  })

  it("빠른 찾기는 화류번호 · 상표로 거른다", () => {
    renderAt("?case=ready")
    const input = within(bar()).getByRole("textbox", { name: "검색어" })
    fireEvent.change(input, { target: { value: "크록스" } })
    expect(cardCount()).toBe(4)
    fireEvent.change(input, { target: { value: "305659" } })
    expect(cardCount()).toBe(1)
    expect(screen.getByText("No. 305659")).toBeInTheDocument()
  })

  it("+α 칩 — AI 10건만 · 확인대상 ★, 결과가 0건이면 「조건에 맞는 항목 없음 · 조건 지우기」(조회 실패 · 결과 없음과 다른 모양)", () => {
    renderAt("?case=ready")
    fireEvent.click(chip(/^AI 10건만/))
    expect(cardCount()).toBe(9)
    fireEvent.click(chip(/^AI 10건만/))
    fireEvent.click(chip(/^확인대상 ★/))
    expect(cardCount()).toBe(1)
    expect(document.querySelector('[data-result-card][data-rank="2"]')).not.toBeNull()
    fireEvent.click(chip(/^확인대상 ★/))
    // 1쪽은 모두 본 것(136위까지) → 안 본 것만 = 0건
    fireEvent.click(chip(/^안 본 것/))
    const empty = document.querySelector("[data-filter-empty]") as HTMLElement
    expect(within(empty).getByText("조건에 맞는 항목 없음")).toBeInTheDocument()
    expect(screen.queryByText(/결과 없음$/)).toBeNull()
    expect(screen.queryByRole("button", { name: "다시" })).toBeNull()
    fireEvent.click(within(empty).getByRole("button", { name: "조건 지우기" }))
    expect(cardCount()).toBe(20)
  })

  it("신규 기능을 꺼도(?plus=0) 필터 막대는 보이고, +α 값이 필요한 칩(본 것 · 확인대상 · AI)은 없다", () => {
    renderAt("?case=ready&plus=0")
    expect(within(bar()).getByRole("group", { name: "유사도" })).toBeInTheDocument()
    expect(within(bar()).queryByRole("group", { name: "AI" })).toBeNull()
    expect(within(bar()).queryByRole("button", { name: /AI 10건만/ })).toBeNull()
    fireEvent.click(chip(/^60↓/))
    expect(cardCount()).toBe(11)
    expect(document.querySelectorAll("[data-plus]")).toHaveLength(0)
  })
})

describe("S05 r3 — 보기 개수 · 썸네일 · 기억", () => {
  it("결과형태 확장: 6열을 누르면 6열, 「촘촘 8열」은 꺼진다(8열일 때는 1–6열 칸이 눌리지 않음)", () => {
    renderAt("?case=ready")
    const seg = screen.getByRole("group", { name: "결과형태" })
    expect(within(seg).getAllByRole("button").every((b) => b.getAttribute("aria-pressed") === "false")).toBe(true)
    fireEvent.click(within(seg).getByRole("button", { name: "6열" }))
    expect(document.querySelector("[data-result-grid]")).toHaveAttribute("data-columns", "6")
    expect(document.querySelector("[data-result-grid]")).toHaveClass("grid-cols-6")
    expect(screen.getByRole("button", { name: "촘촘 8열" })).toHaveAttribute("aria-pressed", "false")
    expect(cardCount()).toBe(20)
  })

  it("썸네일 작게 · 보통 · 크게로 사진 높이가 바뀐다", () => {
    renderAt("?case=ready&plus=0")
    const photo = () => document.querySelector("[data-result-card] img")?.parentElement as HTMLElement
    expect(photo()).toHaveClass("h-[150px]")
    fireEvent.click(within(screen.getByRole("group", { name: "썸네일" })).getByRole("button", { name: "크게" }))
    expect(document.querySelector("[data-result-grid]")).toHaveAttribute("data-thumb", "크게")
    expect(photo()).toHaveClass("h-[220px]")
    fireEvent.click(within(screen.getByRole("group", { name: "썸네일" })).getByRole("button", { name: "작게" }))
    expect(photo()).toHaveClass("h-[110px]")
  })

  it("결과형태 · 썸네일 · 필터는 화면별로 기억한다(다시 열어도 그대로)", () => {
    const first = renderAt("?case=ready")
    fireEvent.click(within(screen.getByRole("group", { name: "결과형태" })).getByRole("button", { name: "3열" }))
    fireEvent.click(within(screen.getByRole("group", { name: "썸네일" })).getByRole("button", { name: "크게" }))
    fireEvent.click(chip(/^80↑/))
    first.unmount()
    renderAt("?case=ready")
    expect(document.querySelector("[data-result-grid]")).toHaveAttribute("data-columns", "3")
    expect(document.querySelector("[data-result-grid]")).toHaveAttribute("data-thumb", "크게")
    expect(cardCount()).toBe(1)
  })

  it("기억된 값이 깨져 있어도 기본값으로 연다", () => {
    window.localStorage.setItem("scas-dev:s05:columns", "{깨짐")
    window.localStorage.setItem("scas-dev:s05:thumb", JSON.stringify("거대"))
    renderAt("?case=ready")
    expect(document.querySelector("[data-result-grid]")).toHaveAttribute("data-columns", "8")
    expect(document.querySelector("[data-result-grid]")).toHaveAttribute("data-thumb", "보통")
  })
})

describe("S05 r3 — 자동 모드", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it("수동이 기본 — 자동을 누르면 주기마다 초점 카드가 다음으로, 간격을 바꾸면 즉시, Space 로 일시정지 · 재개", () => {
    renderAt("?case=ready")
    expect(screen.getByRole("button", { name: "수동" })).toHaveAttribute("aria-pressed", "true")
    goAuto()
    expect(focusedRank()).toBeNull()
    tick(1999)
    expect(focusedRank()).toBeNull()
    tick(1)
    expect(focusedRank()).toBe("1")
    // 빠른 비교 창도 초점 카드를 따라간다
    expect(within(screen.getByRole("dialog", { name: "빠른 비교" })).getByText(/^1위 · 00758/)).toBeInTheDocument()
    tick(2000)
    expect(focusedRank()).toBe("2")
    fireEvent.click(within(screen.getByRole("group", { name: "넘기는 간격" })).getByRole("button", { name: "1초" }))
    tick(1000)
    expect(focusedRank()).toBe("3")
    pressKey(" ")
    expect(screen.getByRole("button", { name: "재생" })).toBeInTheDocument()
    tick(5000)
    expect(focusedRank()).toBe("3")
    pressKey(" ")
    tick(1000)
    expect(focusedRank()).toBe("4")
    expect(screen.getByText("4 / 857")).toBeInTheDocument()
  })

  it("쪽 끝이면 다음 쪽으로 넘기고, 지나간 카드까지 「어디까지 봤는지」를 올린다", () => {
    renderAt("?case=ready")
    fireEvent.click(screen.getByRole("button", { name: "137위부터 이어 보기" }))
    expect(focusedRank()).toBe("137")
    goAuto()
    tick(2000)
    expect(focusedRank()).toBe("138")
    expect(within(document.querySelector("[data-seen-box]") as HTMLElement).getByText("137위 / 857건")).toBeInTheDocument()
    expect(screen.getByText("여기까지 봤음 · 137위 · 방금")).toBeInTheDocument()
    steps(2, 2000)
    expect(focusedRank()).toBe("140")
    tick(2000)
    expect(screen.getByText("전체 857 중 141-160")).toBeInTheDocument()
    expect(focusedRank()).toBe("141")
    expect(within(document.querySelector("[data-seen-box]") as HTMLElement).getByText("140위 / 857건")).toBeInTheDocument()
  })

  it("마지막 카드에서 멈춘다(재생 꺼짐)", () => {
    renderAt("?case=ready&plus=0")
    for (let i = 0; i < 42; i++) pressKey("PageDown")
    expect(screen.getByText("전체 857 중 841-857")).toBeInTheDocument()
    // PgDn 은 새 쪽 첫 카드로 초점
    expect(focusedRank()).toBe("841")
    goAuto()
    fireEvent.click(within(screen.getByRole("group", { name: "넘기는 간격" })).getByRole("button", { name: "1초" }))
    steps(16, 1000)
    expect(focusedRank()).toBe("857")
    expect(screen.getByRole("button", { name: "일시정지" })).toBeInTheDocument()
    tick(1000)
    expect(focusedRank()).toBe("857")
    expect(screen.getByRole("button", { name: "재생" })).toBeInTheDocument()
    tick(5000)
    expect(focusedRank()).toBe("857")
  })

  it("카드에 마우스를 올리면 잠시 멈추고, 내리면 이어 간다 · ★ 를 누르면 멈춘다", () => {
    renderAt("?case=ready")
    goAuto()
    tick(2000)
    expect(focusedRank()).toBe("1")
    const li = document.querySelector('[data-result-card][data-rank="5"]')?.closest("li") as HTMLElement
    fireEvent.mouseEnter(li)
    tick(6000)
    expect(focusedRank()).toBe("1")
    fireEvent.mouseLeave(li)
    tick(2000)
    expect(focusedRank()).toBe("2")
    fireEvent.click(screen.getByRole("button", { name: "1위 00758 확인대상 넣기" }))
    expect(screen.getByRole("button", { name: "재생" })).toBeInTheDocument()
    tick(6000)
    expect(focusedRank()).toBe("2")
  })

  it("회귀: ← 를 먼저 누른 뒤 자동으로 바꿔도 한 주기가 지나기 전에는 걷지 않는다", () => {
    renderAt("?case=ready")
    pressKey("ArrowLeft")
    expect(focusedRank()).toBe("20")
    goAuto()
    expect(screen.getByText("전체 857 중 1-20")).toBeInTheDocument()
    expect(focusedRank()).toBe("20")
    tick(1999)
    expect(focusedRank()).toBe("20")
    tick(1)
    expect(screen.getByText("전체 857 중 21-40")).toBeInTheDocument()
    expect(focusedRank()).toBe("21")
  })

  it("회귀: 자동 중 첫 걸음 전에 ← 를 누르고 마우스를 올렸다 내려도 걸음이 더 생기지 않는다", () => {
    renderAt("?case=ready")
    goAuto()
    pressKey("ArrowLeft")
    expect(focusedRank()).toBe("20")
    const li = document.querySelector('[data-result-card][data-rank="5"]')?.closest("li") as HTMLElement
    fireEvent.mouseEnter(li)
    fireEvent.mouseLeave(li)
    expect(screen.getByText("전체 857 중 1-20")).toBeInTheDocument()
    expect(focusedRank()).toBe("20")
    tick(1999)
    expect(focusedRank()).toBe("20")
  })

  it("수동으로 돌리거나 화면을 떠나면 타이머가 0개", () => {
    const view = renderAt("?case=ready")
    goAuto()
    expect(vi.getTimerCount()).toBeGreaterThan(0)
    fireEvent.click(within(screen.getByRole("group", { name: "이동 방식" })).getByRole("button", { name: "수동" }))
    expect(vi.getTimerCount()).toBe(0)
    goAuto()
    expect(vi.getTimerCount()).toBeGreaterThan(0)
    view.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})

describe("S05 r3 — 단축키 · 전체 화면", () => {
  it("← → 로 초점 카드를 옮기고, Enter 는 상세조회(S06), S 는 확인대상 ★", () => {
    renderAt("?case=ready")
    pressKey("ArrowRight")
    expect(focusedRank()).toBe("1")
    pressKey("ArrowRight")
    pressKey("ArrowRight")
    expect(focusedRank()).toBe("3")
    pressKey("ArrowLeft")
    expect(focusedRank()).toBe("2")
    pressKey("s")
    expect(screen.getByRole("button", { name: "2위 305659 확인대상 넣기" })).toHaveAttribute("aria-pressed", "false")
    pressKey("ArrowLeft")
    pressKey("S")
    expect(screen.getByRole("button", { name: "1위 00758 확인대상 빼기" })).toHaveAttribute("aria-pressed", "true")
    // 한글 입력 상태(「ㄴ」)여도 같은 자판 자리면 ★
    fireEvent.keyDown(window, { key: "ㄴ", code: "KeyS" })
    expect(screen.getByRole("button", { name: "1위 00758 확인대상 넣기" })).toHaveAttribute("aria-pressed", "false")
    pressKey("S")
    pressKey("Enter")
    expect(screen.getByTestId("where")).toHaveTextContent("/dev/s06?ftwr=00758&rank=1")
  })

  it("쪽 첫 카드에서 ← 는 앞 쪽 끝 카드로, PgDn · PgUp 은 쪽 넘김", () => {
    renderAt("?case=ready&plus=0")
    pressKey("PageDown")
    expect(screen.getByText("전체 857 중 21-40")).toBeInTheDocument()
    expect(focusedRank()).toBe("21")
    pressKey("ArrowLeft")
    expect(screen.getByText("전체 857 중 1-20")).toBeInTheDocument()
    expect(focusedRank()).toBe("20")
    pressKey("PageUp")
    expect(screen.getByText("전체 857 중 1-20")).toBeInTheDocument()
  })

  it("? 로 단축키 안내를 열고 Esc 로 닫는다 — 검색 칸에 글자를 칠 때는 열리지 않는다", () => {
    renderAt("?case=ready")
    pressKey("?")
    const help = screen.getByRole("dialog", { name: "단축키 안내" })
    for (const key of ["← →", "Space", "Enter", "S", "?", "Esc"]) expect(within(help).getByText(key)).toBeInTheDocument()
    pressKey("Escape")
    expect(screen.queryByRole("dialog", { name: "단축키 안내" })).toBeNull()
    fireEvent.keyDown(within(bar()).getByRole("textbox", { name: "검색어" }), { key: "?" })
    expect(screen.queryByRole("dialog", { name: "단축키 안내" })).toBeNull()
    fireEvent.click(screen.getByRole("button", { name: "단축키 ?" }))
    expect(screen.getByRole("dialog", { name: "단축키 안내" })).toBeInTheDocument()
  })

  it("전체 화면을 못 쓰는 브라우저면 알림으로 알린다", () => {
    renderAt("?case=ready")
    fireEvent.click(screen.getByRole("button", { name: "전체 화면" }))
    expect(toastMock).toHaveBeenCalledWith(expect.stringContaining("전체 화면을 쓸 수 없습니다"))
  })

  it("전체 화면을 쓸 수 있으면 결과 영역을 전체 화면으로 요청한다", () => {
    renderAt("?case=ready")
    const root = document.querySelector("[data-fullscreen-root]") as HTMLElement
    const request = vi.fn(() => Promise.resolve())
    Object.defineProperty(root, "requestFullscreen", { value: request, configurable: true })
    fireEvent.click(screen.getByRole("button", { name: "전체 화면" }))
    expect(request).toHaveBeenCalledTimes(1)
    expect(toastMock).not.toHaveBeenCalled()
  })
})
