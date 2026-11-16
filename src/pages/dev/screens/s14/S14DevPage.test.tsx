import { fireEvent, render, screen, within } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it } from "vitest"

import { S14DevPage } from "./S14DevPage"

const renderAt = (query: string) =>
  render(
    <MemoryRouter initialEntries={[`/dev/s14${query}`]}>
      <S14DevPage />
    </MemoryRouter>
  )

const admin = (c: string) => renderAt(`?case=${c}&as=admin`)
const list = () => screen.getByRole("region", { name: "로그인 기록" })

describe("S14 사용·감사 기록 진열 페이지", () => {
  it("ready 케이스에 필터 막대(사용자 · 결과 · 기능 · 기간)와 세션 표를 그린다", () => {
    admin("ready")
    const bar = screen.getByRole("search", { name: "사용 기록 필터" })
    for (const label of ["사용자", "기간", "결과", "기능"]) {
      expect(within(bar).getByText(label)).toBeInTheDocument()
    }
    expect(within(bar).getByRole("button", { name: "필터 초기화" })).toBeInTheDocument()
    const headers = within(list())
      .getAllByRole("columnheader")
      .map((h) => h.textContent)
    expect(headers).toEqual(["", "사용자", "로그인", "로그아웃", "종료 사유", "IP", "이벤트 수", "실패 수"])
    expect(within(list()).getByText("park0412")).toBeInTheDocument()
  })

  it("로그아웃 시각이 없는 세션은 「사용 중」 칩을 보인다", () => {
    admin("ready")
    expect(within(list()).getAllByText("사용 중").length).toBeGreaterThan(0)
  })

  it("세션 행을 펼치면 기능 타임라인이 보이고 다시 누르면 접힌다", async () => {
    admin("ready")
    expect(screen.queryByRole("list", { name: "이 로그인의 기능 기록" })).toBeNull()
    const toggle = within(list()).getAllByRole("button", { name: "기능 기록 펼치기" })[0]
    fireEvent.click(toggle)
    expect(screen.getByText("기능 기록을 불러오는 중…")).toBeInTheDocument()
    const timeline = await screen.findByRole("list", { name: "이 로그인의 기능 기록" })
    expect(within(timeline).getAllByText("성공").length).toBeGreaterThan(0)
    expect(within(timeline).getAllByText("실패").length).toBeGreaterThan(0)
    fireEvent.click(toggle)
    expect(screen.queryByRole("list", { name: "이 로그인의 기능 기록" })).toBeNull()
  })

  it("실패 이벤트를 누르면 오류 내용(긴 문구 포함)이 펼쳐진다", async () => {
    admin("ready")
    fireEvent.click(within(list()).getAllByRole("button", { name: "기능 기록 펼치기" })[0])
    const timeline = await screen.findByRole("list", { name: "이 로그인의 기능 기록" })
    const failRow = within(timeline).getByRole("button", { name: /감정서 출력/ })
    fireEvent.click(failRow)
    expect(within(timeline).getByText(/프린터 응답 없음/)).toBeInTheDocument()
  })

  it("타임라인을 못 읽은 세션은 「결과 없음」이 아니라 오류와 「다시」를 보인다", async () => {
    admin("ready")
    // lee0508 행(이름으로 찾음) — 타임라인 조회 실패
    const row = within(list()).getByText("lee0508").closest("tr") as HTMLElement
    fireEvent.click(within(row).getByRole("button", { name: "기능 기록 펼치기" }))
    expect(await screen.findByText("기능 기록을 확인하지 못했습니다")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "다시" })).toBeInTheDocument()
    expect(screen.queryByText("결과 없음")).toBeNull()
  })

  it("50개 미만이면 다음 쪽 버튼이 disabled", () => {
    admin("ready")
    expect(screen.getByRole("button", { name: /다음/ })).toBeDisabled()
    expect(screen.getByRole("button", { name: /이전/ })).toBeDisabled()
  })

  it("한 쪽이 꽉 차면(50개) 다음 쪽이 눌리고, 넘기면 나머지 행과 함께 끝난다", () => {
    admin("full-page")
    const next = screen.getByRole("button", { name: /다음/ })
    expect(next).toBeEnabled()
    expect(within(list()).getAllByRole("row")).toHaveLength(1 + 50)
    fireEvent.click(next)
    expect(screen.getByRole("button", { name: /다음/ })).toBeDisabled()
    expect(screen.getByRole("button", { name: /이전/ })).toBeEnabled()
  })

  it("꽉 찬 쪽 다음이 빈 쪽이면 「결과 없음」과 함께 「이전」이 남아 있다", () => {
    admin("exact-page")
    fireEvent.click(screen.getByRole("button", { name: /다음/ }))
    expect(screen.getByText("결과 없음")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "다시" })).toBeNull()
    const prev = screen.getByRole("button", { name: /이전/ })
    expect(prev).toBeEnabled()
    fireEvent.click(prev)
    expect(within(list()).getAllByRole("row")).toHaveLength(1 + 50)
  })

  it("기능 기록 탭은 결과 칩 성공 · 실패 · 권한 없음을 보인다", () => {
    admin("ready")
    fireEvent.click(screen.getByRole("button", { name: "기능 기록" }))
    const events = screen.getByRole("region", { name: "기능 기록" })
    expect(within(events).getAllByText("성공").length).toBeGreaterThan(0)
    expect(within(events).getAllByText("실패").length).toBeGreaterThan(0)
    expect(within(events).getAllByText("권한 없음").length).toBeGreaterThan(0)
  })

  it("결과 필터를 「실패만」으로 바꾸면 기능 기록이 실패만 남는다", () => {
    admin("ready")
    fireEvent.click(screen.getByRole("button", { name: "기능 기록" }))
    fireEvent.click(screen.getByRole("button", { name: "실패만" }))
    const events = screen.getByRole("region", { name: "기능 기록" })
    expect(within(events).queryByText("성공")).toBeNull()
    expect(within(events).queryByText("권한 없음")).toBeNull()
    expect(within(events).getAllByText("실패").length).toBeGreaterThan(0)
  })

  it("필터에 걸리는 기록이 없으면 「결과 없음」(실패와 구분)", () => {
    admin("ready")
    fireEvent.click(screen.getByRole("button", { name: "기능 기록" }))
    fireEvent.change(screen.getByLabelText("시작 날짜"), { target: { value: "2026-12-01" } })
    fireEvent.change(screen.getByLabelText("끝 날짜"), { target: { value: "2026-12-02" } })
    expect(screen.getByText("결과 없음")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "다시" })).toBeNull()
  })

  it("loading 케이스는 aria-busy=true", () => {
    const { container } = admin("loading")
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
  })

  it("error 케이스는 「다시」 버튼이 있고 「결과 없음」이 없다", () => {
    admin("error")
    expect(screen.getByRole("button", { name: "다시" })).toBeInTheDocument()
    expect(screen.queryByText("결과 없음")).toBeNull()
    expect(screen.queryByRole("button", { name: /다음/ })).toBeNull()
  })

  it("empty 케이스는 「결과 없음」을 보인다", () => {
    admin("empty")
    expect(screen.getByText("결과 없음")).toBeInTheDocument()
  })

  it.each(["investigator", "readonly"])("%s 보기는 「관리자만 볼 수 있습니다」만 보인다", (as) => {
    renderAt(`?case=ready&as=${as}`)
    expect(screen.getByText("관리자만 볼 수 있습니다")).toBeInTheDocument()
    expect(screen.queryByRole("search", { name: "사용 기록 필터" })).toBeNull()
    expect(screen.queryByRole("region", { name: "로그인 기록" })).toBeNull()
  })

  it("긴 이름 · 긴 IP도 줄바꿈되어 표 안에 들어간다", () => {
    admin("ready")
    const cell = within(list()).getByText(/족적감정팀 파견 담당/).closest("td")
    expect(cell?.className).toMatch(/whitespace-normal/)
  })
})
