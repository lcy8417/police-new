import { fireEvent, render, screen, within } from "@testing-library/react"
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { S01DevPage } from "./S01DevPage"

const toastMock = vi.hoisted(() => vi.fn())
vi.mock("sonner", () => ({ toast: toastMock }))

function Where() {
  const { pathname, search } = useLocation()
  return <p data-testid="where">{pathname + search}</p>
}

function renderAt(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/dev/s01" element={<S01DevPage />} />
        <Route path="/dev/*" element={<Where />} />
      </Routes>
    </MemoryRouter>
  )
}

// 위 막대 「바로 찾기」(11/17 — 찾기 칸은 막대 하나)
const finder = () => screen.getByLabelText("감정번호 · 문서번호 바로 찾기")
const bodyRows = () => screen.getAllByRole("row").slice(1)

describe("S01DevPage 사건관리 목록", () => {
  beforeEach(() => window.localStorage.clear())

  it("ready 케이스에 사건 목록 행 · 막대 제목 · 건수를 그린다", () => {
    renderAt("/dev/s01?case=ready")
    expect(screen.getByText("00001-25-0646")).toBeInTheDocument()
    const bar = within(screen.getByRole("banner"))
    expect(bar.getByRole("heading", { name: "사건관리" })).toBeInTheDocument()
    expect(bar.getByText("116건")).toBeInTheDocument()
    expect(screen.getByText(/전체 116 중 1-20/)).toBeInTheDocument()
  })

  it("11/17 컴팩트: 상세 검색 · 엑셀 · 목록보기/문양보기 · 열 선택 · 15/25열 전환 · AI 표식 · 행 펼침이 없다", () => {
    const { container } = renderAt("/dev/s01?case=ready&as=analyst")
    for (const name of ["상세 검색", "엑셀", /열 선택/, /SCAS 열 전체/]) expect(screen.queryByRole("button", { name })).toBeNull()
    expect(screen.queryByText("문양보기")).toBeNull()
    expect(screen.queryByText("AI 7/12")).toBeNull()
    expect(screen.queryByText("AI✓")).toBeNull()
    expect(screen.queryByText("305659")).toBeNull()
    expect(container.querySelector('[data-part="ScanOverlay"]')).toBeNull()
    expect(container.querySelector('[data-part="SearchForm"]')).toBeNull()
  })

  it("loading 케이스는 aria-busy=\"true\"", () => {
    const { container } = renderAt("/dev/s01?case=loading")
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
    expect(screen.queryByText("결과 없음")).toBeNull()
  })

  it("error 케이스는 「다시」 버튼이 있고 「결과 없음」이 없다", () => {
    renderAt("/dev/s01?case=error")
    expect(screen.getByRole("button", { name: "다시" })).toBeInTheDocument()
    expect(screen.queryByText("결과 없음")).toBeNull()
  })

  it("empty 케이스는 「결과 없음」을 보인다", () => {
    renderAt("/dev/s01?case=empty")
    expect(screen.getByText("결과 없음")).toBeInTheDocument()
  })

  it("보는 사람에 따라 빠른 보기 칩 · 단추가 달라진다(시안 data-role — 옛 타일 규칙)", () => {
    const quickNames = () =>
      Array.from(screen.getByRole("group", { name: "빠른 보기" }).querySelectorAll("button")).map((b) =>
        b.textContent?.replace(/\s*\d+$/, "").trim()
      )
    const { unmount } = renderAt("/dev/s01?case=ready&as=analyst")
    expect(quickNames()).toEqual(["결과 확인 전", "이미지 미검색", "교차 검증"])
    expect(screen.getAllByRole("button", { name: "검색" }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole("button", { name: "검증" }).length).toBeGreaterThan(0)
    unmount()

    const v = renderAt("/dev/s01?case=ready&as=verifier")
    expect(quickNames()).toEqual(["결과 확인 전"])
    expect(screen.queryByRole("button", { name: "검색" })).toBeNull()
    expect(screen.queryByRole("button", { name: "검증" })).toBeNull()
    v.unmount()

    renderAt("/dev/s01?case=ready&as=investigator")
    expect(quickNames()).toEqual(["결과 확인 전"])
    expect(screen.getByRole("button", { name: "등록" })).toBeInTheDocument()
  }, 15_000)

  it("검증 단추는 눌러도 「시안 — 기능 준비 중」 알림만", () => {
    toastMock.mockClear()
    renderAt("/dev/s01?case=ready&as=analyst")
    fireEvent.click(screen.getAllByRole("button", { name: "검증" })[0])
    expect(toastMock).toHaveBeenCalledWith("시안 — 기능 준비 중")
  })

  it("?plus=0 이면 [data-plus] 가 하나도 없고 목록은 그대로", () => {
    const { container } = renderAt("/dev/s01?case=ready&as=analyst&plus=0")
    expect(container.querySelectorAll("[data-plus]")).toHaveLength(0)
    expect(screen.queryByRole("group", { name: "빠른 보기" })).toBeNull()
    expect(screen.queryByText(/갱신/)).toBeNull()
    expect(screen.getByText("00001-25-0646")).toBeInTheDocument()
  })

  it("readonly 보기에서 「등록」 버튼이 없고, admin 에서는 있다", () => {
    const r = renderAt("/dev/s01?case=ready&as=readonly")
    expect(screen.queryByRole("button", { name: "등록" })).toBeNull()
    r.unmount()
    renderAt("/dev/s01?case=ready&as=admin")
    expect(screen.getByRole("button", { name: "등록" })).toBeInTheDocument()
  })

  it("행을 누르면 페이지를 옮기지 않고 그 사건 창이 열리며 그 행이 고른 모양이 된다(r4 사건 창)", () => {
    renderAt("/dev/s01?case=ready&as=admin")
    fireEvent.click(screen.getByText("00001-25-0646"))
    expect(screen.queryByTestId("where")).toBeNull()
    expect(screen.getByRole("dialog", { name: "00001-25-0646 주거침입 사건 창" })).toBeInTheDocument()
    const row = within(screen.getByRole("table", { name: "사건 목록" })).getByText("00001-25-0646").closest('[role="row"]')
    expect(row).toHaveAttribute("aria-selected", "true")
  })

  it("「등록」을 누르면 등록 모드 상세로 이동한다", () => {
    renderAt("/dev/s01?case=ready&as=investigator")
    fireEvent.click(screen.getByRole("button", { name: "등록" }))
    expect(screen.getByTestId("where").textContent).toBe("/dev/s02?as=investigator")
  })

  it("쪽을 넘기면 다른 행이 보인다", () => {
    renderAt("/dev/s01?case=ready")
    fireEvent.click(screen.getByRole("button", { name: /다음/ }))
    expect(screen.getByText(/전체 116 중 21-40/)).toBeInTheDocument()
  })

  it("막대 바로 찾기: 감정번호 · 문서번호 · 사건명으로 좁히고, 0건이면 「조건에 맞는 항목 없음」 + 「조건 지우기」", () => {
    renderAt("/dev/s01?case=ready&plus=0")
    fireEvent.change(finder(), { target: { value: "강도" } })
    expect(screen.queryByText("00001-25-0646")).toBeNull()
    expect(screen.getByText("00001-25-0633")).toBeInTheDocument()
    fireEvent.change(finder(), { target: { value: "없는사건명zzz" } })
    expect(screen.getByText("조건에 맞는 항목 없음")).toBeInTheDocument()
    expect(screen.queryByText("결과 없음")).toBeNull()
    fireEvent.click(screen.getAllByRole("button", { name: "조건 지우기" })[1])
    expect(finder()).toHaveValue("")
    expect(screen.getByText(/전체 116 중 1-20/)).toBeInTheDocument()
  })

  it("내 담당만: 감정관(박○○)은 77건", () => {
    renderAt("/dev/s01?case=ready&plus=0&as=analyst")
    fireEvent.click(screen.getByRole("button", { name: "내 담당만" }))
    expect(screen.getByText("77 / 전체 116")).toBeInTheDocument()
  })

  it("쪽당 행 · 행 높이: 렌더 행 수와 행 높이 클래스가 바뀌고 기억된다", () => {
    const first = renderAt("/dev/s01?case=ready&plus=0")
    expect(bodyRows()).toHaveLength(20)
    expect(bodyRows()[0].className).toContain("h-16")
    fireEvent.click(screen.getByRole("button", { name: "10개" }))
    fireEvent.click(screen.getByRole("button", { name: "촘촘" }))
    expect(bodyRows()).toHaveLength(10)
    expect(bodyRows()[0].className).toContain("h-9")
    first.unmount()
    renderAt("/dev/s01?case=ready&plus=0")
    expect(bodyRows()).toHaveLength(10)
  })

  it("r4 빠른 보기 칩: 건수를 보이고, 누르면 목록이 그 사건만으로 걸러진다", () => {
    renderAt("/dev/s01?case=ready&as=analyst")
    const quick = within(screen.getByRole("group", { name: "빠른 보기" }))
    const awaiting = quick.getByRole("button", { name: "결과 확인 전 34" })
    fireEvent.click(awaiting)
    expect(awaiting).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByText("34 / 전체 116")).toBeInTheDocument()
    expect(screen.queryByText("00001-25-0646")).toBeNull()
  })
})
