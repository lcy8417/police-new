import { fireEvent, render, screen, within } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { afterEach, describe, expect, it, vi } from "vitest"

import { S00DevPage } from "./S00DevPage"
import { LOCKED_MESSAGE, LOGIN_FAILED_MESSAGE } from "./mock-cases"

const renderAt = (query: string) =>
  render(
    <MemoryRouter initialEntries={[`/dev/s00${query}`]}>
      <S00DevPage />
    </MemoryRouter>
  )

describe("S00 로그인 진열 페이지", () => {
  it("ready 케이스에 아이디 · 비밀번호 칸과 로그인 버튼을 그린다", () => {
    renderAt("?case=ready")
    expect(screen.getByLabelText("아이디")).toBeInTheDocument()
    expect(screen.getByLabelText("비밀번호")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "로그인" })).toBeEnabled()
    expect(screen.getByLabelText("아이디 저장")).toBeInTheDocument()
  })

  it("?plus=0 이면 시연 · 지난 로그인 · 내부망 안내 · 역할별 첫 화면 · 남은 시도가 없고 1차 모양 그대로다", () => {
    const { container } = renderAt("?case=failed&plus=0")
    expect(container.querySelectorAll("[data-plus]")).toHaveLength(0)
    expect(screen.queryByText(/AI 감정 흐름|LIVE DEMO/)).toBeNull()
    expect(screen.queryByText(/지난 로그인/)).toBeNull()
    expect(screen.queryByText(/경찰 내부망 전용/)).toBeNull()
    expect(screen.queryByText(/로그인하면 처음 열리는 화면/)).toBeNull()
    expect(screen.queryByText(/남은 시도/)).toBeNull()
    // 1차 지금 기능: 칸 · 버튼 · 서버 문구(InlineError) · 아래 안내 한 줄
    expect(screen.getByLabelText("아이디")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "로그인" })).toBeEnabled()
    expect(screen.getByRole("alert").querySelector('[data-part="InlineError"]')).not.toBeNull()
    expect(screen.getByText("인가된 사용자만 접근할 수 있으며, 모든 사용 기록이 저장됩니다.")).toBeInTheDocument()
  })

  it("ready 케이스에는 오류 문구가 없다", () => {
    renderAt("?case=ready")
    expect(screen.queryByRole("alert")).toBeNull()
  })

  it("loading 케이스는 aria-busy=true 이고 로그인 버튼이 잠긴다", () => {
    const { container } = renderAt("?case=loading")
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
    expect(screen.getByRole("button", { name: "로그인 중…" })).toBeDisabled()
  })

  it("failed 케이스(plus=0)는 서버 문구 그대로 InlineError 로 보인다", () => {
    renderAt("?case=failed&plus=0")
    const alert = screen.getByRole("alert")
    expect(alert).toHaveTextContent(LOGIN_FAILED_MESSAGE)
    expect(alert.querySelector('[data-part="InlineError"]')).not.toBeNull()
    // 자격 오류는 다시 시도 버튼이 아니라 칸을 고쳐 다시 제출한다
    expect(screen.queryByRole("button", { name: "다시" })).toBeNull()
  })

  it("failed 케이스는 시안처럼 빨간 칸에 서버 문구 + 남은 시도 3회 + 5회 잠금 규칙을 보인다(시안 핀 2)", () => {
    renderAt("?case=failed")
    const alert = screen.getByRole("alert")
    expect(alert).toHaveTextContent(LOGIN_FAILED_MESSAGE)
    expect(alert).toHaveTextContent("남은 시도 3회")
    expect(alert).toHaveTextContent("5회 연속 틀리면 잠기고, 관리자만 풀 수 있습니다.")
    expect(screen.queryByRole("button", { name: "다시" })).toBeNull()
  })

  it("locked 케이스는 잠금 문구를 서버 문구 그대로 보인다(남은 시도 0회는 숫자를 쓰지 않음)", () => {
    renderAt("?case=locked")
    const alert = screen.getByRole("alert")
    expect(alert).toHaveTextContent(LOCKED_MESSAGE)
    expect(alert).not.toHaveTextContent("남은 시도")
    expect(alert).toHaveTextContent("5회 연속 틀리면 잠기고")
  })

  it("error 케이스는 「다시」 버튼이 있고 「결과 없음」이 없다", () => {
    renderAt("?case=error")
    expect(screen.getByRole("button", { name: "다시" })).toBeInTheDocument()
    expect(screen.queryByText("결과 없음")).toBeNull()
  })

  it("password-change 케이스는 현재 · 새 · 확인 3칸을 그린다", () => {
    renderAt("?case=password-change")
    expect(screen.getByLabelText("현재 비밀번호")).toBeInTheDocument()
    expect(screen.getByLabelText("새 비밀번호")).toBeInTheDocument()
    expect(screen.getByLabelText("새 비밀번호 확인")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "비밀번호 변경" })).toBeInTheDocument()
    expect(screen.queryByLabelText("아이디")).toBeNull()
    expect(screen.getByText(/임시 비밀번호로 로그인했습니다/)).toBeInTheDocument()
  })

  it("입력하면 값이 바뀐다(제어형)", () => {
    renderAt("?case=ready")
    const id = screen.getByLabelText("아이디") as HTMLInputElement
    fireEvent.change(id, { target: { value: "park0412" } })
    expect(id.value).toBe("park0412")
  })

  it("비밀번호 표시 토글이 칸의 종류를 바꾼다", () => {
    renderAt("?case=ready")
    const pw = screen.getByLabelText("비밀번호") as HTMLInputElement
    expect(pw.type).toBe("password")
    fireEvent.click(screen.getByRole("button", { name: "비밀번호 표시" }))
    expect(pw.type).toBe("text")
  })

  it("빈 칸으로 제출하면 「아이디와 비밀번호를 입력하세요」를 보인다", () => {
    renderAt("?case=ready")
    fireEvent.click(screen.getByRole("button", { name: "로그인" }))
    expect(screen.getByRole("alert")).toHaveTextContent("아이디와 비밀번호를 입력하세요")
  })

  it("password-change 에서 확인 칸이 다르면 불일치 문구를 보인다", () => {
    renderAt("?case=password-change")
    fireEvent.change(screen.getByLabelText("현재 비밀번호"), { target: { value: "temp-pass-1" } })
    fireEvent.change(screen.getByLabelText("새 비밀번호"), { target: { value: "new-pass-1234" } })
    fireEvent.change(screen.getByLabelText("새 비밀번호 확인"), { target: { value: "other-pass-1" } })
    fireEvent.click(screen.getByRole("button", { name: "비밀번호 변경" }))
    expect(screen.getByRole("alert")).toHaveTextContent("새 비밀번호가 일치하지 않습니다")
  })

  it("입력 검사 문구는 케이스를 바꾸면 사라진다", () => {
    const { unmount } = renderAt("?case=ready")
    fireEvent.click(screen.getByRole("button", { name: "로그인" }))
    expect(screen.getByRole("alert")).toBeInTheDocument()
    unmount()
    renderAt("?case=password-change")
    expect(screen.queryByRole("alert")).toBeNull()
  })
})

// ── r2: 시안 r3 구성(+α) ──

/** 운영체제 「동작 줄이기」와 애니메이션 엔진을 흉내 낸다(jsdom 에는 둘 다 없음) */
function stubMotion(reduce: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: reduce && query.includes("prefers-reduced-motion"),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  )
  Object.defineProperty(document, "timeline", { configurable: true, value: { currentTime: 1000 } })
  const animations: { startTime: number | null; cancel: () => void }[] = []
  const animate = vi.fn(() => {
    const a = { startTime: null as number | null, cancel: vi.fn() }
    animations.push(a)
    return a
  })
  Object.defineProperty(Element.prototype, "animate", { configurable: true, writable: true, value: animate })
  return { animate, animations }
}

describe("S00 로그인 진열 페이지 — r2 시안 구성", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    Reflect.deleteProperty(Element.prototype, "animate")
    Reflect.deleteProperty(document, "timeline")
  })

  it("첫 문장 · 목표 숫자 3개 · AI 감정 시연 6단계를 시안 문구 그대로 보인다", () => {
    renderAt("?case=ready")
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("현장 족적 한 장으로신발 검색부터 감정서 초안까지")
    expect(screen.getByText("857 → 10")).toBeInTheDocument()
    expect(screen.getByText("문양 자동 제안")).toBeInTheDocument()
    expect(screen.getByText("감정서 자동 채움")).toBeInTheDocument()
    const demo = screen.getByRole("region", { name: "AI 감정 시연" })
    expect(within(demo).getByText("AI 감정 흐름 — 사건 00001-25-0649 · 현장 이미지 _2")).toBeInTheDocument()
    for (const t of ["현장 족적", "이진화", "문양 추출", "신발 검색", "1:1 정밀 대조", "감정서 초안"]) {
      expect(within(demo).getAllByText(t).length).toBeGreaterThan(0)
    }
    // ① 문양 「AI 제안」 ② 128,406 → 857건 · 137위 → 1위(▲136) ③ 지표 4개 · 87% ④ 1–6항 + 「초안」 도장
    expect(within(demo).getAllByText("AI 제안")).toHaveLength(3)
    expect(within(demo).getByText("타원 배열")).toBeInTheDocument()
    expect(within(demo).getByText("128,406켤레")).toBeInTheDocument()
    expect(within(demo).getByText("857건")).toBeInTheDocument()
    expect(within(demo).getByText("▲136")).toBeInTheDocument()
    const answer = demo.querySelector('[data-rank-row="305657"]') as HTMLElement
    expect(answer).toHaveTextContent("1위")
    expect(within(demo).getByText("87%")).toBeInTheDocument()
    expect(within(demo).getByText("NCC")).toBeInTheDocument()
    expect(within(demo).getByText("대응점 5 / 6")).toBeInTheDocument()
    expect(within(demo).getByText("6. 감정 의견")).toBeInTheDocument()
    expect(within(demo).getByText("초안")).toBeInTheDocument()
  })

  it("지난 로그인 · 실패 횟수와 내부망 · 기록 안내를 카드 아래에 보인다", () => {
    renderAt("?case=ready")
    expect(screen.getByText(/지난 로그인/)).toHaveTextContent("지난 로그인 2025-07-24 17:58 · PC 10.14.43.*** · 그 뒤 실패 2회")
    expect(screen.getByText("경찰 내부망 전용")).toBeInTheDocument()
    expect(screen.getByText(/조회·다운로드·출력까지 모든 사용 기록이 저장됩니다/)).toBeInTheDocument()
    expect(screen.getByText("분실 시 관리자에게 초기화 요청")).toBeInTheDocument()
    expect(screen.getByText("내부망 연결됨")).toBeInTheDocument()
  })

  it("역할별 첫 화면 줄의 「지금」 표시가 보는 사람을 따라 옮겨 간다(시안 data-role)", () => {
    const nowRow = () => document.querySelector("[data-now]")?.closest("[data-role-row]")?.getAttribute("data-role-row")
    const { unmount } = renderAt("?case=ready&as=analyst")
    const roles = screen.getByRole("region", { name: "역할별 첫 화면" })
    expect(within(roles).getByText("→ 사건관리 (내 담당)")).toBeInTheDocument()
    expect(within(roles).getByText("→ 결재 대기함")).toBeInTheDocument()
    expect(nowRow()).toBe("analyst")
    unmount()
    const second = renderAt("?case=ready&as=admin")
    expect(nowRow()).toBe("admin")
    second.unmount()
    const third = renderAt("?case=ready&as=verifier")
    expect(nowRow()).toBe("verifier")
    third.unmount()
    renderAt("?case=ready&as=readonly")
    expect(document.querySelector("[data-now]")).toBeNull()
  })

  it("움직임 줄이기면 애니메이션을 걸지 않고 다 끝난 모양(1위 · 87% · 초안)으로 멈춘다", () => {
    const { animate } = stubMotion(true)
    renderAt("?case=ready")
    expect(animate).not.toHaveBeenCalled()
    const demo = screen.getByRole("region", { name: "AI 감정 시연" })
    expect(demo).toHaveAttribute("data-demo-motion", "still")
    expect(demo.querySelector('[data-rank-row="305657"]')).toHaveStyle({ top: "0px" })
    expect(within(demo).getByText("87%")).toBeInTheDocument()
    expect(demo.querySelector("[data-demo-stamp]")).toHaveTextContent("초안")
  })

  it("움직임이 허용되면 14초 반복 애니메이션을 모두 같은 시작 시각으로 건다", () => {
    const { animate, animations } = stubMotion(false)
    renderAt("?case=ready")
    expect(screen.getByRole("region", { name: "AI 감정 시연" })).toHaveAttribute("data-demo-motion", "running")
    expect(animate.mock.calls.length).toBeGreaterThan(40)
    const options = animate.mock.calls[0] as unknown as [Keyframe[], KeyframeAnimationOptions]
    expect(options[1]).toMatchObject({ duration: 14000, iterations: Infinity })
    expect(new Set(animations.map((a) => a.startTime))).toEqual(new Set([1000]))
  })

  it("시연 단계 줄을 누르면 해당 진열 화면으로 간다", () => {
    render(
      <MemoryRouter initialEntries={["/dev/s00?case=ready&as=analyst"]}>
        <Routes>
          <Route path="/dev/s00" element={<S00DevPage />} />
          <Route path="/dev/s06" element={<p>S06 진열</p>} />
        </Routes>
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByTitle("S06 화면 열기"))
    expect(screen.getByText("S06 진열")).toBeInTheDocument()
  })

  it("?plus=0 이면 [data-plus] 가 하나도 없다(비밀번호 변경 포함)", () => {
    const { container, unmount } = renderAt("?case=ready&plus=0")
    expect(container.querySelectorAll("[data-plus]")).toHaveLength(0)
    unmount()
    const pw = renderAt("?case=password-change&plus=0")
    expect(pw.container.querySelectorAll("[data-plus]")).toHaveLength(0)
    expect(screen.getByLabelText("새 비밀번호 확인")).toBeInTheDocument()
  })
})
