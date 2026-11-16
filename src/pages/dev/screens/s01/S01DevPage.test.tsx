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

// r4: SCAS 검색 양식은 「상세 검색」 안에 접혀 있다(기본 접힘) — 양식 · 초기화 · 조회를 쓰는 시험은 먼저 편다
function openDetail() {
  fireEvent.click(screen.getByRole("button", { name: "상세 검색" }))
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
    expect(screen.getByText(/전체 116 중 1-20/)).toBeInTheDocument()
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
    openDetail()
    for (const label of ["피해자", "사건장소", "검거여부", "타기관여부"]) {
      const el = screen.getByLabelText(label)
      expect(el).toBeDisabled()
      expect(el).toHaveAttribute("title", "준비 중")
    }
  })

  it("작성자 · 등록일자 조건도 조회에 걸린다", () => {
    renderAt("/dev/s01?case=ready")
    openDetail()
    fireEvent.change(screen.getByLabelText("작성자"), { target: { value: "김" } })
    fireEvent.click(screen.getByRole("button", { name: "조회" }))
    expect(screen.getByText("결과 없음")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "초기화" }))
    fireEvent.change(screen.getByLabelText("등록일자 시작"), { target: { value: "2025-07-24" } })
    fireEvent.click(screen.getByRole("button", { name: "조회" }))
    expect(screen.getByText(/전체 \d+ 중 1-/)).toBeInTheDocument()
    expect(screen.queryByText("전체 116 중 1-20")).toBeNull()
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
    openDetail()
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

  it("r4 도구 자리: 머리 줄 「목록보기/문양보기 · 엑셀 · 열 선택 · 등록」, 상세 검색 안 「초기화 · 조회」(SCAS 앞뒤 순서는 그대로)", () => {
    renderAt("/dev/s01?case=ready&as=investigator")
    const bar = screen.getByRole("group", { name: "사건관리 목록 도구" })
    const names = Array.from(bar.querySelectorAll("button"))
      .map((el) => el.textContent?.replace(/[◉○]\s?/, "").trim())
    expect(names).toEqual(["상세 검색", "목록보기", "문양보기", "엑셀", expect.stringMatching(/^열 선택/), "등록"])
    openDetail()
    const detail = screen.getByRole("group", { name: "상세 검색 도구" })
    expect(Array.from(detail.querySelectorAll("button")).map((el) => el.textContent?.trim())).toEqual(["초기화", "조회"])
  })

  it("「엑셀」 · 「문양보기」 는 활성 모양이고 누르면 「시안 — 기능 준비 중」 알림(spec §13-4)", () => {
    toastMock.mockClear()
    renderAt("/dev/s01?case=ready")
    expect(screen.getByRole("button", { name: "엑셀" })).toBeEnabled()
    fireEvent.click(screen.getByRole("button", { name: "엑셀" }))
    fireEvent.click(screen.getByText("문양보기"))
    expect(toastMock).toHaveBeenCalledTimes(2)
    expect(toastMock).toHaveBeenCalledWith("시안 — 기능 준비 중")
  })

  it("?plus=0 이면 「엑셀」 · 「문양보기」 는 자리만 두고 잠긴다(「준비 중」, spec §5-2 규칙 3)", () => {
    toastMock.mockClear()
    renderAt("/dev/s01?case=ready&plus=0")
    const excel = screen.getByRole("button", { name: "엑셀" })
    expect(excel).toBeDisabled()
    expect(excel.parentElement).toHaveAttribute("title", "준비 중")
    const pattern = screen.getByRole("radio", { name: /문양보기/ })
    expect(pattern).toBeDisabled()
    expect(pattern.parentElement).toHaveAttribute("title", "준비 중")
    expect(screen.getByRole("radio", { name: /목록보기/ })).toBeEnabled()
    fireEvent.click(excel)
    fireEvent.click(pattern)
    expect(toastMock).not.toHaveBeenCalled()
    // SCAS 툴바 앞뒤 순서는 그대로(초기화 · 조회는 r4 에서 상세 검색 안으로)
    const bar = screen.getByRole("group", { name: "사건관리 목록 도구" })
    const names = Array.from(bar.querySelectorAll("button")).map((el) => el.textContent?.replace(/[◉○]\s?/, "").trim())
    // 찾기 칸 · 「상세 검색」은 뚜껑 한 줄을 위해 머리 줄 맨 앞(SCAS 툴바 단추들 앞)
    expect(names.slice(0, 4)).toEqual(["상세 검색", "목록보기", "문양보기", "엑셀"])
  })

  describe("r2 시안 +α", () => {
    it("실시간 · 사건 진행 열 · 행 펼침이 시안 문구 그대로 보이고, KPI 타일은 없다(r4)", () => {
      renderAt("/dev/s01?case=ready&as=analyst")
      // r4(2026-11-16 「kpi 부분은 없애자」): AI 사전 처리 · 할 일 타일은 지웠다
      expect(screen.queryByText("AI 사전 처리")).toBeNull()
      expect(screen.queryByText("교차 검증 요청 받음")).toBeNull()
      expect(screen.getByText("실시간 · 09:12 갱신")).toBeInTheDocument()
      expect(screen.getByText("＋사건 진행")).toBeInTheDocument()
      expect(screen.getByText("AI 7/12")).toBeInTheDocument()
      expect(screen.getAllByText("AI✓").length).toBeGreaterThan(0)
      // 0646 행 펼침: 이미지별 현장 → 이진화 → 1위 후보 + 발견/불발견 칩
      expect(screen.getByText("감정불능")).toBeInTheDocument()
      expect(screen.getByText("305659")).toBeInTheDocument()
      expect(screen.getByText("끝까지 봄")).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "사건 열기 (S02)" })).toBeInTheDocument()
    })

    it("?plus=0 이면 [data-plus] 가 하나도 없고 1차 내용은 그대로", () => {
      const { container } = renderAt("/dev/s01?case=ready&as=analyst&plus=0")
      expect(container.querySelectorAll("[data-plus]")).toHaveLength(0)
      expect(screen.queryByRole("group", { name: "빠른 보기" })).toBeNull()
      expect(screen.queryByText("＋사건 진행")).toBeNull()
      expect(screen.queryByText(/실시간/)).toBeNull()
      expect(screen.getByText("00001-25-0646")).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "기본 보기 14열" })).toBeInTheDocument()
      expect(screen.getByText(/전체 116 중 1-20/)).toBeInTheDocument()
    })

    it("보는 사람에 따라 빠른 보기 칩 · 버튼이 달라진다(시안 data-role — 옛 타일 규칙)", () => {
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
      expect(screen.queryByText("AI 7/12")).toBeNull()
      expect(screen.getByRole("button", { name: "등록" })).toBeInTheDocument()
      // 화면을 세 번 그려 병렬 부하에서 5초를 넘길 수 있다
    }, 15_000)

    it("검증요청 · 검증은 눌러도 「시안 — 기능 준비 중」 알림만", () => {
      toastMock.mockClear()
      renderAt("/dev/s01?case=ready&as=analyst")
      fireEvent.click(screen.getAllByRole("button", { name: "검증" })[0])
      expect(toastMock).toHaveBeenCalledWith("시안 — 기능 준비 중")
    })

    it("움직임 줄이기: 스캔 선은 motion-safe 로만 움직인다(멈춘 모양 = 안 보임)", () => {
      const { container } = renderAt("/dev/s01?case=ready&as=analyst")
      const scan = container.querySelector('[data-part="ScanOverlay"]')
      expect(scan).not.toBeNull()
      expect(scan!.className).toContain("motion-safe:animate-fx-scan")
      expect(scan!.className).toContain("opacity-0")
    })

    it("펼침 줄은 순번 숫자로 접고 편다", () => {
      renderAt("/dev/s01?case=ready&as=analyst")
      fireEvent.click(screen.getByRole("button", { name: "00001-25-0646 이미지별 요약 접기" }))
      expect(screen.queryByText("305659")).toBeNull()
      fireEvent.click(screen.getByRole("button", { name: "00001-25-0646 이미지별 요약 펼치기" }))
      expect(screen.getByText("305659")).toBeInTheDocument()
    })
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
    openDetail()
    fireEvent.change(screen.getByLabelText("감정번호"), { target: { value: "99999" } })
    fireEvent.click(screen.getByRole("button", { name: "조회" }))
    expect(screen.getByText("결과 없음")).toBeInTheDocument()
  })

  it("쪽을 넘기면 다른 행이 보인다", () => {
    renderAt("/dev/s01?case=ready")
    fireEvent.click(screen.getByRole("button", { name: /다음/ }))
    expect(screen.getByText(/전체 116 중 21-40/)).toBeInTheDocument()
  })
})

describe("S01 r3 — 빠른 찾기 · 열 고르기 · 쪽당 행 · 행 높이", () => {
  beforeEach(() => window.localStorage.clear())
  const bodyRows = () => screen.getAllByRole("row").slice(1)

  it("빠른 찾기: 감정번호 · 문서번호 · 사건명으로 좁히고, 0건이면 「조건에 맞는 항목 없음」 + 「조건 지우기」(결과 없음과 다름)", () => {
    renderAt("/dev/s01?case=ready&plus=0")
    fireEvent.change(screen.getByLabelText("검색어"), { target: { value: "강도" } })
    expect(screen.getByText(/전체 \d+ 중 1-/)).toBeInTheDocument()
    expect(screen.queryByText("00001-25-0646")).toBeNull()
    expect(screen.getByText("00001-25-0633")).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText("검색어"), { target: { value: "없는사건명zzz" } })
    expect(screen.getByText("조건에 맞는 항목 없음")).toBeInTheDocument()
    expect(screen.queryByText("결과 없음")).toBeNull()
    fireEvent.click(screen.getAllByRole("button", { name: "조건 지우기" })[1])
    expect(screen.queryByText("조건에 맞는 항목 없음")).toBeNull()
    expect(screen.getByText(/전체 116 중 1-20/)).toBeInTheDocument()
  })

  it("칩: 처리 구분 「대조」 · 사건결과 · 내 담당만이 걸러 낸다", () => {
    renderAt("/dev/s01?case=ready&plus=0&as=analyst")
    const group = (name: string) => screen.getByRole("group", { name })
    fireEvent.click(within(group("처리 구분")).getByRole("button", { name: "대조" }))
    expect(screen.getByText("00001-25-0640")).toBeInTheDocument()
    expect(screen.queryByText("00001-25-0646")).toBeNull()
    fireEvent.click(screen.getAllByRole("button", { name: "조건 지우기" })[0])
    fireEvent.click(within(group("사건결과")).getByRole("button", { name: "결과 전" }))
    expect(screen.getByText("00001-25-0647")).toBeInTheDocument()
    expect(screen.queryByText("00001-25-0646")).toBeNull()
    fireEvent.click(within(group("담당")).getByRole("button", { name: "내 담당만" }))
    expect(screen.getByText(/전체 \d+ 중 1-/)).toBeInTheDocument()
  })

  it("내 담당만: 감정관(박○○)은 77건, 수사관(이○○)은 39건", () => {
    const analyst = renderAt("/dev/s01?case=ready&plus=0&as=analyst")
    fireEvent.click(screen.getByRole("button", { name: "내 담당만" }))
    expect(screen.getByText("77 / 전체 116")).toBeInTheDocument()
    analyst.unmount()
    renderAt("/dev/s01?case=ready&plus=0&as=investigator")
    fireEvent.click(screen.getByRole("button", { name: "내 담당만" }))
    expect(screen.getByText("39 / 전체 116")).toBeInTheDocument()
  })

  it("열 선택: 숨기면 머리가 빠지고 SCAS 순서는 그대로, 감정번호는 고정", () => {
    renderAt("/dev/s01?case=ready&plus=0")
    const heads = () => screen.getAllByRole("columnheader").map((h) => h.textContent)
    fireEvent.click(screen.getByRole("button", { name: /열 선택/ }))
    const locked = screen.getByRole("checkbox", { name: /감정번호/ })
    expect(locked).toBeDisabled()
    expect(locked).toBeChecked()
    fireEvent.click(screen.getByRole("checkbox", { name: "문서번호" }))
    expect(heads()).not.toContain("문서번호")
    expect(heads().indexOf("감정번호")).toBeLessThan(heads().indexOf("사건명"))
    fireEvent.click(screen.getByRole("checkbox", { name: "문서번호" }))
    const h = heads()
    expect(h.indexOf("감정번호")).toBeLessThan(h.indexOf("문서번호"))
    expect(h.indexOf("문서번호")).toBeLessThan(h.indexOf("사건명"))
  })

  it("쪽당 행 10 · 20 · 50: 렌더 행 수가 바뀐다", () => {
    renderAt("/dev/s01?case=ready&plus=0")
    expect(bodyRows()).toHaveLength(20)
    fireEvent.click(screen.getByRole("button", { name: "10개" }))
    expect(bodyRows()).toHaveLength(10)
    expect(screen.getByText(/전체 116 중 1-10/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "50개" }))
    expect(bodyRows()).toHaveLength(50)
  })

  it("행 높이 촘촘: 칸 높이 클래스가 바뀐다(r4 로망 표: 보통 36 · 촘촘 30)", () => {
    const { container } = renderAt("/dev/s01?case=ready&plus=0")
    expect(container.querySelector("tbody td")?.className).toContain("h-[36px]")
    fireEvent.click(screen.getByRole("button", { name: "촘촘" }))
    expect(container.querySelector("tbody td")?.className).toContain("h-[30px]")
  })

  it("열 · 쪽당 행 · 행 높이는 기억되고 다시 열면 그대로", () => {
    const first = renderAt("/dev/s01?case=ready&plus=0")
    fireEvent.click(screen.getByRole("button", { name: "10개" }))
    fireEvent.click(screen.getByRole("button", { name: /열 선택/ }))
    fireEvent.click(screen.getByRole("checkbox", { name: "문서번호" }))
    first.unmount()
    renderAt("/dev/s01?case=ready&plus=0")
    expect(bodyRows()).toHaveLength(10)
    expect(screen.getAllByRole("columnheader").map((h) => h.textContent)).not.toContain("문서번호")
  })

  it("r4 빠른 보기 칩 3개: 건수를 보이고, 누르면 목록이 그 사건만으로 걸러진다(다시 누르면 풀림)", () => {
    renderAt("/dev/s01?case=ready&as=analyst")
    const quick = within(screen.getByRole("group", { name: "빠른 보기" }))
    // 가짜 116건 = 시안 7건 반복: 확인 전 장이 있는 사건 34 · 등록 단계 장이 있는 사건 17 · 교차 검증 단계 17
    const awaiting = quick.getByRole("button", { name: "결과 확인 전 34" })
    expect(quick.getByRole("button", { name: "이미지 미검색 17" })).toBeInTheDocument()
    const cross = quick.getByRole("button", { name: "교차 검증 17" })
    expect(awaiting).toHaveAttribute("aria-pressed", "false")
    fireEvent.click(awaiting)
    expect(awaiting).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByText("34 / 전체 116")).toBeInTheDocument()
    expect(screen.getByText("00001-25-0649")).toBeInTheDocument()
    expect(screen.queryByText("00001-25-0646")).toBeNull()
    // 묶음 안은 「또는」
    fireEvent.click(cross)
    expect(screen.getByText("51 / 전체 116")).toBeInTheDocument()
    fireEvent.click(awaiting)
    fireEvent.click(cross)
    expect(screen.getByText("116 / 전체 116")).toBeInTheDocument()
  })

  it("r4 상세 검색: SCAS 양식은 기본 접힘, 「상세 검색」을 누르면 펼쳐지고 다시 누르면 접힌다", () => {
    const { container } = renderAt("/dev/s01?case=ready&plus=0")
    const toggle = screen.getByRole("button", { name: "상세 검색" })
    expect(toggle).toHaveAttribute("aria-expanded", "false")
    expect(container.querySelector('[data-part="SearchForm"]')).toBeNull()
    expect(screen.queryByRole("button", { name: "조회" })).toBeNull()
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute("aria-expanded", "true")
    expect(container.querySelector('[data-part="SearchForm"]')).not.toBeNull()
    expect(document.getElementById(toggle.getAttribute("aria-controls")!)).not.toBeNull()
    expect(screen.getByRole("button", { name: "조회" })).toBeInTheDocument()
    fireEvent.click(toggle)
    expect(container.querySelector('[data-part="SearchForm"]')).toBeNull()
  })

  it("?plus=0 에서도 빠른 찾기가 보인다(r3 편의는 +α 가 아니다)", () => {
    renderAt("/dev/s01?case=ready&plus=0")
    expect(screen.getByRole("search")).toBeInTheDocument()
  })
})
