import { act, fireEvent, render, screen, within } from "@testing-library/react"
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom"
import { describe, expect, it, vi } from "vitest"

import { S04DevPage } from "./S04DevPage"

function Landing() {
  const { pathname, search } = useLocation()
  return <p data-testid="landing">{`${pathname}${search}`}</p>
}

function renderAt(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/dev/s04" element={<S04DevPage />} />
        <Route path="/dev/:id" element={<Landing />} />
      </Routes>
    </MemoryRouter>,
  )
}

/** jsdom 에는 DataTransfer 가 없어 끌어 놓기 자료 상자를 흉내 낸다 */
function fakeDataTransfer() {
  const store: Record<string, string> = {}
  return {
    dropEffect: "none",
    effectAllowed: "all",
    setData: (k: string, v: string) => {
      store[k] = v
    },
    getData: (k: string) => store[k] ?? "",
  }
}

const KINDS =["무늬", "선", "윤곽", "다각", "삼각", "사각", "원", "항목"]

/** 글자가 여러 요소(<b>상</b> 0.93)로 나뉘어 있어도 한 요소의 전체 글자로 찾는다 */
const fullText = (text: string) => (_: string, el: Element | null) => el?.textContent === text

describe("S04DevPage — 문양 코딩 · 검색 조건", () => {
  it("ready 케이스에 상/중/하/윤곽 4부위를 그린다", () => {
    renderAt("/dev/s04?case=ready")
    const zones = screen.getByRole("group", { name: "현장 이미지 문양" })
    for (const z of ["상", "중", "하", "윤곽"]) {
      expect(within(zones).getByRole("button", { name: new RegExp(`^${z} 부위`) })).toBeInTheDocument()
    }
  })

  it("SCAS 버튼 줄 순서 그대로: 인공지능문양관리 · 검색결과 · 검색 · 다시입력 · 닫기", () => {
    renderAt("/dev/s04?case=ready")
    const bar = screen.getByRole("group", { name: "문양 상세보기 버튼" })
    const names = within(bar)
      .getAllByRole("button")
      .map((b) => b.textContent)
    expect(names.slice(0, 5)).toEqual(["인공지능문양관리", "검색결과", "검색", "다시입력", "닫기"])
  })

  it("팔레트 종류 8개는 순서대로이고 버튼 안에 글자만 있다", () => {
    renderAt("/dev/s04?case=ready")
    const kinds = within(screen.getByRole("group", { name: "문양 종류" })).getAllByRole("button")
    expect(kinds.map((b) => b.textContent)).toEqual(KINDS)
    for (const b of kinds) expect(b.children.length).toBe(0)
  })

  it("팔레트 종류를 바꾸면 그 종류의 문양이 보인다(제어형)", () => {
    renderAt("/dev/s04?case=ready")
    const kinds = screen.getByRole("group", { name: "문양 종류" })
    fireEvent.click(within(kinds).getByRole("button", { name: "항목" }))
    expect(within(kinds).getByRole("button", { name: "항목" })).toHaveAttribute("aria-pressed", "true")
    const palette = screen.getByRole("group", { name: "문양 팔레트" })
    expect(within(palette).getByRole("button", { name: "s81a 넣기" })).toBeInTheDocument()
  })

  it("문양 그림 경로는 /src/assets/Patterns/전체/<이름>.png 그대로 쓴다", () => {
    renderAt("/dev/s04?case=ready")
    const zones = screen.getByRole("group", { name: "현장 이미지 문양" })
    // 신규 켜기면 AI 문양 그림의 대체글이 「n32_04 AI 제안」이라 앞부분으로 찾는다
    const img = within(zones).getAllByRole("img", { name: /^n32_04/ })[0]
    expect(img).toHaveAttribute("src", "/src/assets/Patterns/전체/n32_04.png")
  })

  it("필수 문양에 「필수」가 붙고, 우클릭하면 onToggleEssential로 필수가 바뀐다", () => {
    for (const url of ["/dev/s04?case=ready&plus=0", "/dev/s04?case=ready"]) {
      const { unmount } = renderAt(url)
      const zones = screen.getByRole("group", { name: "현장 이미지 문양" })
      expect(within(zones).getAllByText(/필수/).length).toBeGreaterThan(0)
      fireEvent.contextMenu(within(zones).getByRole("button", { name: "하 n32_04" }))
      expect(within(zones).getByRole("button", { name: "하 n32_04 필수" })).toBeInTheDocument()
      fireEvent.contextMenu(within(zones).getByRole("button", { name: "하 n32_04 필수" }))
      expect(within(zones).getByRole("button", { name: "하 n32_04" })).toBeInTheDocument()
      unmount()
    }
  })

  it("팔레트 문양을 누르면 고른 부위에 들어간다", () => {
    renderAt("/dev/s04?case=ready")
    const zones = screen.getByRole("group", { name: "현장 이미지 문양" })
    fireEvent.click(within(zones).getByRole("button", { name: /^윤곽 부위/ }))
    fireEvent.click(within(screen.getByRole("group", { name: "문양 종류" })).getByRole("button", { name: "윤곽" }))
    fireEvent.click(screen.getByRole("button", { name: "s10a 넣기" }))
    expect(within(zones).getByRole("button", { name: "윤곽 s10a" })).toBeInTheDocument()
  })

  it("팔레트 문양을 끌어 하 부위에 놓으면 하에 들어가고, 「여기에 놓기」가 보인다", () => {
    const { container } = renderAt("/dev/s04?case=ready")
    const zones = screen.getByRole("group", { name: "현장 이미지 문양" })
    const bottom = container.querySelector<HTMLElement>("[data-drop-zone='bottom']")!
    const data = fakeDataTransfer()
    const item = screen.getByRole("button", { name: "n32_02 넣기" })
    expect(item).toHaveAttribute("draggable", "true")
    fireEvent.dragStart(item, { dataTransfer: data })
    fireEvent.dragOver(bottom, { dataTransfer: data })
    expect(within(bottom).getByText("여기에 놓기")).toBeInTheDocument()
    fireEvent.drop(bottom, { dataTransfer: data })
    expect(within(bottom).queryByText("여기에 놓기")).toBeNull()
    expect(within(zones).getByRole("button", { name: "하 n32_02" })).toBeInTheDocument()
    // 고른 부위(상)는 그대로
    expect(within(zones).queryByRole("button", { name: /^상 n32_02/ })).toBeNull()
  })

  it("같은 부위에 이미 있는 문양을 끌어 놓아도 두 번 들어가지 않는다(이름 기준)", () => {
    const { container } = renderAt("/dev/s04?case=ready")
    const zones = screen.getByRole("group", { name: "현장 이미지 문양" })
    const bottom = container.querySelector<HTMLElement>("[data-drop-zone='bottom']")!
    const data = fakeDataTransfer()
    data.setData("text/plain", "/src/assets/Patterns/전체/n32_04.png")
    fireEvent.dragOver(bottom, { dataTransfer: data })
    fireEvent.drop(bottom, { dataTransfer: data })
    expect(within(zones).getAllByRole("button", { name: /^하 n32_04/ })).toHaveLength(1)

    const item = screen.getByRole("button", { name: "n32_02 넣기" })
    for (let i = 0; i < 2; i++) {
      const d = fakeDataTransfer()
      fireEvent.dragStart(item, { dataTransfer: d })
      fireEvent.drop(bottom, { dataTransfer: d })
    }
    expect(within(zones).getAllByRole("button", { name: /^하 n32_02/ })).toHaveLength(1)
  })

  it("AI 추출 결과도 끌어서 부위에 놓을 수 있다", () => {
    const { container } = renderAt("/dev/s04?case=ready")
    const zones = screen.getByRole("group", { name: "현장 이미지 문양" })
    const outline = container.querySelector<HTMLElement>("[data-drop-zone='outline']")!
    const data = fakeDataTransfer()
    const item = within(screen.getByRole("region", { name: "AI 추출 결과" })).getByRole("button", { name: /^n51_03 넣기/ })
    fireEvent.dragStart(item, { dataTransfer: data })
    fireEvent.drop(outline, { dataTransfer: data })
    expect(within(zones).getByRole("button", { name: "윤곽 n51_03" })).toBeInTheDocument()
  })

  it("빈 부위에는 「여기로 드래그」 자리가 있다", () => {
    renderAt("/dev/s04?case=empty")
    expect(screen.getAllByText("여기로 드래그")).toHaveLength(4)
  })

  it("필수를 바꾸면 검색 결과 갱신이 돌고, 잠시 뒤 갱신했다고 보인다", () => {
    vi.useFakeTimers()
    try {
      renderAt("/dev/s04?case=ready")
      expect(screen.getByText(/필수 문양\(2개\)만 검색에 쓰입니다/)).toBeInTheDocument()
      fireEvent.contextMenu(screen.getByRole("button", { name: "하 n32_04" }))
      expect(screen.getByRole("progressbar", { name: "검색 결과 갱신" })).toBeInTheDocument()
      act(() => {
        vi.advanceTimersByTime(300)
      })
      expect(screen.queryByRole("progressbar", { name: "검색 결과 갱신" })).toBeNull()
      expect(screen.getByText("필수 문양 3개로 검색 결과를 갱신했습니다.")).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  it("매칭 조건은 진열 페이지가 준 값을 보이고 비활성이다", () => {
    renderAt("/dev/s04?case=ready")
    const cond = screen.getByRole("region", { name: "매칭 조건" })
    expect(within(cond).getByLabelText("등록기간 시작")).toHaveValue("2000-01-01")
    expect(within(cond).getByLabelText("등록기간 끝")).toHaveValue("2025-07-24")
    expect(within(cond).getByRole("radio", { name: /현장문양/ })).toHaveAttribute("aria-checked", "true")
    expect(within(cond).getByRole("radio", { name: /현장문양/ })).toBeDisabled()
  })

  it("추출 결과마다 ConfidenceBar로 점수를 보인다", () => {
    renderAt("/dev/s04?case=ready")
    const result = screen.getByRole("region", { name: "AI 추출 결과" })
    const meters = within(result).getAllByRole("meter", { name: "AI 확신도" })
    expect(meters.length).toBeGreaterThan(0)
    expect(meters[0].closest("[data-part='ConfidenceBar']")).not.toBeNull()
  })

  it("검색 이력 표 열은 시안 SCAS 열(검색번호 · 결과건수 · 검색방법 · 검색결과 · 검색일) 뒤에 지금 기능 순위 · 매칭 신발을 덧붙이고, 신발 ID 앞자리 0을 지킨다", () => {
    for (const url of ["/dev/s04?case=ready", "/dev/s04?case=ready&plus=0"]) {
      const { unmount } = renderAt(url)
      const table = within(screen.getByRole("region", { name: "검색이력" })).getByRole("table")
      expect(within(table).getAllByRole("columnheader").map((h) => h.textContent)).toEqual([
        "검색번호",
        "결과건수",
        "검색방법",
        "검색결과",
        "검색일",
        "순위",
        "매칭된 신발 정보",
      ])
      const first = within(table).getAllByRole("row")[1]
      expect(within(first).getAllByRole("cell").map((c) => c.textContent)).toEqual([
        "572433",
        "312",
        "이미지검색",
        "보기",
        "07-24",
        "3",
        "00758",
      ])
      // 시안: 첫 줄이 고른 줄
      expect(first).toHaveAttribute("aria-selected", "true")
      unmount()
    }
  })

  it("검색 이력 「보기」를 누르면 그 줄을 연다", () => {
    renderAt("/dev/s04?case=ready")
    const table = within(screen.getByRole("region", { name: "검색이력" })).getByRole("table")
    const second = within(table).getAllByRole("row")[2]
    fireEvent.click(within(second).getByRole("button", { name: "보기" }))
    expect(second).toHaveAttribute("aria-selected", "true")
  })

  it("running 케이스는 문양 추출 AiProgress가 돌고 움직임은 motion-safe: 로만 걸린다", () => {
    const { container } = renderAt("/dev/s04?case=running")
    const bar = screen.getByRole("progressbar", { name: "문양 추출" })
    expect(bar.closest("[data-part='AiProgress']")).toHaveAttribute("data-part-variant", "running")
    const animated = Array.from(container.querySelectorAll("[class*='animate-']"))
    expect(animated.length).toBeGreaterThan(0)
    for (const el of animated) {
      expect(
        el
          .getAttribute("class")!
          .split(/\s+/)
          .filter((c) => c.startsWith("animate-")),
      ).toEqual([])
    }
  })

  it("loading 케이스는 aria-busy=\"true\"", () => {
    const { container } = renderAt("/dev/s04?case=loading")
    expect(container.querySelector("[aria-busy='true']")).not.toBeNull()
  })

  it("error 케이스는 「다시」 버튼이 있고 「결과 없음」이 없다", () => {
    renderAt("/dev/s04?case=error")
    expect(screen.getByRole("button", { name: "다시" })).toBeInTheDocument()
    expect(screen.queryByText(/결과 없음/)).toBeNull()
  })

  it("empty 케이스는 「결과 없음」을 보인다", () => {
    renderAt("/dev/s04?case=empty")
    expect(screen.getByText("결과 없음")).toBeInTheDocument()
  })

  it("readonly 보기에서 「검색」 · 「다시입력」 · 추출 · 문양 넣기가 disabled", () => {
    renderAt("/dev/s04?case=ready&as=readonly")
    expect(screen.getByRole("button", { name: "검색" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "다시입력" })).toBeDisabled()
    expect(screen.getByRole("button", { name: /추출$/ })).toBeDisabled()
    expect(screen.getByRole("button", { name: "n32_02 넣기" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "n32_02 넣기" })).toHaveAttribute("draggable", "false")
    expect(screen.getByRole("button", { name: "하 n32_04" })).toBeDisabled()
  })

  it("「검색」을 누르면 보는 사람을 유지한 채 S05로 간다", () => {
    renderAt("/dev/s04?case=ready&as=analyst")
    fireEvent.click(screen.getByRole("button", { name: "검색" }))
    expect(screen.getByTestId("landing")).toHaveTextContent("/dev/s05?as=analyst")
  })

  it("검색 이미지(원본 · 편집본)는 시안처럼 왼쪽 「현장 이미지」 띠에서 고른다", () => {
    renderAt("/dev/s04?case=ready")
    const seg = screen.getByRole("group", { name: "검색 이미지" })
    expect(within(seg).getByRole("button", { name: "편집본" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByRole("button", { name: "✦ 편집한 이미지로 다시 추출" })).toBeInTheDocument()
    fireEvent.click(within(seg).getByRole("button", { name: "원본" }))
    expect(screen.getByRole("button", { name: "✦ 원본 이미지로 추출" })).toBeInTheDocument()
  })
})

describe("S04DevPage — 시안 r2 신규 기능 · 연출", () => {
  it("?plus=0 이면 [data-plus] 가 하나도 없고 1차 내용은 그대로 있다", () => {
    const { container } = renderAt("/dev/s04?case=ready&plus=0")
    expect(container.querySelectorAll("[data-plus]")).toHaveLength(0)
    expect(screen.getByRole("group", { name: "현장 이미지 문양" })).toBeInTheDocument()
    expect(screen.getByRole("group", { name: "문양 팔레트" })).toBeInTheDocument()
    expect(screen.getByRole("region", { name: "AI 추출 결과" })).toBeInTheDocument()
    expect(screen.getByRole("region", { name: "매칭 조건" })).toBeInTheDocument()
    expect(screen.getByRole("region", { name: "검색이력" })).toBeInTheDocument()
    expect(screen.getByText(/필수 문양\(2개\)만 검색에 쓰입니다/)).toBeInTheDocument()
    expect(screen.queryByRole("region", { name: "검색 전 미리보기" })).toBeNull()
    expect(screen.queryByText(fullText("상 0.93"))).toBeNull()
    expect(screen.queryByText("AI 제안 3 · 확인 2")).toBeNull()
  })

  it("신규 켜기(기본)면 [data-plus] 가 있다", () => {
    const { container } = renderAt("/dev/s04?case=ready")
    expect(container.querySelectorAll("[data-plus]").length).toBeGreaterThan(0)
  })

  it("현장 이미지에 영역별 AI 확신도 띠(상 0.93 · 중 0.88 · 하 0.71)와 가격표 경고가 있다", () => {
    renderAt("/dev/s04?case=ready")
    for (const t of ["상 0.93", "중 0.88", "하 0.71"]) expect(screen.getByText(fullText(t))).toBeInTheDocument()
    expect(screen.getByText("편집본 · 이진화")).toBeInTheDocument()
    expect(screen.getByText(/가격표로 보이는 부분 — 이 자리는 AI가 문양을 못 잡을 수 있습니다/)).toBeInTheDocument()
  })

  it("문양 카드: AI 제안 · AI · 확인 · 수동 표시와 AI 확신도 막대(0.42 낮음)가 있다", () => {
    renderAt("/dev/s04?case=ready")
    const zones = screen.getByRole("group", { name: "현장 이미지 문양" })
    expect(within(zones).getAllByText("AI 제안")).toHaveLength(2)
    expect(within(zones).getByText("AI 제안?")).toBeInTheDocument()
    expect(within(zones).getAllByText("AI · 확인")).toHaveLength(2)
    expect(within(zones).getByText("수동")).toBeInTheDocument()
    expect(within(zones).getAllByText("● 필수")).toHaveLength(2)
    const meters = within(zones).getAllByRole("meter", { name: "AI 확신도" })
    expect(meters).toHaveLength(5)
    const low = meters.map((m) => m.closest("[data-part='ConfidenceBar']")!).find((b) => b.getAttribute("data-part-state") === "low")
    expect(low).toHaveAttribute("data-part-id", "S04-34")
    expect(within(low as HTMLElement).getByText("0.42")).toBeInTheDocument()
    expect(within(zones).getByText("AI 미지원")).toBeInTheDocument()
    expect(within(zones).getAllByText(/끌어 놓기/).length).toBeGreaterThan(0)
  })

  it("AI 제안 「✓ 확인」을 누르면 확인으로 바뀌고 띠의 개수가 바뀐다 · 「제안 모두 확인」은 남은 제안을 모두 확인", () => {
    renderAt("/dev/s04?case=ready")
    expect(screen.getByText("AI 제안 3 · 확인 2")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "제안 확인 · 상 n21_05" }))
    expect(screen.getByText("AI 제안 2 · 확인 3")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "제안 모두 확인" }))
    expect(screen.getByText("AI 제안 0 · 확인 5")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /^제안 확인 · / })).toBeNull()
  })

  it("AI 제안 「✕」를 누르면 그 문양을 뺀다", () => {
    renderAt("/dev/s04?case=ready")
    const zones = screen.getByRole("group", { name: "현장 이미지 문양" })
    fireEvent.click(within(zones).getByRole("button", { name: "제안 빼기 · 중 s81b" }))
    expect(within(zones).queryByRole("button", { name: /^중 s81b/ })).toBeNull()
  })

  it("문양 개수(0–9 · 10이상)를 고를 수 있다(제어형)", () => {
    renderAt("/dev/s04?case=ready")
    const count = screen.getByRole("combobox", { name: "상 n32_04 개수" })
    expect(count).toHaveValue("9")
    expect(within(count).getAllByRole("option").map((o) => o.textContent)).toEqual([
      "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10이상",
    ])
    fireEvent.change(count, { target: { value: "10이상" } })
    expect(screen.getByRole("combobox", { name: "상 n32_04 개수" })).toHaveValue("10이상")
  })

  it("문자열 행 · 팔레트 찾기 · 최근 사용 · 하위 탭이 있다", () => {
    renderAt("/dev/s04?case=ready")
    const text = screen.getByRole("textbox", { name: "문자열" })
    expect(text).toHaveAttribute("placeholder", "밑창에 글자가 보이면 입력")
    fireEvent.change(text, { target: { value: "NIKE" } })
    expect(screen.getByRole("textbox", { name: "문자열" })).toHaveValue("NIKE")

    fireEvent.change(screen.getByRole("textbox", { name: "문양 찾기" }), { target: { value: "n32_0" } })
    const palette = screen.getByRole("group", { name: "문양 팔레트" })
    expect(within(palette).getAllByRole("button").every((b) => b.getAttribute("aria-label")!.startsWith("n32_0"))).toBe(true)

    const recent = screen.getByRole("group", { name: "최근 사용" })
    expect(within(recent).getAllByRole("button")).toHaveLength(5)
    expect(within(screen.getByRole("group", { name: "하위 탭" })).getAllByRole("button").map((b) => b.textContent)).toEqual([
      "단선",
      "다선1",
      "다선2",
    ])
  })

  it("검색 방식(덧붙임): 이미지 검색이 추천 · 기본이고 하이브리드로 바꿀 수 있다", () => {
    renderAt("/dev/s04?case=ready")
    const group = screen.getByRole("radiogroup", { name: "검색 방식" })
    expect(within(group).getByRole("radio", { name: /이미지 검색/ })).toHaveAttribute("aria-checked", "true")
    expect(within(group).getByText("추천")).toBeInTheDocument()
    fireEvent.click(within(group).getByRole("radio", { name: /하이브리드/ }))
    expect(within(group).getByRole("radio", { name: /하이브리드/ })).toHaveAttribute("aria-checked", "true")
    expect(within(group).getByRole("radio", { name: /이미지 검색/ })).toHaveAttribute("aria-checked", "false")
  })

  it("검색 전 미리보기 깔때기(시안 숫자 그대로)", () => {
    renderAt("/dev/s04?case=ready")
    const funnel = screen.getByRole("region", { name: "검색 전 미리보기" })
    for (const t of ["신발 DB", "128,406", "매칭 조건 통과", "121,930", "필수 문양 상·중 헤링본", "857", "먼저 볼 후보(AI 순위)", "Top 10"]) {
      expect(within(funnel).getByText(t)).toBeInTheDocument()
    }
    expect(within(funnel).getByText("문양 바꾸면 바로 다시 셈")).toBeInTheDocument()
    expect(within(funnel).getByText(/필수를 하나 더 걸면 857 → 312건/)).toBeInTheDocument()
  })

  it("이미지 목록에 상태 열 · 「12장 중 1장 완료」 · 「다음 이미지 _3 →」가 있고 누르면 _3 으로 넘어간다", () => {
    renderAt("/dev/s04?case=ready")
    expect(screen.getByText("12장 중 1장 완료")).toBeInTheDocument()
    for (const s of ["확인완료", "검색 중", "삭제(중복)"]) expect(screen.getByText(s)).toBeInTheDocument()
    expect(screen.getAllByText("미코딩")).toHaveLength(3)
    const rowOf = (no: string) => screen.getAllByText(no).map((e) => e.closest("tr")).find(Boolean)
    expect(rowOf("00001-25-0649_2")).toHaveAttribute("aria-selected", "true")
    fireEvent.click(screen.getByRole("button", { name: "다음 이미지 _3 →" }))
    expect(rowOf("00001-25-0649_3")).toHaveAttribute("aria-selected", "true")
    expect(rowOf("00001-25-0649_2")).not.toHaveAttribute("aria-selected")
  })

  it("보는 사람: 기술책임자는 「기술책임자 · 보기만」이 보이고 검색 · 다시 추출 · 제안 모두 확인이 잠긴다", () => {
    renderAt("/dev/s04?case=ready&as=verifier")
    expect(screen.getByText("기술책임자 · 보기만")).toBeInTheDocument()
    expect(screen.queryByText("수사관 · 볼 수 없음")).toBeNull()
    expect(screen.getByRole("button", { name: "검색" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "✦ 편집한 이미지로 다시 추출" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "제안 모두 확인" })).toBeDisabled()
  })

  it("보는 사람: 수사관은 「수사관 · 볼 수 없음」, 감정관은 칩 없이 모두 누를 수 있다", () => {
    const { unmount } = renderAt("/dev/s04?case=ready&as=investigator")
    expect(screen.getByText("수사관 · 볼 수 없음")).toBeInTheDocument()
    expect(screen.queryByText("기술책임자 · 보기만")).toBeNull()
    expect(screen.getByRole("button", { name: "검색" })).toBeDisabled()
    unmount()
    renderAt("/dev/s04?case=ready&as=analyst")
    expect(screen.queryByText("수사관 · 볼 수 없음")).toBeNull()
    expect(screen.queryByText("기술책임자 · 보기만")).toBeNull()
    expect(screen.getByRole("button", { name: "검색" })).toBeEnabled()
    expect(screen.getByRole("button", { name: "제안 모두 확인" })).toBeEnabled()
  })

  it("신규 끄기면 실증 역할 잠금을 걸지 않는다(기술책임자도 1차처럼 사건 조회 권한으로 검색)", () => {
    renderAt("/dev/s04?case=ready&as=verifier&plus=0")
    expect(screen.getByRole("button", { name: "검색" })).toBeEnabled()
  })

  it("움직임 줄이기: ready 의 훑기 선 · 실시간 점 · 막대 채움은 motion-safe: 로만 걸린다", () => {
    const { container } = renderAt("/dev/s04?case=ready")
    expect(container.querySelector("[data-part='ScanOverlay']")).not.toBeNull()
    const animated = Array.from(container.querySelectorAll("[class*='animate-']"))
    expect(animated.length).toBeGreaterThanOrEqual(3)
    for (const el of animated) {
      expect(
        el
          .getAttribute("class")!
          .split(/\s+/)
          .filter((c) => c.startsWith("animate-")),
      ).toEqual([])
    }
  })

  describe("r3 검색 이력 검색 · 열 고르기", () => {
    const region = () => screen.getByRole("region", { name: "검색이력" })

    it("검색으로 걸러지고 0건이면 「조건에 맞는 항목 없음」+「조건 지우기」, ?plus=0 에서도 보인다", () => {
      renderAt("/dev/s04?case=ready&plus=0")
      fireEvent.change(within(region()).getByLabelText("검색어"), { target: { value: "현장문양" } })
      expect(within(region()).getByText("572420")).toBeInTheDocument()
      expect(within(region()).queryByText("572433")).toBeNull()
      fireEvent.change(within(region()).getByLabelText("검색어"), { target: { value: "없는것" } })
      expect(within(region()).getByText("조건에 맞는 항목 없음")).toBeInTheDocument()
      expect(within(region()).queryByText("결과 없음")).toBeNull()
      fireEvent.click(within(region()).getAllByRole("button", { name: "조건 지우기" }).at(-1)!)
      expect(within(region()).getByText("572433")).toBeInTheDocument()
    })

    it("열 선택: 검색번호는 고정, 끄면 열이 빠지고 순서는 그대로", () => {
      renderAt("/dev/s04?case=ready")
      fireEvent.click(within(region()).getByRole("button", { name: /열 선택/ }))
      expect(within(region()).getByRole("checkbox", { name: /검색번호/ })).toBeDisabled()
      fireEvent.click(within(region()).getByRole("checkbox", { name: /^순위/ }))
      expect(within(region()).getAllByRole("columnheader").map((h) => h.textContent)).toEqual([
        "검색번호",
        "결과건수",
        "검색방법",
        "검색결과",
        "검색일",
        "매칭된 신발 정보",
      ])
    })
  })
})
