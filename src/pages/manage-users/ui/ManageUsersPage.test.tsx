import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"

import { FEATURES, type SessionUser } from "@/entities/session"
import { useSessionStore } from "@/features/auth"
import { mswServer } from "@/test/msw-server"

import { ManageUsersPage } from "./ManageUsersPage"

const me: SessionUser = {
  userId: "root",
  userNm: "총괄관리자",
  userSe: "ADMIN",
  features: [],
  passwordChangeRequired: false,
}

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
  userDto({ user_id: "admin", user_nm: "부관리자", user_se: "ADMIN", features: [], roles: [], org_id: 1, org_nm: "경찰청" }),
  userDto({}),
  userDto({ user_id: "lee02", user_nm: "이감정", lock_at: "Y", features: ["SHOE_EDIT"], roles: ["EXAMINER", "REVIEWER"] }),
  userDto({ user_id: "park03", user_nm: "박중지", use_at: "N", features: [], last_login_dt: null, roles: [] }),
]

/** GET /admin/orgs — 사용 중지된 관서(5)는 새로 고를 수 없다. */
const ORGS = [
  { org_id: 1, upper_org_id: null, org_se: "HQ", org_nm: "경찰청", grfc_code: null, use_at: "Y", sort_ordr: 0 },
  { org_id: 2, upper_org_id: 1, org_se: "PROVINCIAL", org_nm: "서울청", grfc_code: null, use_at: "Y", sort_ordr: 0 },
  { org_id: 3, upper_org_id: 2, org_se: "STATION", org_nm: "종로경찰서", grfc_code: null, use_at: "Y", sort_ordr: 0 },
  { org_id: 4, upper_org_id: 2, org_se: "STATION", org_nm: "중부경찰서", grfc_code: null, use_at: "Y", sort_ordr: 0 },
  { org_id: 5, upper_org_id: 2, org_se: "STATION", org_nm: "폐지경찰서", grfc_code: null, use_at: "N", sort_ordr: 0 },
]

/** GET /admin/roles — 서버 역할 목록(테스트 고정값). */
const ROLES = [
  { role_code: "INVESTIGATOR", role_nm: "수사관", sort_ordr: 10, features: ["CRIME_REGISTER", "CASE_STATUS_VIEW", "REPORT_VIEW"] },
  { role_code: "EXAMINER", role_nm: "감정관", sort_ordr: 20, features: ["EXAM_DECIDE"] },
  { role_code: "REVIEWER", role_nm: "검증자", sort_ordr: 30, features: ["REPORT_APPROVE"] },
]

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

async function selectUser(userId: string) {
  const table = await screen.findByRole("table", { name: "사용자 목록" })
  fireEvent.click(await within(table).findByText(userId))
}

const detailPanel = () => screen.getByRole("region", { name: "사용자 상세" })

let meCalls = 0

beforeAll(() => mswServer.listen({ onUnhandledRequest: "error" }))
beforeEach(() => {
  // radix Checkbox가 크기 측정에 ResizeObserver를 쓴다 — jsdom에는 없다.
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  )
  meCalls = 0
  useSessionStore.getState().setUser(me)
  mswServer.use(
    http.get("*/admin/users", () => HttpResponse.json(USERS)),
    http.get("*/admin/orgs", () => HttpResponse.json(ORGS)),
    http.get("*/admin/roles", () => HttpResponse.json(ROLES)),
    http.get("*/auth/me", () => {
      meCalls += 1
      return HttpResponse.json({
        user_id: "root",
        user_nm: "총괄관리자",
        user_se: "ADMIN",
        features: [],
        password_change_required: false,
      })
    })
  )
})
afterEach(() => {
  vi.unstubAllGlobals()
  mswServer.resetHandlers()
  useSessionStore.setState({ user: null, status: "loading" })
})
afterAll(() => mswServer.close())

describe("ManageUsersPage — 사용자·권한 관리", () => {
  it("표에 구분·상태 칩과 KST 마지막 로그인을 보인다", async () => {
    renderPage()
    const table = await screen.findByRole("table", { name: "사용자 목록" })
    const leeRow = (await within(table).findByText("lee02")).closest("tr")!
    expect(within(leeRow).getByText("잠금")).toBeInTheDocument()
    expect(within(leeRow).getByText("2026-11-03 09:15")).toBeInTheDocument()
    const parkRow = within(table).getByText("park03").closest("tr")!
    expect(within(parkRow).getByText("중지")).toBeInTheDocument()
    const rootRow = within(table).getByText("root").closest("tr")!
    expect(within(rootRow).getByText("관리자")).toBeInTheDocument()
    expect(screen.getByText("왼쪽 표에서 사용자를 선택하세요.")).toBeInTheDocument()
  })

  it("toggles and saves features", async () => {
    const bodies: unknown[] = []
    mswServer.use(
      http.put("*/admin/users/kim01/features", async ({ request }) => {
        bodies.push(await request.json())
        return HttpResponse.json(userDto({ features: ["CRIME_REGISTER", "CRIME_SEARCH"] }))
      })
    )
    renderPage()
    await selectUser("kim01")

    const save = within(detailPanel()).getByRole("button", { name: "권한 저장" })
    expect(save).toBeDisabled()
    fireEvent.click(within(detailPanel()).getByRole("switch", { name: "사건 등록" }))
    expect(save).toBeEnabled()
    fireEvent.click(save)

    await waitFor(() => expect(bodies).toEqual([{ features: ["CRIME_REGISTER", "CRIME_SEARCH"] }]))
    expect(meCalls).toBe(0)
  })

  it("shoe edit implies view in toggles", async () => {
    renderPage()
    await selectUser("lee02")

    const view = within(detailPanel()).getByRole("switch", { name: "신발 조회" })
    expect(view).toBeChecked()
    expect(view).toBeDisabled()
    expect(within(detailPanel()).getByRole("switch", { name: "신발 등록·수정" })).toBeChecked()
  })

  it("admin selection hides toggles", async () => {
    renderPage()
    await selectUser("admin")

    expect(within(detailPanel()).getByText("관리자는 모든 기능을 사용할 수 있습니다")).toBeInTheDocument()
    expect(within(detailPanel()).queryByRole("switch")).not.toBeInTheDocument()
  })

  it("unlock button only when locked", async () => {
    let unlockCalls = 0
    mswServer.use(
      http.post("*/admin/users/lee02/unlock", () => {
        unlockCalls += 1
        return new HttpResponse(null, { status: 204 })
      })
    )
    renderPage()

    await selectUser("kim01")
    expect(within(detailPanel()).queryByRole("button", { name: "잠금 해제" })).not.toBeInTheDocument()

    await selectUser("lee02")
    fireEvent.click(within(detailPanel()).getByRole("button", { name: "잠금 해제" }))
    await waitFor(() => expect(unlockCalls).toBe(1))
  })

  it("shows server guard message", async () => {
    mswServer.use(
      http.put("*/admin/users/admin", () =>
        HttpResponse.json({ detail: "관리자는 최소 1명 있어야 합니다" }, { status: 400 })
      )
    )
    renderPage()
    await selectUser("admin")

    fireEvent.change(within(detailPanel()).getByLabelText("구분"), { target: { value: "USER" } })
    fireEvent.click(within(detailPanel()).getByRole("button", { name: "정보 저장" }))

    expect(await within(detailPanel()).findByRole("alert")).toHaveTextContent(
      "관리자는 최소 1명 있어야 합니다"
    )
  })

  it("본인 계정은 구분·사용 중지를 바꿀 수 없고, 고치면 세션을 다시 확인한다", async () => {
    const bodies: unknown[] = []
    mswServer.use(
      http.put("*/admin/users/root", async ({ request }) => {
        bodies.push(await request.json())
        return HttpResponse.json(userDto({ user_id: "root", user_nm: "총괄", user_se: "ADMIN" }))
      })
    )
    renderPage()
    await selectUser("root")

    expect(within(detailPanel()).getByLabelText("구분")).toBeDisabled()
    expect(within(detailPanel()).getByRole("button", { name: "사용 중지" })).toBeDisabled()

    fireEvent.change(within(detailPanel()).getByLabelText("이름"), { target: { value: "총괄" } })
    fireEvent.click(within(detailPanel()).getByRole("button", { name: "정보 저장" }))

    await waitFor(() => expect(bodies).toEqual([{ userNm: "총괄", userSe: "ADMIN", useAt: "Y" }]))
    await waitFor(() => expect(meCalls).toBe(1))
  })

  it("사용 중지는 확인을 거쳐 useAt=N으로 저장한다", async () => {
    const bodies: unknown[] = []
    mswServer.use(
      http.put("*/admin/users/kim01", async ({ request }) => {
        bodies.push(await request.json())
        return HttpResponse.json(userDto({ use_at: "N" }))
      })
    )
    renderPage()
    await selectUser("kim01")

    fireEvent.click(within(detailPanel()).getByRole("button", { name: "사용 중지" }))
    const dialog = await screen.findByRole("dialog", { name: "사용 중지" })
    fireEvent.click(within(dialog).getByRole("button", { name: "중지" }))

    await waitFor(() => expect(bodies).toEqual([{ userNm: "김수사", userSe: "USER", useAt: "N" }]))
  })

  it("중지된 계정은 다시 사용으로 바꿀 수 있다", async () => {
    const bodies: unknown[] = []
    mswServer.use(
      http.put("*/admin/users/park03", async ({ request }) => {
        bodies.push(await request.json())
        return HttpResponse.json(userDto({ user_id: "park03", use_at: "Y" }))
      })
    )
    renderPage()
    await selectUser("park03")

    fireEvent.click(within(detailPanel()).getByRole("button", { name: "다시 사용" }))
    await waitFor(() => expect(bodies).toEqual([{ userNm: "박중지", userSe: "USER", useAt: "Y" }]))
  })

  it("비밀번호 초기화는 규칙을 검사한 뒤 임시 비밀번호를 보낸다", async () => {
    const bodies: unknown[] = []
    mswServer.use(
      http.post("*/admin/users/kim01/password-reset", async ({ request }) => {
        bodies.push(await request.json())
        return new HttpResponse(null, { status: 204 })
      })
    )
    renderPage()
    await selectUser("kim01")

    fireEvent.click(within(detailPanel()).getByRole("button", { name: "비밀번호 초기화" }))
    const dialog = await screen.findByRole("dialog", { name: "비밀번호 초기화" })
    const input = within(dialog).getByLabelText("임시 비밀번호")

    fireEvent.change(input, { target: { value: "short" } })
    fireEvent.click(within(dialog).getByRole("button", { name: "초기화" }))
    expect(within(dialog).getByRole("alert")).toHaveTextContent("비밀번호는 8자 이상이어야 합니다")
    expect(bodies).toEqual([])

    fireEvent.change(input, { target: { value: "temp1234!" } })
    fireEvent.click(within(dialog).getByRole("button", { name: "초기화" }))
    await waitFor(() => expect(bodies).toEqual([{ tempPassword: "temp1234!" }]))
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
  })

  it("creates user", async () => {
    const bodies: unknown[] = []
    mswServer.use(
      http.post("*/admin/users", async ({ request }) => {
        bodies.push(await request.json())
        return HttpResponse.json(userDto({ user_id: "choi04", user_nm: "최감정" }), { status: 201 })
      })
    )
    renderPage()

    fireEvent.click(await screen.findByRole("button", { name: "사용자 추가" }))
    const dialog = await screen.findByRole("dialog", { name: "사용자 추가" })

    // 아이디 규칙 위반은 서버에 보내지 않는다.
    fireEvent.change(within(dialog).getByLabelText("아이디"), { target: { value: "ab" } })
    fireEvent.change(within(dialog).getByLabelText("이름"), { target: { value: "최감정" } })
    fireEvent.change(within(dialog).getByLabelText("임시 비밀번호"), { target: { value: "temp1234!" } })
    fireEvent.click(within(dialog).getByRole("button", { name: "추가" }))
    expect(within(dialog).getByRole("alert")).toHaveTextContent("아이디는 영문·숫자·_ 4~20자로 입력하세요")
    expect(bodies).toEqual([])

    fireEvent.change(within(dialog).getByLabelText("아이디"), { target: { value: "choi04" } })
    fireEvent.click(within(dialog).getByRole("checkbox", { name: "신발 등록·수정" }))
    // 신발 등록·수정을 켜면 신발 조회도 함께 켜진다.
    expect(within(dialog).getByRole("checkbox", { name: "신발 조회" })).toBeChecked()
    fireEvent.click(within(dialog).getByRole("button", { name: "추가" }))

    await waitFor(() =>
      expect(bodies).toEqual([
        {
          userId: "choi04",
          userNm: "최감정",
          userSe: "USER",
          initialPassword: "temp1234!",
          features: [FEATURES.SHOE_VIEW, FEATURES.SHOE_EDIT],
        },
      ])
    )
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
  })

  it("중복 아이디(409)는 대화 상자 안에 서버 문구로", async () => {
    mswServer.use(
      http.post("*/admin/users", () =>
        HttpResponse.json({ detail: "이미 등록된 아이디입니다" }, { status: 409 })
      )
    )
    renderPage()

    fireEvent.click(await screen.findByRole("button", { name: "사용자 추가" }))
    const dialog = await screen.findByRole("dialog", { name: "사용자 추가" })
    fireEvent.change(within(dialog).getByLabelText("아이디"), { target: { value: "kim01" } })
    fireEvent.change(within(dialog).getByLabelText("이름"), { target: { value: "김수사" } })
    fireEvent.change(within(dialog).getByLabelText("임시 비밀번호"), { target: { value: "temp1234!" } })
    fireEvent.click(within(dialog).getByRole("button", { name: "추가" }))

    expect(await within(dialog).findByRole("alert")).toHaveTextContent("이미 등록된 아이디입니다")
  })
})

describe("ManageUsersPage — 관서·역할(실증 확장 설계서 §5-A)", () => {
  it("표 맨 끝에 관서·역할 열 — 역할 이름은 서버 역할 목록에서", async () => {
    renderPage()
    const table = await screen.findByRole("table", { name: "사용자 목록" })
    const headers = within(table).getAllByRole("columnheader").map((th) => th.textContent)
    expect(headers.slice(-2)).toEqual(["관서", "역할"])

    const kimRow = (await within(table).findByText("kim01")).closest("tr")!
    expect(within(kimRow).getByText("종로경찰서")).toBeInTheDocument()
    expect(await within(kimRow).findByText("수사관")).toBeInTheDocument()
    const leeRow = within(table).getByText("lee02").closest("tr")!
    expect(within(leeRow).getByText("감정관 · 검증자")).toBeInTheDocument()
  })

  it("역할 체크 → 역할 저장이 PUT /admin/users/{id}/roles를 부른다", async () => {
    const bodies: unknown[] = []
    mswServer.use(
      http.put("*/admin/users/kim01/roles", async ({ request }) => {
        bodies.push(await request.json())
        return HttpResponse.json(userDto({ roles: ["INVESTIGATOR", "EXAMINER"] }))
      })
    )
    renderPage()
    await selectUser("kim01")

    const panel = detailPanel()
    expect(await within(panel).findByRole("checkbox", { name: "수사관" })).toBeChecked()
    const save = within(panel).getByRole("button", { name: "역할 저장" })
    expect(save).toBeDisabled()

    fireEvent.click(within(panel).getByRole("checkbox", { name: "감정관" }))
    expect(save).toBeEnabled()
    fireEvent.click(save)

    await waitFor(() => expect(bodies).toEqual([{ roles: ["INVESTIGATOR", "EXAMINER"] }]))
  })

  it("역할 저장 실패는 패널 안에 서버 문구로", async () => {
    mswServer.use(
      http.put("*/admin/users/kim01/roles", () =>
        HttpResponse.json({ detail: "모르는 역할입니다: X" }, { status: 400 })
      )
    )
    renderPage()
    await selectUser("kim01")

    fireEvent.click(await within(detailPanel()).findByRole("checkbox", { name: "검증자" }))
    fireEvent.click(within(detailPanel()).getByRole("button", { name: "역할 저장" }))

    expect(await within(detailPanel()).findByRole("alert")).toHaveTextContent("모르는 역할입니다: X")
  })

  it("소속 관서를 바꾸면 정보 저장 본문에 orgId — 사용 중지된 관서는 고를 수 없다", async () => {
    const bodies: unknown[] = []
    mswServer.use(
      http.put("*/admin/users/kim01", async ({ request }) => {
        bodies.push(await request.json())
        return HttpResponse.json(userDto({ org_id: 4, org_nm: "중부경찰서" }))
      })
    )
    renderPage()
    await selectUser("kim01")

    const select = within(detailPanel()).getByLabelText("소속 관서")
    await waitFor(() => expect(within(select).getByRole("option", { name: "중부경찰서" })).toBeInTheDocument())
    expect(select).toHaveValue("3")
    expect(within(select).queryByRole("option", { name: "폐지경찰서" })).not.toBeInTheDocument()

    fireEvent.change(select, { target: { value: "4" } })
    fireEvent.click(within(detailPanel()).getByRole("button", { name: "정보 저장" }))

    await waitFor(() =>
      expect(bodies).toEqual([{ userNm: "김수사", userSe: "USER", useAt: "Y", orgId: 4 }])
    )
  })
})
