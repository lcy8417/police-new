import { fireEvent, render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it } from "vitest"

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

  it("시안의 AI 시연 · 지난 로그인 · 내부망 안내 · 역할별 첫 화면은 담지 않는다(spec §5-3)", () => {
    renderAt("?case=ready")
    expect(screen.queryByText(/AI 감정 흐름|LIVE DEMO/)).toBeNull()
    expect(screen.queryByText(/지난 로그인/)).toBeNull()
    expect(screen.queryByText(/경찰 내부망 전용/)).toBeNull()
    expect(screen.queryByText(/로그인하면 처음 열리는 화면/)).toBeNull()
    expect(screen.queryByText(/남은 시도/)).toBeNull()
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

  it("failed 케이스는 서버 문구 그대로 InlineError 로 보인다", () => {
    renderAt("?case=failed")
    const alert = screen.getByRole("alert")
    expect(alert).toHaveTextContent(LOGIN_FAILED_MESSAGE)
    expect(alert.querySelector('[data-part="InlineError"]')).not.toBeNull()
    // 자격 오류는 다시 시도 버튼이 아니라 칸을 고쳐 다시 제출한다
    expect(screen.queryByRole("button", { name: "다시" })).toBeNull()
  })

  it("locked 케이스는 잠금 문구를 서버 문구 그대로 보인다", () => {
    renderAt("?case=locked")
    expect(screen.getByRole("alert")).toHaveTextContent(LOCKED_MESSAGE)
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
