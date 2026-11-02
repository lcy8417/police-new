import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"

import { mswServer } from "@/test/msw-server"

import { ManageLogsPage } from "./ManageLogsPage"

const sessionDto = (extra: Record<string, unknown> = {}) => ({
  session_id: "s-1",
  user_id: "kim01",
  user_nm: "김수사",
  login_dt: "2026-11-03T09:00:00+09:00",
  logout_dt: null,
  logout_reason: null,
  ip_addr: "10.0.0.5",
  event_cnt: 3,
  fail_cnt: 1,
  ...extra,
})

const eventDto = (extra: Record<string, unknown> = {}) => ({
  log_id: 1,
  session_id: "s-1",
  user_id: "kim01",
  user_nm: "김수사",
  occurred_dt: "2026-11-03T09:01:05+09:00",
  action_code: "CRIME_LIST",
  action_nm: "사건 목록",
  feature_code: "CRIME_SEARCH",
  target_id: null,
  result: "SUCCESS",
  status_code: 200,
  error_code: null,
  error_msg: null,
  duration_ms: 12,
  ...extra,
})

const SESSION_EVENTS = [
  eventDto(),
  eventDto({
    log_id: 2,
    occurred_dt: "2026-11-03T09:03:10+09:00",
    action_code: "PATTERN_EXTRACT",
    action_nm: "문양 추출",
    target_id: "00001-23-0360",
    result: "FAIL",
    status_code: 500,
    error_code: "INTERNAL_ERROR",
    error_msg: "서버 내부 오류",
    duration_ms: 900,
  }),
  eventDto({
    log_id: 3,
    occurred_dt: "2026-11-03T09:04:00+09:00",
    action_code: "SHOE_REGISTER",
    action_nm: "신발 등록",
    result: "DENIED",
    status_code: 403,
    error_msg: "접근 권한이 없습니다",
  }),
]

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/manage/logs"]}>
        <ManageLogsPage />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

/** 요청 쿼리를 `{키: 값}`으로 기록한다. */
const queryOf = (request: Request) => Object.fromEntries(new URL(request.url).searchParams)

let sessionQueries: Record<string, string>[] = []
let eventQueries: Record<string, string>[] = []

beforeAll(() => mswServer.listen({ onUnhandledRequest: "error" }))
beforeEach(() => {
  // 기본 기간(최근 7일)을 고정하려고 Date만 가짜로 — 타이머는 그대로라 MSW·waitFor가 정상 동작.
  vi.useFakeTimers({ toFake: ["Date"] })
  vi.setSystemTime(new Date("2026-11-03T03:00:00Z"))
  sessionQueries = []
  eventQueries = []
  mswServer.use(
    http.get("*/admin/users", () =>
      HttpResponse.json([
        {
          user_id: "kim01",
          user_nm: "김수사",
          user_se: "USER",
          use_at: "Y",
          lock_at: "N",
          features: ["CRIME_SEARCH"],
          last_login_dt: null,
        },
      ])
    ),
    http.get("*/admin/actions", () =>
      HttpResponse.json([
        { action_code: "CRIME_LIST", action_nm: "사건 목록" },
        { action_code: "PATTERN_EXTRACT", action_nm: "문양 추출" },
      ])
    ),
    http.get("*/admin/sessions", ({ request }) => {
      sessionQueries.push(queryOf(request))
      return HttpResponse.json([
        sessionDto(),
        sessionDto({
          session_id: "s-2",
          login_dt: "2026-11-02T13:00:00+09:00",
          logout_dt: "2026-11-02T18:30:00+09:00",
          logout_reason: "IDLE",
          fail_cnt: 0,
        }),
      ])
    }),
    http.get("*/admin/sessions/s-1/events", () => HttpResponse.json(SESSION_EVENTS)),
    http.get("*/admin/events", ({ request }) => {
      eventQueries.push(queryOf(request))
      return HttpResponse.json([
        eventDto({
          log_id: 9,
          session_id: null,
          user_id: null,
          user_nm: null,
          action_code: "AUTH_LOGIN",
          action_nm: "로그인",
          result: "FAIL",
          status_code: 403,
          error_code: "ORIGIN",
          error_msg: "요청 출처가 올바르지 않습니다",
        }),
      ])
    })
  )
})
afterEach(() => {
  vi.useRealTimers()
  mswServer.resetHandlers()
})
afterAll(() => mswServer.close())

const sessionsTable = () => screen.findByRole("table", { name: "로그인 기록" })

describe("ManageLogsPage — 사용 기록", () => {
  it("로그인 기록: 기본 기간 최근 7일, 사용 중·종료 사유·실패 수", async () => {
    renderPage()
    const table = await sessionsTable()

    expect(await within(table).findByText("2026-11-03 09:00")).toBeInTheDocument()
    expect(sessionQueries[0]).toEqual({ from: "2026-10-28", to: "2026-11-03", page: "0" })
    expect(within(table).getByText("사용 중")).toBeInTheDocument()
    expect(within(table).getByText("시간 초과")).toBeInTheDocument()
    expect(within(table).getByText("2026-11-03 09:00")).toBeInTheDocument()
    // 실패 1건은 빨간 숫자로.
    expect(within(table).getByText("1")).toHaveClass("text-[#EF4444]")
  })

  it("expands session timeline", async () => {
    renderPage()
    const table = await sessionsTable()
    const row = (await within(table).findByText("2026-11-03 09:00")).closest("tr")!

    const toggle = within(row).getByRole("button", { name: "기능 기록 펼치기" })
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute("aria-expanded", "true")

    const timeline = await screen.findByRole("list", { name: "이 로그인의 기능 기록" })
    expect(await within(timeline).findByText("사건 목록")).toBeInTheDocument()
    expect(within(timeline).getByText("09:01")).toBeInTheDocument()
    expect(within(timeline).getByText("00001-23-0360")).toBeInTheDocument()
    expect(within(timeline).getByText("권한 없음")).toBeInTheDocument()

    // 실패 행을 펼치면 상태 코드·오류 코드·오류 메시지.
    expect(within(timeline).queryByText("서버 내부 오류")).not.toBeInTheDocument()
    fireEvent.click(within(timeline).getByRole("button", { name: /문양 추출/ }))
    expect(within(timeline).getByText("INTERNAL_ERROR")).toBeInTheDocument()
    expect(within(timeline).getByText("서버 내부 오류")).toBeInTheDocument()
    expect(within(timeline).getByText("500")).toBeInTheDocument()
  })

  it("filters fail only", async () => {
    renderPage()
    await sessionsTable()

    fireEvent.mouseDown(screen.getByRole("tab", { name: "기능 기록" }))
    const table = await screen.findByRole("table", { name: "기능 기록" })
    // 출처 거절 등 사용자를 모르는 기록은 "알 수 없음".
    expect(await within(table).findByText("알 수 없음")).toBeInTheDocument()
    expect(eventQueries[0]).toEqual({ from: "2026-10-28", to: "2026-11-03", page: "0" })

    fireEvent.change(screen.getByLabelText("결과"), { target: { value: "FAIL" } })
    await waitFor(() =>
      expect(eventQueries.at(-1)).toEqual({ from: "2026-10-28", to: "2026-11-03", result: "FAIL", page: "0" })
    )

    fireEvent.change(screen.getByLabelText("기능"), { target: { value: "PATTERN_EXTRACT" } })
    await waitFor(() => expect(eventQueries.at(-1)?.action_code).toBe("PATTERN_EXTRACT"))
  })

  it("결과·기능 필터는 기능 기록 탭에만 있고, 사용자 필터·초기화는 두 탭 공통", async () => {
    renderPage()
    await sessionsTable()
    expect(screen.queryByLabelText("결과")).not.toBeInTheDocument()

    fireEvent.change(await screen.findByLabelText("사용자"), { target: { value: "kim01" } })
    await waitFor(() => expect(sessionQueries.at(-1)?.user_id).toBe("kim01"))

    fireEvent.click(screen.getByRole("button", { name: "필터 초기화" }))
    await waitFor(() => expect(sessionQueries.at(-1)).toEqual({ from: "2026-10-28", to: "2026-11-03", page: "0" }))
  })

  it("50개가 꽉 차면 더 보기로 다음 페이지를 부른다", async () => {
    mswServer.use(
      http.get("*/admin/sessions", ({ request }) => {
        const query = queryOf(request)
        sessionQueries.push(query)
        if (query.page === "0") {
          return HttpResponse.json(
            Array.from({ length: 50 }, (_, i) => sessionDto({ session_id: `p0-${i}`, ip_addr: `10.0.0.${i}` }))
          )
        }
        return HttpResponse.json([sessionDto({ session_id: "p1-0", ip_addr: "10.9.9.9" })])
      })
    )
    renderPage()
    const table = await sessionsTable()
    await within(table).findByText("10.0.0.49")

    fireEvent.click(screen.getByRole("button", { name: "더 보기" }))
    expect(await within(table).findByText("10.9.9.9")).toBeInTheDocument()
    expect(sessionQueries.map((q) => q.page)).toEqual(["0", "1"])
    expect(screen.queryByRole("button", { name: "더 보기" })).not.toBeInTheDocument()
  })
})
