import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom"
import { http, HttpResponse } from "msw"

import { FEATURES, type SessionUser } from "@/entities/session"
import { setBrowserNavigation, useSessionStore } from "@/features/auth"
import { SidebarProvider } from "@/shared/ui/sidebar"
import { mswServer } from "@/test/msw-server"

import { Sidebar } from "./Sidebar"

const user = (extra: Partial<SessionUser> = {}): SessionUser => ({
  userId: "kim01",
  userNm: "김수사",
  userSe: "USER",
  features: [FEATURES.CRIME_SEARCH],
  passwordChangeRequired: false,
  ...extra,
})

function LocationProbe() {
  const location = useLocation()
  return <div data-testid="location">{location.pathname}</div>
}

function renderSidebar(path = "/search") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SidebarProvider>
        <Routes>
          <Route path="*" element={<Sidebar />} />
        </Routes>
      </SidebarProvider>
      <LocationProbe />
    </MemoryRouter>
  )
}

const assign = vi.fn<(url: string) => void>()
const reload = vi.fn()

beforeAll(() => mswServer.listen({ onUnhandledRequest: "error" }))
beforeEach(() => {
  assign.mockReset()
  reload.mockReset()
  setBrowserNavigation({ assign, reload })
  // shadcn SidebarProvider의 모바일 판정(use-mobile)이 matchMedia를 부른다 — jsdom에는 없다.
  vi.stubGlobal(
    "matchMedia",
    (query: string) =>
      ({
        matches: false,
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }) as unknown as MediaQueryList
  )
})
afterEach(() => {
  vi.unstubAllGlobals()
  mswServer.resetHandlers()
  setBrowserNavigation(null)
  useSessionStore.setState({ user: null, status: "loading" })
})
afterAll(() => mswServer.close())

describe("Sidebar — 권한별 메뉴·사용자 블록·로그아웃", () => {
  it("권한 없는 메뉴는 숨기고, 사용자 블록에 로그인한 사용자를 보인다", () => {
    useSessionStore.getState().setUser(user())
    renderSidebar()

    expect(screen.getByRole("link", { name: "사건 조회" })).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "사건 등록" })).not.toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "신발" })).not.toBeInTheDocument()
    expect(screen.queryByText("ADMIN")).not.toBeInTheDocument()
    expect(screen.getByText("김수사")).toBeInTheDocument()
    expect(screen.getByText("ID: kim01")).toBeInTheDocument()
    expect(screen.getByText("사용자")).toBeInTheDocument()
    expect(screen.queryByText("ID: KCSI_001")).not.toBeInTheDocument()
  })

  it("관리자에게는 관리 구역(ADMIN)과 관리자 칩을 보인다", () => {
    useSessionStore.getState().setUser(user({ userSe: "ADMIN", userId: "admin", userNm: "관리자", features: [] }))
    renderSidebar()

    expect(screen.getByText("ADMIN")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "사용자·권한" })).toHaveAttribute("href", "/manage/users")
    expect(screen.getByRole("link", { name: "사용 기록" })).toHaveAttribute("href", "/manage/logs")
    expect(screen.getByText("ID: admin")).toBeInTheDocument()
  })

  it("설정 버튼은 비밀번호 변경 화면으로 간다", () => {
    useSessionStore.getState().setUser(user())
    renderSidebar()

    fireEvent.click(screen.getByRole("link", { name: "비밀번호 변경" }))
    expect(screen.getByTestId("location")).toHaveTextContent("/password")
  })

  it("logout does full reload", async () => {
    let logoutCalls = 0
    mswServer.use(
      http.post("*/auth/logout", () => {
        logoutCalls += 1
        return new HttpResponse(null, { status: 204 })
      })
    )
    useSessionStore.getState().setUser(user())
    renderSidebar()

    fireEvent.click(screen.getByRole("button", { name: "로그아웃" }))

    await waitFor(() => expect(assign).toHaveBeenCalledTimes(1))
    expect(assign).toHaveBeenCalledWith("/login")
    expect(logoutCalls).toBe(1)
    expect(reload).not.toHaveBeenCalled()
  })

  it("로그아웃 요청이 실패해도 로그인 화면으로 간다", async () => {
    mswServer.use(http.post("*/auth/logout", () => HttpResponse.json({ detail: "오류" }, { status: 500 })))
    useSessionStore.getState().setUser(user())
    renderSidebar()

    fireEvent.click(screen.getByRole("button", { name: "로그아웃" }))

    await waitFor(() => expect(assign).toHaveBeenCalledWith("/login"))
  })
})
