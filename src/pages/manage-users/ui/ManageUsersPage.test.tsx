import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"

import type { SessionUser } from "@/entities/session"
import { useSessionStore } from "@/features/auth"
import { mswServer } from "@/test/msw-server"

import { ManageUsersPage } from "./ManageUsersPage"

const toastError = vi.hoisted(() => vi.fn())
vi.mock("sonner", async (orig) => {
  const real = await orig<typeof import("sonner")>()
  return { ...real, toast: Object.assign(vi.fn(), real.toast, { error: toastError }) }
})

// S13 실제 페이지 — 위젯(AdminUsersScreen)에 기존 /admin/* 값과 관리자 변경 이력(감사 K2)을 꽂는다.

const me: SessionUser = { userId: "root", userNm: "총괄관리자", userSe: "ADMIN", features: [], passwordChangeRequired: false }

const userDto = (extra: Record<string, unknown>) => ({
  user_id: "kim01",
  user_nm: "김수사",
  user_se: "USER",
  use_at: "Y",
  lock_at: "N",
  features: ["CRIME_SEARCH"],
  last_login_dt: "2026-11-03T09:15:00+09:00",
  roles: ["INVESTIGATOR"],
  org_id: 3,
  org_nm: "종로경찰서",
  ...extra,
})

const USERS = [
  userDto({ user_id: "root", user_nm: "총괄관리자", user_se: "ADMIN", features: [], roles: [], org_id: 1, org_nm: "경찰청" }),
  userDto({}),
  userDto({ user_id: "lee02", user_nm: "이감정", lock_at: "Y", features: ["SHOE_PATTERN"], roles: ["EXAMINER"] }),
]
const ORGS = [
  { org_id: 1, upper_org_id: null, org_se: "HQ", org_nm: "경찰청", grfc_code: null, use_at: "Y", sort_ordr: 0 },
  { org_id: 3, upper_org_id: 1, org_se: "STATION", org_nm: "종로경찰서", grfc_code: null, use_at: "Y", sort_ordr: 0 },
]
const ROLES = [
  { role_code: "INVESTIGATOR", role_nm: "수사관", sort_ordr: 10, features: ["CRIME_REGISTER"] },
  { role_code: "EXAMINER", role_nm: "감정관", sort_ordr: 20, features: ["EXAM_DECIDE"] },
]
const FEATURE_LIST = [
  ["CRIME_REGISTER", "사건 등록"],
  ["CRIME_SEARCH", "사건 조회"],
  ["SHOE_VIEW", "신발 조회"],
  ["SHOE_EDIT", "신발 등록·수정"],
  ["SHOE_PATTERN", "신발 문양 입력"],
  ["SHOE_APPROVE", "신발 승인"],
].map(([feature_code, feature_nm], i) => ({ feature_code, feature_nm, sort_ordr: i }))

const historyDto = {
  event_id: 3,
  event_se: "ROLE_CHANGE",
  actor_id: "root",
  actor_nm: "총괄관리자",
  actor_org_nm: "경찰청",
  target_se: "USER",
  target_id: "kim01",
  target_version: null,
  reason_cn: null,
  detail: { before: ["INVESTIGATOR"], after: ["EXAMINER"] },
  occurred_dt: "2026-11-03T10:20:00+09:00",
  row_hash: "a".repeat(64),
}

let bodies: { method: string; path: string; body: unknown }[] = []
let historyQueries: URLSearchParams[] = []

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/manage/users"]}>
        <ManageUsersPage />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

const rowOf = (userId: string) =>
  screen.getByText(userId, { selector: '[role="cell"] *, [role="cell"]' }).closest('[role="row"]') as HTMLElement
const detail = () => screen.getByRole("region", { name: "사용자 상세" })
async function select(userId: string) {
  await waitFor(() => rowOf(userId))
  fireEvent.click(rowOf(userId))
  return detail()
}

beforeAll(() => mswServer.listen({ onUnhandledRequest: "error" }))
beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  )
  useSessionStore.getState().setUser(me)
  bodies = []
  historyQueries = []
  const record = async ({ request }: { request: Request }) => {
    const text = await request.text()
    bodies.push({ method: request.method, path: new URL(request.url).pathname, body: text ? JSON.parse(text) : null })
  }
  mswServer.use(
    http.get("*/admin/users", () => HttpResponse.json(USERS)),
    http.get("*/admin/orgs", () => HttpResponse.json(ORGS)),
    http.get("*/admin/roles", () => HttpResponse.json(ROLES)),
    http.get("*/admin/features", () => HttpResponse.json(FEATURE_LIST)),
    http.get("*/admin/audit-events", ({ request }) => {
      historyQueries.push(new URL(request.url).searchParams)
      return HttpResponse.json([historyDto])
    }),
    http.put("*/admin/users/:id", async (info) => {
      await record(info)
      return HttpResponse.json(USERS[1])
    }),
    http.put("*/admin/users/:id/features", async (info) => {
      await record(info)
      return HttpResponse.json(USERS[1])
    }),
    http.put("*/admin/users/:id/roles", async (info) => {
      await record(info)
      return HttpResponse.json(USERS[1])
    }),
    http.post("*/admin/users/:id/unlock", async (info) => {
      await record(info)
      return new HttpResponse(null, { status: 204 })
    })
  )
})
afterEach(() => {
  vi.unstubAllGlobals()
  mswServer.resetHandlers()
  useSessionStore.setState({ user: null, status: "loading" })
})
afterAll(() => mswServer.close())

describe("ManageUsersPage — S13 사용자 관리(실제 값)", () => {
  it("표 · 상세 — 기능 목록은 서버 GET /admin/features 그대로", async () => {
    renderPage()
    const d = await select("kim01")
    expect(within(d).getByRole("switch", { name: /신발 승인/ })).toBeInTheDocument()
    expect(within(d).getByRole("switch", { name: /^사건 조회/ })).toBeChecked()
  })

  it("기능 권한 저장 — 분업(문양 입력 · 승인)도 기능 권한, 켜면 신발 조회가 함께", async () => {
    renderPage()
    const d = await select("kim01")
    fireEvent.click(within(d).getByRole("switch", { name: /신발 승인/ }))
    expect(within(d).getByRole("switch", { name: /신발 조회/ })).toBeChecked()
    fireEvent.click(within(d).getByRole("button", { name: "권한 저장" }))
    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).toEqual({
      method: "PUT",
      path: "/admin/users/kim01/features",
      body: { features: ["CRIME_SEARCH", "SHOE_VIEW", "SHOE_APPROVE"] },
    })
  })

  it("역할 저장 · 정보 저장(사용 여부는 그대로)", async () => {
    renderPage()
    const d = await select("kim01")
    fireEvent.click(within(d).getByRole("checkbox", { name: "감정관" }))
    fireEvent.click(within(d).getByRole("button", { name: "역할 저장" }))
    await waitFor(() => expect(bodies.at(-1)?.path).toBe("/admin/users/kim01/roles"))
    expect(bodies.at(-1)?.body).toEqual({ roles: ["INVESTIGATOR", "EXAMINER"] })

    fireEvent.change(within(d).getByLabelText("이름"), { target: { value: "김수사2" } })
    fireEvent.click(within(d).getByRole("button", { name: "정보 저장" }))
    await waitFor(() => expect(bodies.at(-1)?.path).toBe("/admin/users/kim01"))
    expect(bodies.at(-1)?.body).toEqual({ userNm: "김수사2", userSe: "USER", useAt: "Y", orgId: 3 })
  })

  it("잠긴 계정은 잠금 해제", async () => {
    renderPage()
    const d = await select("lee02")
    fireEvent.click(within(d).getByRole("button", { name: "잠금 해제" }))
    await waitFor(() => expect(bodies.at(-1)?.path).toBe("/admin/users/lee02/unlock"))
  })

  it("서버 거절 문구(마지막 관리자)는 그대로 알림", async () => {
    mswServer.use(http.put("*/admin/users/:id", () => HttpResponse.json({ detail: "관리자는 최소 1명 있어야 합니다" }, { status: 400 })))
    renderPage()
    const d = await select("kim01")
    fireEvent.click(within(d).getByRole("button", { name: "사용 중지" }))
    await waitFor(() => expect(toastError).toHaveBeenCalledWith("관리자는 최소 1명 있어야 합니다"))
  })

  it("관리자 변경 이력 = 감사 기록 K2 관리 4종", async () => {
    renderPage()
    const box = await screen.findByRole("region", { name: "관리자 변경 이력" })
    expect(await within(box).findByText("kim01 역할 수사관 → 감정관")).toBeInTheDocument()
    expect(within(box).getByText("root → kim01")).toBeInTheDocument()
    expect(historyQueries[0].getAll("event_se")).toEqual(["ROLE_CHANGE", "PERMISSION_CHANGE", "ORG_CHANGE", "USER_CHANGE"])
  })

  it("이력 조회 실패는 「결과 없음」이 아니라 다시 시도 줄", async () => {
    mswServer.use(http.get("*/admin/audit-events", () => HttpResponse.json({ detail: "x" }, { status: 500 })))
    renderPage()
    expect(await screen.findByText("변경 이력을 확인하지 못했습니다")).toBeInTheDocument()
  })

  it("목록 조회 실패는 오류 줄", async () => {
    mswServer.use(http.get("*/admin/users", () => HttpResponse.json({ detail: "x" }, { status: 500 })))
    renderPage()
    expect(await screen.findByText("사용자 목록을 확인하지 못했습니다")).toBeInTheDocument()
    expect(screen.queryByText("결과 없음")).toBeNull()
  })
})
