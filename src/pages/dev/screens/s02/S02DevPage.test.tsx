import { act, fireEvent, render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom"
import { describe, expect, it, vi } from "vitest"

import { S02DevPage } from "./S02DevPage"

function Where() {
  const { pathname, search } = useLocation()
  return <p data-testid="where">{pathname + search}</p>
}

function renderAt(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/dev/s02" element={<S02DevPage />} />
        <Route path="/dev/*" element={<Where />} />
      </Routes>
    </MemoryRouter>
  )
}

const DETAIL = "/dev/s02?id=00001-25-0649&case=ready"

describe("S02DevPage 사건 상세·등록", () => {
  it("앱에 없는 「이전」 · 「다음」 은 잠기고 「준비 중」 안내가 붙는다", () => {
    renderAt(DETAIL)
    for (const name of ["이전", "다음"]) {
      const btn = screen.getByRole("button", { name })
      expect(btn).toBeDisabled()
      expect(btn.parentElement).toHaveAttribute("title", "준비 중")
    }
  })

  it("ready 케이스에 사건정보 7칸을 그리고 사건등록번호는 필수로 표시한다", () => {
    const { container } = renderAt(DETAIL)
    const labels = Array.from(container.querySelectorAll('[data-part="SearchForm"] > div > div:nth-child(odd)')).map(
      (el) => el.textContent?.replace(/\s*\*$/, "").trim()
    )
    // 시안 순서: 사건정보 16칸 + 현장 이미지 정보 13칸(이미지 번호 · 채취 일시 · 채취 장소 · 발견 방법은 아래쪽)
    expect(labels.slice(0, 16)).toEqual([
      "사건등록번호", "문서번호", "SCAS사건번호", "피해자 성명", "의뢰관서", "출생년도", "사건 이름", "용의자 유무",
      "사건일시", "사건장소", "발생관서", "검거여부", "사건주소", "감정의뢰 담당자", "사건개요", "비고",
    ])
    expect(labels.slice(16)).toEqual([
      "구분", "이미지 번호", "채취 일시", "채취자 계급", "채취 장소", "채취자 이름", "발견 방법", "감정물 종류",
      "제조사", "족적 구분", "상표", "굽 유무", "화종",
    ])
    // 동작하는 7칸은 고칠 수 있고, 나머지는 「준비 중」으로 잠긴다
    const WORKING = ["사건등록번호", "이미지 번호", "사건 이름", "채취 일시", "채취 장소", "발견 방법"]
    for (const l of WORKING) expect(screen.getByLabelText(l)).toBeEnabled()
    expect(screen.getByRole("combobox")).toBeEnabled()
    for (const l of ["문서번호", "SCAS사건번호", "피해자 성명", "출생년도", "사건장소", "검거여부", "제조사", "상표", "사건개요"]) {
      const el = screen.getByLabelText(l)
      expect(el).toBeDisabled()
      expect(el.getAttribute("title") ?? "").toBe("준비 중")
    }
    expect(screen.getByLabelText("피해자 성명")).toHaveValue("김○○")
    expect(screen.getByRole("radiogroup", { name: "용의자 유무" })).toHaveAttribute("aria-disabled", "true")
    const required = container.querySelectorAll("[data-required]")
    expect(required).toHaveLength(1)
    expect(required[0].textContent).toBe("사건등록번호")
    expect(screen.getByLabelText("사건등록번호")).toHaveAttribute("aria-required", "true")
    expect(screen.getByLabelText("사건등록번호")).toHaveValue("00001-25-0649")
  })

  it("의뢰관서는 Combobox(검색해서 한 칸으로 고르기)", () => {
    const { container } = renderAt(DETAIL)
    expect(container.querySelector('[data-part="Combobox"]')).not.toBeNull()
    expect(screen.getByRole("combobox")).toBeInTheDocument()
  })

  it("이미지 목록은 숫자 순서(_1 → _12)로 보인다", () => {
    const { container } = renderAt(DETAIL)
    const names = Array.from(container.querySelectorAll("tbody td:nth-child(2)"))
      .map((el) => Number(/_(\d+)\./.exec(el.textContent ?? "")![1]))
    expect(names).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
  })

  it("loading 케이스는 aria-busy=\"true\"", () => {
    const { container } = renderAt("/dev/s02?id=00001-25-0649&case=loading")
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
  })

  it("error 케이스는 「다시」 버튼이 있고 「결과 없음」이 없다", () => {
    renderAt("/dev/s02?id=00001-25-0649&case=error")
    expect(screen.getByRole("button", { name: "다시" })).toBeInTheDocument()
    expect(screen.queryByText("결과 없음")).toBeNull()
  })

  it("사건번호가 비면 「저장」 뒤 필수 입력 안내가 뜬다", () => {
    renderAt("/dev/s02?case=ready")
    fireEvent.click(screen.getByRole("button", { name: "저장" }))
    expect(screen.getByRole("alert")).toHaveTextContent("이미지와 사건 번호는 필수 입력 사항입니다.")
  })

  it("값이 있으면 「저장」 뒤 안내가 없고 입력은 제어형으로 바뀐다", () => {
    renderAt(DETAIL)
    fireEvent.change(screen.getByLabelText("사건 이름"), { target: { value: "절도" } })
    expect(screen.getByLabelText("사건 이름")).toHaveValue("절도")
    fireEvent.click(screen.getByRole("button", { name: "저장" }))
    expect(screen.queryByRole("alert")).toBeNull()
  })

  it("readonly 보기에서 저장 · 초기화 · 추가 · 삭제 · 사건복사가 없다", () => {
    renderAt(`${DETAIL}&as=readonly`)
    for (const name of ["저장", "초기화", "추가", "삭제", "사건복사"]) {
      expect(screen.queryByRole("button", { name })).toBeNull()
    }
    expect(screen.getByLabelText("사건 이름")).toHaveAttribute("readonly")
    // 의뢰관서도 열리는 목록(Combobox) 대신 읽기 전용 칸
    expect(screen.queryByRole("combobox")).toBeNull()
    expect(screen.getByLabelText("의뢰관서")).toHaveAttribute("readonly")
    expect(screen.getByLabelText("의뢰관서")).toHaveValue("대구청 › 동부서")
  })

  it("상세 모드의 「초기화」는 불러온 사건 값으로 되돌린다(번호 · 이미지 유지)", () => {
    renderAt(DETAIL)
    fireEvent.change(screen.getByLabelText("사건 이름"), { target: { value: "절도" } })
    fireEvent.click(screen.getByRole("checkbox", { name: "00001-25-0649_3.jpg 선택" }))
    fireEvent.click(screen.getByRole("button", { name: "삭제" }))
    fireEvent.click(screen.getByRole("button", { name: "초기화" }))
    expect(screen.getByLabelText("사건 이름")).toHaveValue("주거침입")
    expect(screen.getByLabelText("사건등록번호")).toHaveValue("00001-25-0649")
    expect(screen.getByText("00001-25-0649_3.jpg")).toBeInTheDocument()
  })

  it("등록 모드의 「초기화」는 입력을 비운다", () => {
    renderAt("/dev/s02?case=ready")
    fireEvent.change(screen.getByLabelText("사건등록번호"), { target: { value: "X-1" } })
    fireEvent.click(screen.getByRole("button", { name: "초기화" }))
    expect(screen.getByLabelText("사건등록번호")).toHaveValue("")
  })

  it("사진을 추가하면 올리는 중 막대가 보였다가 목록에 붙는다", () => {
    vi.useFakeTimers()
    try {
      renderAt(DETAIL)
      const file = new File(["x"], "a.jpg", { type: "image/jpeg" })
      fireEvent.change(screen.getByLabelText("이미지 파일 고르기"), { target: { files: [file] } })
      expect(screen.getByRole("progressbar", { name: "업로드" })).toBeInTheDocument()
      expect(screen.queryByText("00001-25-0649_13.jpg")).toBeNull()
      act(() => {
        vi.advanceTimersByTime(700)
      })
      expect(screen.queryByRole("progressbar")).toBeNull()
      expect(screen.getByText("00001-25-0649_13.jpg")).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  it("검색 (문양 상세보기) 는 조회 권한이 있어야 보이고 S04 로 이동한다", () => {
    const { unmount } = renderAt(`${DETAIL}&as=readonly`)
    expect(screen.queryByRole("button", { name: /문양 상세보기/ })).toBeNull()
    unmount()
    renderAt(`${DETAIL}&as=investigator`)
    fireEvent.click(screen.getByRole("button", { name: /문양 상세보기/ }))
    expect(screen.getByTestId("where").textContent).toBe("/dev/s04?id=00001-25-0649&as=investigator")
  })

  it("닫기는 사건관리 목록으로 돌아가고 보는 사람을 유지한다", () => {
    renderAt(`${DETAIL}&as=admin`)
    fireEvent.click(screen.getByRole("button", { name: "닫기" }))
    expect(screen.getByTestId("where").textContent).toBe("/dev/s01?as=admin")
  })

  it("이미지 삭제는 체크한 장만 지운다", () => {
    renderAt(DETAIL)
    fireEvent.click(screen.getByRole("checkbox", { name: "00001-25-0649_3.jpg 선택" }))
    fireEvent.click(screen.getByRole("button", { name: "삭제" }))
    expect(screen.queryByText("00001-25-0649_3.jpg")).toBeNull()
    expect(screen.getByText("00001-25-0649_4.jpg")).toBeInTheDocument()
  })
})
