import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"

import { useSessionStore } from "@/features/auth"
import { mswServer } from "@/test/msw-server"

import { ManageLogsPage } from "./ManageLogsPage"

// S14 실제 페이지 — 위젯(AdminLogsScreen)에 서버 값을 꽂는다. 기능 기록 대상 번호(K1) · 관리자 행위(K2) · 무결성(K3).

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
  action_code: "CRIME_HISTORY_LIST",
  action_nm: "이력 목록",
  feature_code: "CRIME_SEARCH",
  target_id: "00089-26-0080_1",
  result: "SUCCESS",
  status_code: 200,
  error_code: null,
  error_msg: null,
  duration_ms: 12,
  ...extra,
})

const auditDto = (extra: Record<string, unknown> = {}) => ({
  event_id: 7,
  event_se: "PERMISSION_CHANGE",
  actor_id: "root",
  actor_nm: "총괄관리자",
  actor_org_nm: "경찰청",
  target_se: "USER",
  target_id: "kim01",
  target_version: null,
  reason_cn: null,
  detail: { before: ["SHOE_VIEW"], after: ["SHOE_VIEW", "CRIME_SEARCH"] },
  occurred_dt: "2026-11-03T10:20:00+09:00",
  row_hash: "abcd" + "0".repeat(60),
  ...extra,
})

const me = {
  userId: "root",
  userNm: "총괄관리자",
  userSe: "ADMIN" as const,
  features: [],
  passwordChangeRequired: false,
}

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

const queryOf = (request: Request) => Object.fromEntries(new URL(request.url).searchParams)
const allOf = (request: Request, key: string) => new URL(request.url).searchParams.getAll(key)

let sessionQueries: Record<string, string>[] = []
let eventQueries: Record<string, string>[] = []
let auditRequests: Request[] = []
let verifyResult: Record<string, unknown> = { checked: 3, broken_at: null, last_hash: "abcd" }

beforeAll(() => mswServer.listen({ onUnhandledRequest: "error" }))
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] })
  vi.setSystemTime(new Date("2026-11-03T03:00:00Z"))
  useSessionStore.getState().setUser(me)
  sessionQueries = []
  eventQueries = []
  auditRequests = []
  verifyResult = { checked: 3, broken_at: null, last_hash: "abcd" }
  mswServer.use(
    http.get("*/admin/users", () =>
      HttpResponse.json([
        { user_id: "kim01", user_nm: "김수사", user_se: "USER", use_at: "Y", lock_at: "N", features: [], last_login_dt: null, roles: [], org_id: 1, org_nm: "경찰청" },
      ])
    ),
    http.get("*/admin/roles", () => HttpResponse.json([])),
    http.get("*/admin/actions", () => HttpResponse.json([{ action_code: "CRIME_HISTORY_LIST", action_nm: "이력 목록" }])),
    http.get("*/admin/sessions", ({ request }) => {
      sessionQueries.push(queryOf(request))
      return HttpResponse.json([sessionDto()])
    }),
    http.get("*/admin/sessions/s-1/events", () => HttpResponse.json([eventDto()])),
    http.get("*/admin/events", ({ request }) => {
      eventQueries.push(queryOf(request))
      return HttpResponse.json([eventDto()])
    }),
    http.get("*/admin/audit-events/verify", () => HttpResponse.json(verifyResult)),
    http.get("*/admin/audit-events", ({ request }) => {
      auditRequests.push(request)
      return HttpResponse.json([auditDto(), auditDto({ event_id: 6, row_hash: "ef01" + "0".repeat(60) })])
    })
  )
})
afterEach(() => {
  vi.useRealTimers()
  mswServer.resetHandlers()
  useSessionStore.setState({ user: null, status: "loading" })
})
afterAll(() => mswServer.close())

const tabButton = (name: string) => screen.getByRole("button", { name: new RegExp(`^${name}\\s?\\d*$`) })
// 목록을 불러오면 오른쪽 칸(무결성 · 관리자 행위 최근)이 붙으며 표 자리가 다시 그려진다 — 표는 매번 새로 찾는다
const region = (name: string) => screen.getByRole("region", { name })
const findIn = (name: string, text: string) => waitFor(() => within(region(name)).getByText(text))

describe("ManageLogsPage — S14 사용 · 감사 기록(실제 값)", () => {
  it("로그인 기록: 기본 기간 최근 7일, 첫 쪽 50개", async () => {
    renderPage()
    expect(await findIn("로그인 기록", "10.0.0.5")).toBeInTheDocument()
    expect(sessionQueries[0]).toEqual({ from: "2026-10-28", to: "2026-11-03", page: "0" })
  })

  it("기능 기록: 대상 번호(K1)를 넣으면 target_id 로 다시 부른다", async () => {
    renderPage()
    await findIn("로그인 기록", "10.0.0.5")
    fireEvent.click(tabButton("기능 기록"))
    expect(await findIn("기능 기록", "00089-26-0080_1")).toBeInTheDocument()
    expect(eventQueries[0]).toEqual({ from: "2026-10-28", to: "2026-11-03", page: "0" })

    fireEvent.change(screen.getByLabelText("대상 번호"), { target: { value: " 00089-26-0080 " } })
    await waitFor(() => expect(eventQueries.at(-1)?.target_id).toBe("00089-26-0080"))
  })

  it("조회 실패는 「결과 없음」으로 덮지 않고 다시 시도 줄", async () => {
    mswServer.use(http.get("*/admin/sessions", () => HttpResponse.json({ detail: "x" }, { status: 500 })))
    renderPage()
    expect(await screen.findByText("사용 기록을 확인하지 못했습니다")).toBeInTheDocument()
    expect(screen.queryByText("결과 없음")).toBeNull()
  })

  it("관리자 행위 탭: 감사 기록 관리 4종(K2)을 글로", async () => {
    renderPage()
    await findIn("로그인 기록", "10.0.0.5")
    fireEvent.click(tabButton("관리자 행위"))
    await waitFor(() => expect(within(region("관리자 행위 기록")).getAllByText("kim01 기능 권한 켬 사건 조회")).not.toHaveLength(0))
    const tabRequest = auditRequests.find((r) => queryOf(r).from === "2026-10-28")!
    expect(allOf(tabRequest, "event_se")).toEqual(["ROLE_CHANGE", "PERMISSION_CHANGE", "ORG_CHANGE", "USER_CHANGE"])
  })

  it("기록 무결성: 사슬 검증(K3) 온전 · 사슬 그림은 최근 감사 기록 지문", async () => {
    renderPage()
    const box = await screen.findByRole("region", { name: "기록 무결성" })
    expect(await within(box).findByText("✓ 변조 없음")).toBeInTheDocument()
    expect(within(box).getByText("감사 기록 3건 · 사슬 끊김 0")).toBeInTheDocument()
    expect(within(box).getByText("#6")).toBeInTheDocument()
    expect(within(box).getByText("abcd…")).toBeInTheDocument()
  })

  it("기록 무결성: 어긋난 사슬은 빨간 알약", async () => {
    verifyResult = { checked: 3, broken_at: 7, last_hash: "abcd" }
    renderPage()
    const box = await screen.findByRole("region", { name: "기록 무결성" })
    expect(await within(box).findByText("! 사슬 어긋남 #7")).toBeInTheDocument()
    expect(within(box).queryByText("✓ 변조 없음")).toBeNull()
  })

  it("한 쪽 100개는 서버 쪽 두 개를 이어 붙인다", async () => {
    mswServer.use(
      http.get("*/admin/sessions", ({ request }) => {
        const query = queryOf(request)
        sessionQueries.push(query)
        const n = query.page === "0" ? 50 : 3
        return HttpResponse.json(Array.from({ length: n }, (_, i) => sessionDto({ session_id: `p${query.page}-${i}`, ip_addr: `10.${query.page}.0.${i}` })))
      })
    )
    renderPage()
    await findIn("로그인 기록", "10.0.0.49")
    fireEvent.click(screen.getByRole("button", { name: "100개" }))
    expect(await findIn("로그인 기록", "10.1.0.2")).toBeInTheDocument()
    expect(sessionQueries.map((q) => q.page)).toEqual(["0", "0", "1"])
  })
})
