import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom"
import { http, HttpResponse } from "msw"

import { useCrimeStore } from "@/entities/crime"
import { RequireAuth, SessionProvider, useSessionStore } from "@/features/auth"
import { setSessionEndedHandler } from "@/shared/api"
import { mswServer } from "@/test/msw-server"

import { PasswordChangePage } from "./PasswordChangePage"

const meDto = (passwordChangeRequired: boolean) => ({
  user_id: "kim01",
  user_nm: "김수사",
  user_se: "USER",
  features: ["CRIME_SEARCH"],
  password_change_required: passwordChangeRequired,
})

function LocationProbe() {
  const location = useLocation()
  return <div data-testid="location">{location.pathname}</div>
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/password"]}>
      <SessionProvider>
        <Routes>
          <Route
            path="/password"
            element={
              <RequireAuth>
                <PasswordChangePage />
              </RequireAuth>
            }
          />
          <Route
            path="/search/*"
            element={
              <RequireAuth>
                <p>사건 조회 화면</p>
              </RequireAuth>
            }
          />
          {/* 허용된 첫 화면 = 사건관리 /cases(B 단계 0단계 — feature-routes) */}
          <Route
            path="/cases"
            element={
              <RequireAuth>
                <p>사건 조회 화면</p>
              </RequireAuth>
            }
          />
        </Routes>
      </SessionProvider>
      <LocationProbe />
    </MemoryRouter>
  )
}

async function fill(current: string, next: string, confirm: string) {
  fireEvent.change(await screen.findByLabelText("현재 비밀번호"), { target: { value: current } })
  fireEvent.change(screen.getByLabelText("새 비밀번호"), { target: { value: next } })
  fireEvent.change(screen.getByLabelText("새 비밀번호 확인"), { target: { value: confirm } })
  fireEvent.click(screen.getByRole("button", { name: "비밀번호 변경" }))
}

let passwordChangeRequired = true
let changeBodies: unknown[] = []
const originalCrimeState = useCrimeStore.getState()

beforeAll(() => mswServer.listen({ onUnhandledRequest: "error" }))
beforeEach(() => {
  passwordChangeRequired = true
  changeBodies = []
  setSessionEndedHandler(vi.fn())
  useSessionStore.setState({ user: null, status: "loading" })
  useCrimeStore.setState({ refetch: vi.fn(async () => {}), reset: vi.fn() })
  mswServer.use(
    http.get("*/auth/me", () => HttpResponse.json(meDto(passwordChangeRequired))),
    http.post("*/auth/password", async ({ request }) => {
      changeBodies.push(await request.json())
      passwordChangeRequired = false
      return new HttpResponse(null, { status: 204 })
    })
  )
})
afterEach(() => {
  mswServer.resetHandlers()
  setSessionEndedHandler(null)
  useCrimeStore.setState(originalCrimeState, true)
})
afterAll(() => mswServer.close())

describe("PasswordChangePage", () => {
  it("PasswordChangePage validates mismatch and 72 bytes", async () => {
    renderPage()

    await fill("temp1234!", "newpass123", "newpass124")
    expect(await screen.findByRole("alert")).toHaveTextContent("새 비밀번호가 일치하지 않습니다")

    const korean25 = "가".repeat(25) // 75바이트
    await fill("temp1234!", korean25, korean25)
    expect(screen.getByRole("alert")).toHaveTextContent("비밀번호는 UTF-8 기준 72바이트 이하여야 합니다")

    await fill("temp1234!", "short1", "short1")
    expect(screen.getByRole("alert")).toHaveTextContent("비밀번호는 8자 이상이어야 합니다")

    await fill("temp1234!", "temp1234!", "temp1234!")
    expect(screen.getByRole("alert")).toHaveTextContent("현재와 다른 비밀번호를 입력하세요")

    expect(changeBodies).toEqual([])
  })

  it("강제 변경 안내를 보여 준다", async () => {
    renderPage()
    expect(await screen.findByText(/새 비밀번호를 설정해야/)).toBeInTheDocument()
  })

  it("성공하면 세션을 갱신하고 첫 화면으로", async () => {
    renderPage()
    await fill("temp1234!", "newpass123", "newpass123")

    expect(await screen.findByText("사건 조회 화면")).toBeInTheDocument()
    expect(screen.getByTestId("location")).toHaveTextContent("/cases")
    expect(changeBodies).toEqual([{ currentPassword: "temp1234!", newPassword: "newpass123" }])
    expect(useSessionStore.getState().user?.passwordChangeRequired).toBe(false)
  })

  it("서버 문구(현재 비밀번호 틀림)를 그대로 보여 준다", async () => {
    mswServer.use(
      http.post("*/auth/password", () =>
        HttpResponse.json({ detail: "현재 비밀번호가 올바르지 않습니다" }, { status: 400 })
      )
    )
    renderPage()
    await fill("wrong-pass", "newpass123", "newpass123")
    expect(await screen.findByRole("alert")).toHaveTextContent("현재 비밀번호가 올바르지 않습니다")
    expect(screen.getByTestId("location")).toHaveTextContent("/password")
  })
})
