import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom"
import { http, HttpResponse } from "msw"

import { useCrimeStore } from "@/entities/crime"
import { RequireAuth, SessionProvider, useSessionStore } from "@/features/auth"
import { setSessionEndedHandler } from "@/shared/api"
import { mswServer } from "@/test/msw-server"

import { LoginPage } from "./LoginPage"

const REMEMBER_KEY = "police.rememberedUserId"

const userDto = (extra: Record<string, unknown> = {}) => ({
  user_id: "kim01",
  user_nm: "김수사",
  user_se: "USER",
  features: ["CRIME_SEARCH"],
  password_change_required: false,
  ...extra,
})

function LocationProbe() {
  const location = useLocation()
  return <div data-testid="location">{location.pathname + location.search}</div>
}

function renderLogin(path = "/login") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SessionProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/password"
            element={
              <RequireAuth>
                <p>비밀번호 변경 화면</p>
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

const location = () => screen.getByTestId("location").textContent

/** 로그인 요청 본문을 기록하고 주어진 응답을 돌려주는 MSW 핸들러. */
function mockLogin(respond: () => Response | Promise<Response>) {
  const bodies: unknown[] = []
  mswServer.use(
    http.post("*/auth/login", async ({ request }) => {
      bodies.push(await request.json())
      return respond()
    })
  )
  return bodies
}

async function fillAndSubmit(userId: string, password: string) {
  fireEvent.change(await screen.findByLabelText("아이디"), { target: { value: userId } })
  fireEvent.change(screen.getByLabelText("비밀번호"), { target: { value: password } })
  fireEvent.click(screen.getByRole("button", { name: "로그인" }))
}

const sessionEnded = vi.fn<(loginUrl: string) => void>()
const originalCrimeState = useCrimeStore.getState()

beforeAll(() => mswServer.listen({ onUnhandledRequest: "error" }))
beforeEach(() => {
  sessionEnded.mockReset()
  setSessionEndedHandler(sessionEnded)
  useSessionStore.setState({ user: null, status: "loading" })
  // 로그인 직후 사건 목록 로딩은 이 테스트의 관심사가 아니다.
  useCrimeStore.setState({ refetch: vi.fn(async () => {}), reset: vi.fn() })
  window.localStorage.clear()
  // 앱 시작 시 세션 없음
  mswServer.use(http.get("*/auth/me", () => HttpResponse.json({ detail: "로그인이 필요합니다" }, { status: 401 })))
})
afterEach(() => {
  mswServer.resetHandlers()
  setSessionEndedHandler(null)
  useCrimeStore.setState(originalCrimeState, true)
})
afterAll(() => mswServer.close())

describe("LoginPage", () => {
  it("logs in and navigates to first allowed", async () => {
    const bodies = mockLogin(() => HttpResponse.json(userDto()))
    renderLogin()

    await fillAndSubmit("kim01", "pass1234!")

    expect(await screen.findByText("사건 조회 화면")).toBeInTheDocument()
    expect(location()).toBe("/cases")
    expect(bodies).toEqual([{ userId: "kim01", password: "pass1234!" }])
    expect(useSessionStore.getState().user?.userId).toBe("kim01")
  })

  it("Enter로 제출되는 폼이다(입력칸이 이름 붙은 form 안에 있음)", async () => {
    mockLogin(() => HttpResponse.json(userDto()))
    renderLogin()
    const form = await screen.findByRole("form", { name: "로그인" })
    fireEvent.change(screen.getByLabelText("아이디"), { target: { value: "kim01" } })
    fireEvent.change(screen.getByLabelText("비밀번호"), { target: { value: "pass1234!" } })

    fireEvent.submit(form)

    expect(await screen.findByText("사건 조회 화면")).toBeInTheDocument()
  })

  it("shows server detail on 401", async () => {
    mockLogin(() =>
      HttpResponse.json({ detail: "아이디 또는 비밀번호가 올바르지 않습니다" }, { status: 401 })
    )
    renderLogin()

    await fillAndSubmit("kim01", "wrong-pass")

    expect(await screen.findByRole("alert")).toHaveTextContent("아이디 또는 비밀번호가 올바르지 않습니다")
    expect(location()).toBe("/login")
    expect(sessionEnded).not.toHaveBeenCalled()
    expect(screen.getByLabelText("비밀번호")).toHaveAttribute("aria-invalid", "true")
  })

  it("잠김(423) 안내도 서버 문구 그대로", async () => {
    mockLogin(() => HttpResponse.json({ detail: "계정이 잠겼습니다. 관리자에게 문의하세요" }, { status: 423 }))
    renderLogin()
    await fillAndSubmit("kim01", "pass1234!")
    expect(await screen.findByRole("alert")).toHaveTextContent("계정이 잠겼습니다. 관리자에게 문의하세요")
  })

  it("서버에 닿지 못하면 거절이 아니라 「다시」 줄 — 누르면 같은 값으로 다시 보낸다", async () => {
    let calls = 0
    mockLogin(() => {
      calls += 1
      return calls === 1 ? HttpResponse.error() : HttpResponse.json(userDto())
    })
    renderLogin()
    await fillAndSubmit("kim01", "pass1234!")
    fireEvent.click(await screen.findByRole("button", { name: "다시" }))
    await waitFor(() => expect(location()).not.toBe("/login"))
    expect(calls).toBe(2)
  })

  it("빈 칸이면 서버로 보내지 않는다", async () => {
    const bodies = mockLogin(() => HttpResponse.json(userDto()))
    renderLogin()
    await fillAndSubmit("", "")
    expect(await screen.findByRole("alert")).toHaveTextContent("아이디와 비밀번호를 입력하세요")
    expect(bodies).toEqual([])
  })

  it("요청 중에는 '로그인 중…'으로 바뀌고 다시 누를 수 없다", async () => {
    let release: () => void = () => {}
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    mockLogin(async () => {
      await gate
      return HttpResponse.json(userDto())
    })
    renderLogin()
    await fillAndSubmit("kim01", "pass1234!")

    const busy = await screen.findByRole("button", { name: /로그인 중…/ })
    expect(busy).toBeDisabled()
    release()
    expect(await screen.findByText("사건 조회 화면")).toBeInTheDocument()
  })

  it("비밀번호 표시/숨김 토글", async () => {
    renderLogin()
    const password = await screen.findByLabelText("비밀번호")
    expect(password).toHaveAttribute("type", "password")
    fireEvent.click(screen.getByRole("button", { name: "비밀번호 표시" }))
    expect(password).toHaveAttribute("type", "text")
    fireEvent.click(screen.getByRole("button", { name: "비밀번호 숨기기" }))
    expect(password).toHaveAttribute("type", "password")
  })

  it("remembers user id", async () => {
    mockLogin(() => HttpResponse.json(userDto()))
    renderLogin()
    fireEvent.click(await screen.findByLabelText("아이디 저장"))
    await fillAndSubmit("kim01", "pass1234!")
    await screen.findByText("사건 조회 화면")
    expect(window.localStorage.getItem(REMEMBER_KEY)).toBe("kim01")

    // 다음에 로그인 화면을 열면 아이디가 채워져 있고 체크도 켜져 있다
    cleanup()
    useSessionStore.setState({ user: null, status: "loading" })
    renderLogin()
    expect(await screen.findByLabelText("아이디")).toHaveValue("kim01")
    expect(screen.getByLabelText("아이디 저장")).toBeChecked()

    // 체크를 끄고 로그인하면 지운다
    fireEvent.click(screen.getByLabelText("아이디 저장"))
    await fillAndSubmit("kim01", "pass1234!")
    await screen.findByText("사건 조회 화면")
    expect(window.localStorage.getItem(REMEMBER_KEY)).toBeNull()
  })

  it("forces password change", async () => {
    mockLogin(() => HttpResponse.json(userDto({ password_change_required: true })))
    renderLogin("/login?from=%2Fsearch%2Fabc")
    await fillAndSubmit("kim01", "temp1234!")
    expect(await screen.findByText("비밀번호 변경 화면")).toBeInTheDocument()
    expect(location()).toBe("/password")
  })

  it("returns to original path after re-login", async () => {
    mockLogin(() => HttpResponse.json(userDto()))
    renderLogin("/login?from=%2Fsearch%2Fabc")
    await fillAndSubmit("kim01", "pass1234!")
    expect(await screen.findByText("사건 조회 화면")).toBeInTheDocument()
    expect(location()).toBe("/search/abc")
  })

  it("ignores external from", async () => {
    mockLogin(() => HttpResponse.json(userDto()))
    renderLogin("/login?from=%2F%2Fevil.example")
    await fillAndSubmit("kim01", "pass1234!")
    await waitFor(() => expect(location()).toBe("/cases"))
  })
})
