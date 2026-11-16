import { fireEvent, render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom"
import { describe, expect, it } from "vitest"

import { S01DevPage } from "./S01DevPage"

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

describe("S01DevPage 사건관리 목록", () => {
  it("ready 케이스에 사건 목록 행과 전체 건수를 그린다", () => {
    renderAt("/dev/s01?case=ready")
    expect(screen.getByText("00001-25-0646")).toBeInTheDocument()
    expect(screen.getByText("사건관리 목록")).toBeInTheDocument()
    expect(screen.getByText(/전체 116 중 1-14/)).toBeInTheDocument()
    // 신발 ID 같은 번호는 문자열 그대로(앞자리 0 보존)
    expect(screen.queryByText("결과 없음")).toBeNull()
  })

  it("긴 사건명(40자 이상)은 한 줄로 줄여(truncate) 보이고 전체 값은 title 에 있다", () => {
    renderAt("/dev/s01?case=ready")
    const long = screen.getAllByTitle(/야간 건조물/)[0]
    expect(long.className).toMatch(/truncate/)
    expect((long.getAttribute("title") ?? "").length).toBeGreaterThanOrEqual(40)
  })

  it("피해자 · 사건장소 · 검거여부 · 타기관여부는 「준비 중」으로 잠겨 있다", () => {
    renderAt("/dev/s01?case=ready")
    for (const label of ["피해자", "사건장소", "검거여부", "타기관여부"]) {
      const el = screen.getByLabelText(label)
      expect(el).toBeDisabled()
      expect(el).toHaveAttribute("title", "준비 중")
    }
  })

  it("작성자 · 등록일자 조건도 조회에 걸린다", () => {
    renderAt("/dev/s01?case=ready")
    fireEvent.change(screen.getByLabelText("작성자"), { target: { value: "김" } })
    fireEvent.click(screen.getByRole("button", { name: "조회" }))
    expect(screen.getByText("결과 없음")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "초기화" }))
    fireEvent.change(screen.getByLabelText("등록일자 시작"), { target: { value: "2025-07-24" } })
    fireEvent.click(screen.getByRole("button", { name: "조회" }))
    expect(screen.getByText(/전체 \d+ 중 1-/)).toBeInTheDocument()
    expect(screen.queryByText("전체 116 중 1-14")).toBeNull()
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

  it("SCAS 검색 폼 라벨 순서가 시안과 같다(첫 열: 감정번호 · 등록일자 · 사건장소)", () => {
    const { container } = renderAt("/dev/s01?case=ready")
    const labels = Array.from(container.querySelectorAll('[data-part="SearchForm"] > div > div:nth-child(odd)')).map(
      (el) => el.textContent?.trim()
    )
    // 3열 × 5행, 줄 단위로 읽은 순서(시안 그대로)
    expect(labels.slice(0, 15)).toEqual([
      "감정번호", "문서번호", "사건명",
      "등록일자", "피해자", "구분",
      "사건장소", "검거여부", "작성자",
      "처리관서", "의뢰관서", "발생관서",
      "사건결과", "타기관여부",
    ].slice(0, 14))
    // 각 줄의 첫 칸(= 첫 열): 감정번호 · 등록일자 · 사건장소
    expect([labels[0], labels[3], labels[6]]).toEqual(["감정번호", "등록일자", "사건장소"])
  })

  it("툴바 순서는 「목록보기/문양보기 · 초기화 · 엑셀 · 조회 · 등록」", () => {
    renderAt("/dev/s01?case=ready&as=investigator")
    const bar = screen.getByRole("group", { name: "사건관리 목록 도구" })
    const names = Array.from(bar.querySelectorAll("button"))
      .map((el) => el.textContent?.replace(/[◉○]\s?/, "").trim())
    expect(names.slice(0, 6)).toEqual(["목록보기", "문양보기", "초기화", "엑셀", "조회", "등록"])
  })

  it("앱에 없는 「엑셀」 · 「문양보기」 는 잠기고 「준비 중」 안내가 붙는다", () => {
    renderAt("/dev/s01?case=ready")
    expect(screen.getByRole("button", { name: "엑셀" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "엑셀" }).parentElement).toHaveAttribute("title", "준비 중")
    const pattern = screen.getByText("문양보기")
    expect(pattern.closest("button")).toBeDisabled()
    expect(pattern.closest("[title]")).toHaveAttribute("title", "준비 중")
  })

  it("readonly 보기에서 「등록」 버튼이 없다", () => {
    renderAt("/dev/s01?case=ready&as=readonly")
    expect(screen.queryByRole("button", { name: "등록" })).toBeNull()
  })

  it("admin · investigator 에서는 「등록」 이 있다", () => {
    renderAt("/dev/s01?case=ready&as=admin")
    expect(screen.getByRole("button", { name: "등록" })).toBeInTheDocument()
  })

  it("행을 누르면 그 사건 상세 진열 주소로 이동하고 보는 사람(as)을 유지한다", () => {
    renderAt("/dev/s01?case=ready&as=admin")
    fireEvent.click(screen.getByText("00001-25-0646"))
    expect(screen.getByTestId("where").textContent).toBe("/dev/s02?id=00001-25-0646&as=admin")
  })

  it("「등록」을 누르면 등록 모드 상세로 이동한다", () => {
    renderAt("/dev/s01?case=ready&as=investigator")
    fireEvent.click(screen.getByRole("button", { name: "등록" }))
    expect(screen.getByTestId("where").textContent).toBe("/dev/s02?as=investigator")
  })

  it("조회 조건에 맞는 사건이 없으면 「결과 없음」(필터는 값을 바꿔 보인다)", () => {
    renderAt("/dev/s01?case=ready")
    fireEvent.change(screen.getByLabelText("감정번호"), { target: { value: "99999" } })
    fireEvent.click(screen.getByRole("button", { name: "조회" }))
    expect(screen.getByText("결과 없음")).toBeInTheDocument()
  })

  it("쪽을 넘기면 다른 행이 보인다", () => {
    renderAt("/dev/s01?case=ready")
    fireEvent.click(screen.getByRole("button", { name: /다음/ }))
    expect(screen.getByText(/전체 116 중 15-28/)).toBeInTheDocument()
  })
})
