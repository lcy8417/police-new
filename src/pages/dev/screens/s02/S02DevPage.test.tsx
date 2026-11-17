import { act, fireEvent, render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom"
import { describe, expect, it, vi } from "vitest"

import { S02DevPage } from "./S02DevPage"

const toastMock = vi.hoisted(() => Object.assign(vi.fn(), { success: vi.fn() }))
vi.mock("sonner", () => ({ toast: toastMock }))

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

/** 오른쪽 「사건정보 | 현장 이미지 정보」 탭(11/17 — 사건 창과 같은 모양)에서 현장 이미지 쪽을 연다 */
const openImageTab = () => fireEvent.click(screen.getByRole("tab", { name: /현장 이미지 정보/ }))

describe("S02DevPage 사건 상세·등록", () => {
  it("+α 를 끄면 「이전」 · 「다음」 은 1차처럼 잠기고 「준비 중」 안내가 붙는다", () => {
    renderAt(`${DETAIL}&plus=0`)
    for (const name of ["이전", "다음"]) {
      const btn = screen.getByRole("button", { name })
      expect(btn).toBeDisabled()
      expect(btn.parentElement).toHaveAttribute("title", "준비 중")
    }
  })

  describe("r2 시안 +α", () => {
    it("단계 띠 · AI 1차 작업 점검 · 필수 칸 원형 진행 · 접수 경로 · 채취 방법 AI 제안이 시안 문구 그대로 보인다", () => {
      const { container } = renderAt(`${DETAIL}&as=analyst`)
      const stepper = container.querySelector('[data-part="Stepper"][data-part-variant="labeled"]')!
      expect(stepper.textContent).toBe("접수1차 작업검색·판정교차 검증감정서")
      expect(stepper.querySelector('[aria-current="step"]')!.textContent).toBe("1차 작업")
      expect(screen.getByText("AI 1차 작업 점검")).toBeInTheDocument()
      expect(screen.getByText("_4 ↔ _5")).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "_5 삭제" })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "반전 적용" })).toBeInTheDocument()
      expect(screen.getByText(/자 인식 11\/12장/)).toBeInTheDocument()
      expect(screen.getByText("필수 14 / 15")).toBeInTheDocument()
      expect(screen.getByText("공문 자동 접수 · 07-24 09:10")).toBeInTheDocument()
      // 자 인식 · 족적 영역 겹침은 「AI 표시」를 골라야 보인다(2회차 검수)
      fireEvent.click(screen.getByRole("button", { name: "AI 표시" }))
      expect(screen.getByText("자 인식 · 1px=0.12mm")).toBeInTheDocument()
      expect(screen.getByText("올리자마자 AI가 중복·전사판·화질·자를 점검합니다")).toBeInTheDocument()
      expect(screen.getByText("중복? _4")).toBeInTheDocument()
      openImageTab()
      expect(screen.getByText("전사판채취법")).toBeInTheDocument()
      expect(screen.getByText("근거: 전사지 경계 · 뒤집힌 글자 · 신뢰 0.91")).toBeInTheDocument()
    })

    it("?plus=0 이면 [data-plus] 가 하나도 없고 1차 내용은 그대로", () => {
      const { container } = renderAt(`${DETAIL}&plus=0`)
      expect(container.querySelectorAll("[data-plus]")).toHaveLength(0)
      expect(screen.queryByText("AI 1차 작업 점검")).toBeNull()
      expect(screen.queryByText("필수 14 / 15")).toBeNull()
      expect(screen.getByLabelText("사건 이름")).toHaveValue("주거침입")
      expect(screen.getByText("00001-25-0649_3.jpg")).toBeInTheDocument()
      expect(screen.queryByRole("progressbar")).toBeNull()
    })

    it("보는 사람에 따라 AI 점검 · 검색 · 읽기 전용 칩이 달라진다(시안 data-role)", () => {
      const a = renderAt(`${DETAIL}&as=analyst`)
      expect(screen.getByText("AI 1차 작업 점검")).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /문양 상세보기/ })).toBeInTheDocument()
      for (const b of screen.getAllByRole("button", { name: "수정" })) expect(b).toBeEnabled()
      a.unmount()

      const v = renderAt(`${DETAIL}&as=verifier`)
      expect(screen.queryByText("AI 1차 작업 점검")).toBeNull()
      expect(screen.queryByRole("button", { name: /문양 상세보기/ })).toBeNull()
      expect(screen.getByText("기술책임자 · 읽기 전용")).toBeInTheDocument()
      for (const b of screen.getAllByRole("button", { name: "수정" })) expect(b).toBeDisabled()
      v.unmount()

      renderAt(`${DETAIL}&as=investigator`)
      expect(screen.getByText("수사관 · 의뢰한 사건만")).toBeInTheDocument()
      expect(screen.queryByText("AI 1차 작업 점검")).toBeNull()
    })

    it("이전 · 다음 · 수정 · _5 삭제는 「시안 — 기능 준비 중」 알림", () => {
      toastMock.mockClear()
      renderAt(`${DETAIL}&as=analyst`)
      for (const name of ["이전", "다음", "_5 삭제", "반전 적용"]) {
        fireEvent.click(screen.getByRole("button", { name }))
      }
      expect(toastMock).toHaveBeenCalledTimes(4)
      expect(toastMock).toHaveBeenCalledWith("시안 — 기능 준비 중")
    })

    it("채취 방법 AI 제안 「적용」은 발견 방법 칸에 값을 넣고 제안이 사라진다", () => {
      renderAt(`${DETAIL}&as=analyst`)
      openImageTab()
      expect(screen.getByLabelText("발견 방법")).toHaveValue("기타")
      fireEvent.click(screen.getByRole("button", { name: "적용" }))
      expect(screen.getByLabelText("발견 방법")).toHaveValue("전사판채취법")
      expect(screen.queryByText("근거: 전사지 경계 · 뒤집힌 글자 · 신뢰 0.91")).toBeNull()
    })

    it("「원본 / 이진화 / AI 표시」: AI 겹침은 「AI 표시」에서만, 이진화는 필터. AI 가 일하지 않으면 훑기 선 없음(2회차 검수)", () => {
      const { container } = renderAt(`${DETAIL}&as=analyst`)
      expect(screen.queryByText(/족적 영역/)).toBeNull()
      fireEvent.click(screen.getByRole("button", { name: "AI 표시" }))
      expect(screen.getByText(/족적 영역/)).toBeInTheDocument()
      expect(container.querySelector('[data-part="ScanOverlay"]')).toBeNull()
      fireEvent.click(screen.getByRole("button", { name: "이진화" }))
      expect(screen.queryByText(/족적 영역/)).toBeNull()
      expect(container.querySelector('[data-part="EvidenceImage"]')).toHaveAttribute("data-part-variant", "binary")
    })

    it("움직임 줄이기: 업로드 막대는 motion-safe 로만 움직인다", () => {
      renderAt(`${DETAIL}&as=analyst`)
      const upload = screen.getByRole("progressbar", { name: "업로드" })
      expect(upload.querySelector("i")!.className).toContain("motion-safe:")
      expect(upload).toHaveAttribute("aria-valuenow", "68")
    })
  })

  it("ready 케이스에 사건정보 7칸을 그리고 사건등록번호는 필수로 표시한다", () => {
    const { container } = renderAt(DETAIL)
    const labels = () =>
      Array.from(container.querySelectorAll('[data-part="SearchForm"] > div > div:nth-child(odd)')).map((el) =>
        el.textContent?.replace(/\s*\*$/, "").trim()
      )
    // 시안 순서: 「사건정보」 탭 16칸 · 「현장 이미지 정보」 탭 13칸
    expect(labels()).toEqual([
      "사건등록번호", "문서번호", "SCAS사건번호", "피해자 성명", "의뢰관서", "출생년도", "사건 이름", "용의자 유무",
      "사건일시", "사건장소", "발생관서", "검거여부", "사건주소", "감정의뢰 담당자", "사건개요", "비고",
    ])
    // 동작하는 칸은 고칠 수 있고, 나머지는 「준비 중」으로 잠긴다
    for (const l of ["사건등록번호", "사건 이름"]) expect(screen.getByLabelText(l)).toBeEnabled()
    expect(screen.getByRole("combobox")).toBeEnabled()
    for (const l of ["문서번호", "SCAS사건번호", "피해자 성명", "출생년도", "사건장소", "검거여부", "사건개요"]) {
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

    openImageTab()
    expect(labels()).toEqual([
      "구분", "이미지 번호", "채취 일시", "채취자 계급", "채취 장소", "채취자 이름", "발견 방법", "감정물 종류",
      "제조사", "족적 구분", "상표", "굽 유무", "화종",
    ])
    for (const l of ["이미지 번호", "채취 일시", "채취 장소", "발견 방법"]) expect(screen.getByLabelText(l)).toBeEnabled()
    for (const l of ["제조사", "상표"]) {
      const el = screen.getByLabelText(l)
      expect(el).toBeDisabled()
      expect(el.getAttribute("title") ?? "").toBe("준비 중")
    }
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

  it("?copy= 는 그 사건을 복사한 새 등록(번호만 비움 · 이미지 유지) — 사건 창 ⋯ 「사건복사」가 여는 주소", () => {
    renderAt("/dev/s02?copy=00001-25-0633&case=ready")
    expect(screen.getByLabelText("사건등록번호")).toHaveValue("")
    expect(screen.getByText("사건 등록")).toBeInTheDocument()
    expect(screen.getAllByText("00001-25-0633_1.jpg").length).toBeGreaterThan(0)
    // 단독 진열은 SCAS 원 화면 그대로 — 이미지 목록 · 머리 도구가 있다
    expect(screen.getByText("이미지 목록")).toBeInTheDocument()
    expect(screen.getByLabelText("사건 상세 도구")).toBeInTheDocument()
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
      expect(screen.queryByRole("progressbar", { name: "업로드" })).toBeNull()
      expect(screen.getByText("00001-25-0649_13.jpg")).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  it("검색 (문양 상세보기) 는 조회 권한이 있어야 보이고 S04 로 이동한다", () => {
    const { unmount } = renderAt(`${DETAIL}&as=readonly`)
    expect(screen.queryByRole("button", { name: /문양 상세보기/ })).toBeNull()
    unmount()
    renderAt(`${DETAIL}&as=analyst`)
    fireEvent.click(screen.getByRole("button", { name: /문양 상세보기/ }))
    expect(screen.getByTestId("where").textContent).toBe("/dev/s04?id=00001-25-0649&as=analyst")
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

  describe("r3 이미지 목록 파일명 검색", () => {
    it("검색으로 숨겨진 줄의 삭제 체크는 풀려 「삭제」가 보이는 줄만 지운다", () => {
      renderAt(`${DETAIL}&plus=0`)
      fireEvent.click(screen.getByRole("checkbox", { name: "00001-25-0649_3.jpg 선택" }))
      fireEvent.change(screen.getByLabelText("검색어"), { target: { value: "_12" } })
      expect(screen.getByRole("button", { name: "삭제" })).toBeDisabled()
      fireEvent.click(screen.getByRole("checkbox", { name: "00001-25-0649_12.jpg 선택" }))
      fireEvent.click(screen.getByRole("button", { name: "삭제" }))
      fireEvent.click(screen.getAllByRole("button", { name: "조건 지우기" }).at(-1)!)
      expect(screen.queryByText("00001-25-0649_12.jpg")).toBeNull()
      expect(screen.getByText("00001-25-0649_3.jpg")).toBeInTheDocument()
    })

    it("검색하면 목록만 걸러지고, 0건이면 「조건에 맞는 항목 없음」과 「조건 지우기」, ?plus=0 에서도 보인다", () => {
      renderAt(`${DETAIL}&plus=0`)
      const box = screen.getByLabelText("검색어")
      fireEvent.change(box, { target: { value: "_12" } })
      expect(screen.getByText("00001-25-0649_12.jpg")).toBeInTheDocument()
      expect(screen.queryByText("00001-25-0649_3.jpg")).toBeNull()
      fireEvent.change(box, { target: { value: "없는파일" } })
      expect(screen.getByText("조건에 맞는 항목 없음")).toBeInTheDocument()
      expect(screen.queryByText("이미지 없음")).toBeNull()
      fireEvent.click(screen.getAllByRole("button", { name: "조건 지우기" }).at(-1)!)
      expect(screen.getByText("00001-25-0649_3.jpg")).toBeInTheDocument()
    })
  })
})
