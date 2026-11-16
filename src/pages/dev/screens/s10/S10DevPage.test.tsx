import { fireEvent, render, screen, within } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it } from "vitest"

import { S10DevPage } from "./S10DevPage"

const renderAt = (query: string) =>
  render(
    <MemoryRouter initialEntries={[`/dev/s10?${query}`]}>
      <S10DevPage />
    </MemoryRouter>,
  )

// 진열 막대(data-dev-bar)와 껍데기 메뉴에도 「등록」 글자가 있을 수 있어 툴바 버튼만 이름으로 찾는다
const button = (name: string) => screen.queryByRole("button", { name })

describe("S10 신발문양 관리 진열 페이지", () => {
  it("ready 케이스에 신발 목록과 00758 을 그대로 그린다", () => {
    renderAt("case=ready&as=admin")
    expect(screen.getByRole("table")).toBeInTheDocument()
    expect(screen.getByText("00758")).toBeInTheDocument()
  })

  it("검색 폼 라벨이 SCAS 순서(3열 × 4행)다", () => {
    renderAt("case=ready&as=admin")
    const labels = ["화류번호", "제조사", "성별", "등록일자", "상표", "승인", "등록관서", "그룹명", "문양 입력", "화종", "비고"]
    const found = labels.map((l) => screen.getByText(l, { selector: "div" }))
    found.forEach((el, i) => {
      if (i > 0) expect(found[i - 1].compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })
  })

  it("검색 폼은 3열이고 11칸이 4행에 놓인다", () => {
    const { container } = renderAt("case=ready&as=admin")
    const form = container.querySelector('[data-part="SearchForm"]')
    expect(form).toHaveAttribute("data-part-variant", "col3")
    const labelCount = form!.querySelectorAll(":scope > div > div:nth-child(odd)").length
    expect(labelCount).toBe(11)
    expect(Math.ceil(labelCount / 3)).toBe(4)
  })

  it("검색 칸은 한국어 이름으로 찾는다", () => {
    renderAt("case=ready&as=admin")
    for (const name of ["화류번호", "제조사", "상표", "그룹명", "화종", "비고", "등록일자 시작일", "등록일자 종료일"]) {
      expect(screen.getByRole("textbox", { name })).toBeInTheDocument()
    }
  })

  it("케이스를 같은 화면에서 ready → duplicate 로 바꾸면 창이 열린다", () => {
    renderAt("case=ready&as=admin")
    expect(screen.queryByRole("dialog")).toBeNull()
    fireEvent.click(screen.getByRole("link", { name: "duplicate" }))
    expect(screen.getByRole("alert")).toHaveTextContent("이미 등록된 번호입니다")
    fireEvent.click(screen.getByRole("link", { name: "ready", hidden: true }))
    expect(screen.queryByRole("dialog")).toBeNull()
  })

  it("툴바가 원문 순서다", () => {
    renderAt("case=ready&as=admin")
    const names = ["목록보기", "문양보기", "조회", "엑셀", "삭제", "승인", "등록", "초기화", "엑셀 일괄 등록"]
    const els = names.map((n) => screen.getByRole("button",{ name: n }))
    els.forEach((el, i) => {
      if (i > 0) expect(els[i - 1].compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })
  })

  it("loading 케이스는 aria-busy=true", () => {
    const { container } = renderAt("case=loading")
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
  })

  it("error 케이스는 「다시」 버튼이 있고 「결과 없음」이 없다", () => {
    renderAt("case=error")
    expect(screen.getByRole("button", { name: "다시" })).toBeInTheDocument()
    expect(screen.queryByText(/결과 없음/)).toBeNull()
  })

  it("empty 케이스는 「결과 없음」을 보인다", () => {
    renderAt("case=empty")
    expect(screen.getByText("결과 없음")).toBeInTheDocument()
  })

  it("readonly 보기에서 등록 · 삭제 · 승인이 없다", () => {
    renderAt("case=ready&as=readonly")
    expect(button("등록")).toBeNull()
    expect(button("삭제")).toBeNull()
    expect(button("승인")).toBeNull()
  })

  it("verifier(SHOE_EDIT 없음)도 등록이 없다", () => {
    renderAt("case=ready&as=verifier")
    expect(button("등록")).toBeNull()
  })

  it("admin 의 「등록」은 레이어 창 1겹을 열고 필드 5개가 있다", () => {
    renderAt("case=ready&as=admin")
    fireEvent.click(screen.getByRole("button", { name: "등록" }))
    const dialog = screen.getByRole("dialog")
    expect(screen.getAllByRole("dialog")).toHaveLength(1)
    for (const label of ["모델명", "상표코드", "제조사코드", "수집처", "수집연도"]) {
      expect(within(dialog).getByLabelText(label)).toBeInTheDocument()
    }
    expect(within(dialog).getByRole("button", { name: "저장" })).toBeInTheDocument()
  })

  it("행을 누르면 열리고, readonly 면 저장이 없고 입력이 잠긴다", () => {
    renderAt("case=ready&as=readonly")
    fireEvent.click(screen.getByText("00758"))
    const dialog = screen.getByRole("dialog")
    expect(within(dialog).queryByRole("button", { name: "저장" })).toBeNull()
    expect(within(dialog).getByLabelText("모델명")).toHaveAttribute("readonly")
    expect(within(dialog).getByLabelText("신발ID")).toHaveValue("00758")
  })

  it("duplicate 케이스는 「이미 등록된 번호입니다」를 보인다", () => {
    renderAt("case=duplicate&as=admin")
    expect(screen.getByRole("alert")).toHaveTextContent("이미 등록된 번호입니다")
  })

  it("저장에서 이미 있는 번호면 같은 문구가 뜬다", () => {
    renderAt("case=ready&as=admin")
    fireEvent.click(screen.getByRole("button", { name: "등록" }))
    const dialog = screen.getByRole("dialog")
    fireEvent.change(within(dialog).getByLabelText("신발ID"), { target: { value: "00758" } })
    fireEvent.click(within(dialog).getByRole("button", { name: "저장" }))
    expect(within(dialog).getByRole("alert")).toHaveTextContent("이미 등록된 번호입니다")
  })

  it("긴 모델명 행이 있다(가로 넘침 점검용)", () => {
    renderAt("case=ready")
    expect(screen.getAllByRole("row").length).toBeGreaterThan(10)
    expect(screen.getByText(/한정판 컬러웨이$/)).toBeInTheDocument()
  })
})
