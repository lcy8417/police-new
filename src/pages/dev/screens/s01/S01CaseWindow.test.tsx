import { fireEvent, render, screen, within } from "@testing-library/react"
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { rankOfRun, S04_KINDS, S04_RUNS } from "../s04/mock-cases"
import { S05_WINDOW_FIRST } from "../s05/mock-cases"
import { OPEN_CASES_FULL } from "./case-window-query"
import { S01DevPage } from "./S01DevPage"

// r4 사건 창(2026-11-16 사용자 결정): 사건관리 목록 행을 누르면 목록 위 오른쪽에 큰 사건 창. 상태는 주소(query).

const toastMock = vi.hoisted(() => Object.assign(vi.fn(), { success: vi.fn() }))
vi.mock("sonner", () => ({ toast: toastMock }))

function Where() {
  const { search } = useLocation()
  return <p data-testid="search">{search}</p>
}

function renderAt(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route
          path="/dev/s01"
          element={
            <>
              <S01DevPage />
              <Where />
            </>
          }
        />
      </Routes>
    </MemoryRouter>
  )
}

const query = () => new URLSearchParams(screen.getByTestId("search").textContent ?? "")
const dialog = () => screen.getByRole("dialog")
const rowOf = (no: string) => screen.getByText(no).closest('[role="row"]') as HTMLElement
const workTab = (name: string | RegExp) => within(dialog().closest('[data-slot="case-window-tabbed"]') as HTMLElement).getByRole("tab", { name })

beforeEach(() => {
  toastMock.mockClear()
  localStorage.clear()
})

describe("S01 사건 창", () => {
  it("행을 누르면 「00001-25-0649 주거침입」 창 — 왼쪽 목록 줄 수 = 장수(12), 주소에 open · img · tab · tabs(as 유지)", () => {
    renderAt("/dev/s01?case=ready&as=analyst")
    fireEvent.click(screen.getByText("00001-25-0649"))
    expect(screen.getByRole("dialog", { name: "00001-25-0649 주거침입 사건 창" })).toBeInTheDocument()
    const rail = screen.getByRole("navigation", { name: "00001-25-0649 현장 이미지" })
    const rows = [...rail.querySelectorAll('[data-slot="window-rail-item"]')]
    expect(rows).toHaveLength(12)
    // 장별 상태는 목록 숫자와 같다: 발견 1 · 검색됨 2 · 등록 9 (기본 접힘이라 줄 이름 「_n · 상태」로 센다)
    const names = rows.map((r) => r.getAttribute("aria-label") ?? "")
    expect(names.filter((n) => n.endsWith("· 등록"))).toHaveLength(9)
    expect(names.filter((n) => n.endsWith("· 검색됨"))).toHaveLength(2)
    expect(rows[0]).toHaveAttribute("aria-current", "true")
    const q = query()
    expect([q.get("open"), q.get("img"), q.get("tab"), q.get("tabs"), q.get("as"), q.get("case")]).toEqual([
      "00001-25-0649",
      "1",
      "info",
      "00001-25-0649",
      "analyst",
      "ready",
    ])
    // 본문 = S02 사건 정보 위젯(창 모드 — 사건정보 폼은 그대로)
    expect(within(dialog()).getByLabelText("사건등록번호")).toHaveValue("00001-25-0649")
  })

  describe("머리 흐름 한 줄 · 탭 표시 · 숨김(11/16 사용자 「할 일은 없애고 … 플로우가 이렇다 이정도만. 결재는 없어」)", () => {
    it("0633(4장 · 다 끝남): 머리 흐름 5칸(결재 없음) 모두 ✓, 할 일 상자 · 단계 띠 없음, 머리 꼬리표엔 단계 글자 없음", () => {
      const { container } = renderAt("/dev/s01?case=ready&open=00001-25-0633&img=1&tab=info")
      const steps = within(screen.getByRole("list", { name: "사건 진행 흐름" })).getAllByRole("listitem")
      expect(steps.map((s) => s.textContent?.replace(/^›/, ""))).toEqual(["✓접수", "✓1차 작업", "✓검색·판정", "✓교차 검증", "✓감정서"])
      expect(container.querySelector('[data-slot="window-head"]')?.textContent).not.toMatch(/결재/)
      expect(screen.queryByRole("list", { name: "이 단계 할 일" })).toBeNull()
      expect(screen.queryByRole("group", { name: "사건 진행 단계" })).toBeNull()
      const tags = [...container.querySelectorAll('[data-slot="window-head-tag"]')].map((t) => t.textContent)
      expect(tags).toEqual(["서울청", "2025-07-21 등록", "4장"])
      // 4장 사건 — 왼쪽 목록 4줄, 본문에 _5 이상 번호가 없고, 다 끝난 사건이라 「올리는 중」도 없다
      expect(screen.getByRole("navigation", { name: /현장 이미지/ }).querySelectorAll('[data-slot="window-rail-item"]')).toHaveLength(4)
      // (펼쳐서 맨 아래 칸까지 본다)
      fireEvent.click(screen.getByRole("button", { name: "이미지 목록 펼치기" }))
      expect(within(screen.getByRole("navigation", { name: /현장 이미지/ })).queryByText(/업로드 중/)).toBeNull()
      expect(container.querySelector('[data-slot="case-window-panel"]')?.textContent).not.toMatch(/_(?:[5-9]|1\d)\b/)
    })

    it("0649(1차 작업 중): 흐름 지금 칸 = 1차 작업(aria-current), 누르는 단추가 아니다", () => {
      renderAt("/dev/s01?case=ready&open=00001-25-0649&img=1&tab=info")
      const steps = within(screen.getByRole("list", { name: "사건 진행 흐름" })).getAllByRole("listitem")
      expect(steps.filter((s) => s.getAttribute("aria-current") === "step").map((s) => s.textContent)).toEqual(["›21차 작업"])
      expect(within(steps[1]).queryByRole("button")).toBeNull()
    })

    it("탭 표시: 0649 사건 정보 = 노란 빈 칸 1, _5 를 고르면 이미지 편집 !", () => {
      const { container } = renderAt("/dev/s01?case=ready&open=00001-25-0649&img=5&tab=info")
      expect(container.querySelector('[data-mark="blanks"]')).toHaveTextContent("1")
      expect(within(screen.getByRole("tab", { name: /이미지 편집/ })).getByLabelText("확인할 문제")).toBeInTheDocument()
    })

    it("창 안 S02 에는 머리 줄(사건복사 · 검색 →) · 이미지 목록 · AI 1차 작업 점검 · 접수 경로 줄이 없고, ⋯ 메뉴에 사건복사 · 수정", () => {
      renderAt("/dev/s01?case=ready&as=analyst&open=00001-25-0649&img=2&tab=info")
      const d = dialog()
      expect(within(d).queryByLabelText("사건 상세 도구")).toBeNull()
      expect(within(d).queryByRole("button", { name: "사건복사" })).toBeNull()
      expect(within(d).queryByRole("button", { name: /검색 \(문양 상세보기\)/ })).toBeNull()
      expect(within(d).queryByText("이미지 목록")).toBeNull()
      expect(within(d).queryByText("AI 1차 작업 점검")).toBeNull()
      expect(within(d).queryByText(/배당 절차/)).toBeNull()
      // 사진 추가 · 끌어 놓기는 왼쪽 목록 맨 아래 — 기본 접힘이면 「+」, 누르면 펼쳐져 사진 추가 칸이 보인다
      fireEvent.click(within(screen.getByRole("navigation", { name: /현장 이미지/ })).getByRole("button", { name: "사진 추가 — 목록 펼치기" }))
      expect(within(screen.getByRole("navigation", { name: /현장 이미지/ })).getByRole("button", { name: "+ 사진 추가" })).toBeInTheDocument()
      fireEvent.keyDown(within(d).getByRole("button", { name: "이 창 메뉴" }), { key: "Enter" })
      expect(screen.getAllByRole("menuitem").map((m) => m.textContent)).toEqual(["사건복사", "수정"])
    })

    it("사건 정보 탭: 왼쪽 족윤적 이미지 | 오른쪽 「사건정보 · 현장 이미지 정보」 탭(한 번에 한 표), 여러 장 적용 범위 · 채취법 AI 제안은 창에 없음(2회차 검수)", () => {
      renderAt("/dev/s01?case=ready&as=analyst&open=00001-25-0649&img=2&tab=info")
      const d = dialog()
      expect(within(d).getByRole("region", { name: "족윤적 이미지" })).toBeInTheDocument()
      const tabs = within(within(d).getByRole("tablist", { name: "정보" })).getAllByRole("tab")
      expect(tabs.map((t) => t.textContent)).toEqual(["사건정보", "현장 이미지 정보 _2"])
      expect(tabs[0]).toHaveAttribute("aria-selected", "true")
      expect(within(d).getByLabelText("사건등록번호")).toBeInTheDocument()
      expect(within(d).queryByLabelText("채취 장소")).toBeNull()
      expect(within(d).queryByRole("group", { name: "적용 범위" })).toBeNull()
      fireEvent.click(tabs[1])
      expect(within(d).queryByLabelText("사건등록번호")).toBeNull()
      expect(within(d).getByLabelText("채취 장소")).toBeInTheDocument()
      // 여러 장을 고르는 표가 없으니 「선택한 이미지 모두 적용」도 없다 · 창의 AI 는 문양 추출만(채취법 AI 제안 없음)
      expect(within(d).queryByRole("group", { name: "적용 범위" })).toBeNull()
      expect(within(d).queryByRole("button", { name: "적용" })).toBeNull()
      expect(within(d).getByRole("button", { name: "수정" })).toBeInTheDocument()
      // 저장 줄은 두 탭 공통 바닥
      expect(within(d).getByRole("button", { name: "저장" })).toBeInTheDocument()
    })

    it("이미지 편집 탭: 1차 편집만(2차 이미지 뷰어 · 시나리오 줄 · 제목 줄 ✕ · 「1차 작업」 꼬리표 없음), 취소 · 확인 · 저장은 어두운 작업판 안, 오른쪽은 편집 이력만(AI 제안 없음)", () => {
      renderAt("/dev/s01?case=ready&as=analyst&open=00001-25-0649&img=1&tab=edit")
      const d = dialog()
      const cutting = within(d).getByRole("region", { name: "이미지 커팅" })
      expect(within(d).queryByRole("region", { name: "이미지 뷰어" })).toBeNull()
      expect(within(d).queryByText(/A · 1차 작업/)).toBeNull()
      expect(within(d).queryByText(/B · 2차 작업/)).toBeNull()
      expect(within(d).queryByRole("button", { name: "이미지 커팅 닫기" })).toBeNull()
      expect(within(d).queryByText("1차 작업", { selector: "[data-part=Chip]" })).toBeNull()
      // 머리 줄 = 제목만, 마무리 단추 셋은 작업판(data-theme=dark) 안 「편집 마무리」 묶음
      const head = cutting.querySelector('[data-slot="panel-pane-head"]') as HTMLElement
      expect(within(head).getByRole("heading", { name: "이미지 커팅" })).toBeInTheDocument()
      expect(within(head).queryByRole("button", { name: "저장" })).toBeNull()
      const bench = cutting.querySelector('[data-slot="image-edit-workbench"]') as HTMLElement
      expect(bench).toHaveAttribute("data-theme", "dark")
      expect(within(within(bench).getByRole("group", { name: "편집 마무리" })).getAllByRole("button").map((b) => b.textContent)).toEqual(["취소", "확인", "저장"])
      // 도구는 아이콘 타일(이름 = 원래 이름), SCAS 아래 버튼 줄은 그대로
      expect(within(within(cutting).getByRole("group", { name: "도구" })).getByRole("button", { name: "이진화" })).toBeInTheDocument()
      expect(within(cutting).getByRole("group", { name: "SCAS 아래 버튼 줄" })).toBeInTheDocument()
      // 오른쪽 칸: 편집 이력만 — 받은 원본 + 3단계, AI 제안 없음
      expect(within(d).queryByRole("region", { name: "AI 제안" })).toBeNull()
      expect(within(d).queryByRole("tablist", { name: "편집 보조" })).toBeNull()
      const history = () => within(d).getByRole("region", { name: "편집 이력" })
      expect(within(history()).getAllByRole("listitem")).toHaveLength(4)
      // 줄을 누르면 작업대에 그 단계 미리보기 → 「여기까지 되돌리기」면 그 뒤 단계가 빠진다
      fireEvent.click(within(history()).getByRole("button", { name: "1단계 좌로 4° 회전 미리보기" }))
      const preview = within(d).getByRole("region", { name: "편집 이력 미리보기" })
      expect(preview).toHaveTextContent("미리보기 · 1단계 좌로 4° 회전")
      fireEvent.click(within(preview).getByRole("button", { name: "여기까지 되돌리기" }))
      expect(within(d).queryByRole("region", { name: "편집 이력 미리보기" })).toBeNull()
      expect(within(history()).getAllByRole("listitem")).toHaveLength(2)
      // 되돌리기(한 단계)는 이력 머리
      fireEvent.click(within(history()).getByRole("button", { name: "되돌리기" }))
      expect(within(history()).getAllByRole("listitem")).toHaveLength(1)
    })

    describe("문양 코드 탭(11/17 「먹색 · AI 조건은 빼 · 확대경 · 더블 클릭 · 이력 · 가중치 · 전체 문양 리스트」)", () => {
      const open = () => {
        renderAt("/dev/s01?case=ready&as=analyst&open=00001-25-0649&img=1&tab=pattern")
        return screen.getByRole("dialog", { name: /사건 창$/ })
      }
      const side = (d: HTMLElement) => within(d).getByRole("tablist", { name: "문양 · 검색" })

      it("제목 줄 · 닫기 · 이미지 목록 표 없음, 어두운 작업판(현장 이미지 | 4부위) + 오른쪽 밝은 칸 + 바닥 단추 줄(검색만 채움)", () => {
        const d = open()
        expect(within(d).queryByText("문양 상세보기")).toBeNull()
        expect(within(d).queryByRole("button", { name: /^닫기$/ })).toBeNull()
        expect(within(d).queryByRole("columnheader", { name: "이미지 번호" })).toBeNull()
        for (const name of ["현장 이미지", "현장 이미지 문양", "문양 · 검색"]) expect(within(d).getByRole("region", { name })).toBeInTheDocument()
        // 작업판만 어두운 팔레트(data-theme="dark") — 현장 이미지 · 4부위는 그 안, 오른쪽 칸은 밖(밝은 바탕)
        const bench = d.querySelector('[data-slot="pattern-workbench"]') as HTMLElement
        expect(bench).toHaveAttribute("data-theme", "dark")
        expect(bench).toContainElement(within(d).getByRole("region", { name: "현장 이미지" }))
        expect(bench).toContainElement(within(d).getByRole("region", { name: "현장 이미지 문양" }))
        expect(bench).not.toContainElement(within(d).getByRole("region", { name: "문양 · 검색" }))
        expect(within(within(d).getByRole("region", { name: "현장 이미지" })).getByRole("heading", { name: "현장 이미지" })).toBeInTheDocument()
        expect(within(d).getByRole("group", { name: "검색 이미지" })).toBeInTheDocument()
        // 바닥 단추: 작업판 단추(WorkbenchButton) — 검색만 primary
        expect(within(d).getByRole("button", { name: "검색" })).toHaveAttribute("data-part-variant", "primary")
        expect(within(d).getByRole("button", { name: "검색결과" })).toHaveAttribute("data-part-variant", "soft")
        expect(within(d).getByRole("button", { name: "다시입력" })).toHaveAttribute("data-part-variant", "ghost")
        // 진행 · 다음 이미지 = 바깥 이미지 목록 그대로(0649: _1 발견 · _2 · _3 검색됨 → 다음 미코딩 _4, 12장 중 1장 완료)
        expect(within(d).getByRole("button", { name: /다음 이미지 _4/ })).toHaveAttribute("data-part", "WorkbenchButton")
        expect(within(d).getByText("12장 중 1장 완료")).toBeInTheDocument()
      })

      it("AI 조건은 뺀다 — 검색 방식 · 깔때기 · 인공지능문양관리 없음, AI 동작은 「다시 추출」 하나", () => {
        const d = open()
        expect(within(d).queryByRole("button", { name: "인공지능문양관리" })).toBeNull()
        fireEvent.click(within(side(d)).getByRole("tab", { name: "검색 조건" }))
        expect(within(d).getByRole("region", { name: "매칭 조건" })).toBeInTheDocument()
        expect(within(d).queryByRole("radiogroup", { name: "검색 방식" })).toBeNull()
        expect(within(d).queryByText(/이미지 검색 추천|하이브리드/)).toBeNull()
        expect(within(d).queryByText("신발 DB")).toBeNull()
        expect(within(d).getByRole("button", { name: "편집한 이미지로 다시 추출" })).toBeEnabled()
      })

      it("4부위 = 상 · 중 · 하 · 윤곽, 카드마다 필수 · 가중치 · 개수(SCAS 0–9 · 10이상) · 빼기", () => {
        const d = open()
        const board = within(within(d).getByRole("region", { name: "현장 이미지 문양" })).getByRole("group", { name: "현장 이미지 문양" })
        for (const z of ["상", "중", "하", "윤곽"]) expect(within(board).getByRole("button", { name: new RegExp(`^${z} 부위`) })).toBeInTheDocument()
        expect(within(board).getByRole("button", { name: "필수 · 상 n32_04" })).toHaveAttribute("aria-pressed", "true")
        expect(within(board).getByRole("group", { name: "상 n32_04 가중치 낮음" })).toHaveAttribute("title", expect.stringMatching(/R2 흔한 종류\(선\) −1 · R5 상·중·하 반복 −1/))
        expect(within(board).getByRole("combobox", { name: "상 n32_04 개수" })).toHaveValue("9")
        expect(within(board).getByRole("button", { name: "빼기 · 윤곽 s10c" })).toBeInTheDocument()
      })

      it("가중치를 바꾸면 「직접」, 다시 누르면 규칙 값 · 검색 조건 탭 「규칙 기본값으로」는 모두 되돌린다", () => {
        const d = open()
        const board = within(d).getByRole("group", { name: "현장 이미지 문양" })
        fireEvent.click(within(within(board).getByRole("group", { name: /^중 s81b 가중치/ })).getByRole("button", { name: "가중치 높음" }))
        expect(within(board).getByRole("group", { name: "중 s81b 가중치 높음 직접" })).toBeInTheDocument()
        fireEvent.click(within(within(board).getByRole("group", { name: /^중 s81b 가중치/ })).getByRole("button", { name: "가중치 높음" }))
        expect(within(board).getByRole("group", { name: "중 s81b 가중치 낮음" })).toBeInTheDocument()
        fireEvent.click(within(within(board).getByRole("group", { name: /^윤곽 s10c 가중치/ })).getByRole("button", { name: "가중치 보통" }))
        fireEvent.click(within(side(d)).getByRole("tab", { name: /검색 조건/ }))
        const rules = within(d).getByRole("region", { name: "가중치 규칙" })
        expect(rules).toHaveTextContent("직접 1개")
        fireEvent.click(within(rules).getByRole("button", { name: "규칙 기본값으로" }))
        expect(within(board).getByRole("group", { name: "윤곽 s10c 가중치 낮음" })).toBeInTheDocument()
        expect(within(rules).getByRole("button", { name: "규칙 기본값으로" })).toBeDisabled()
      })

      it("문양 목록(기본 탭): 전체 종류 폴더 그대로, 누르면 고른 부위에 넣고 다시 누르면 뺀다(이름 기준)", () => {
        const d = open()
        const lib = within(d).getByRole("region", { name: "문양 목록" })
        // 선 폴더 전체(76개) — 시안 앞쪽 일부(12개)가 아니다
        expect(within(lib).getByRole("group", { name: "선 문양 76개" })).toBeInTheDocument()
        // 넣을 부위 = 가운데 4부위 행 중 고른 행(목록 위 따로 고르는 줄 없음)
        expect(within(lib).queryByRole("group", { name: "넣을 부위" })).toBeNull()
        expect(within(lib).queryByRole("textbox", { name: "문양 찾기" })).toBeNull()
        const board = within(d).getByRole("group", { name: "현장 이미지 문양" })
        fireEvent.click(within(board).getByRole("button", { name: /^하 부위/ }))
        expect(within(board).getByRole("button", { name: "하 부위 1개 입력 중" })).toBeInTheDocument()
        fireEvent.click(within(lib).getByRole("button", { name: "하에 n31_02 넣기" }))
        expect(within(board).getByRole("button", { name: "하 부위 2개 입력 중" })).toBeInTheDocument()
        // 이미 넣은 문양 = 눌림 표시, 다시 누르면 빼기
        const again = within(lib).getByRole("button", { name: "하에서 n31_02 빼기" })
        expect(again).toHaveAttribute("aria-pressed", "true")
        fireEvent.click(again)
        expect(within(board).getByRole("button", { name: "하 부위 1개 입력 중" })).toBeInTheDocument()
        // 윤곽 종류도 있다
        fireEvent.click(within(within(lib).getByRole("tablist", { name: "문양 종류" })).getByRole("tab", { name: "윤곽" }))
        expect(within(lib).getByRole("group", { name: "윤곽 문양 16개" })).toBeInTheDocument()
      })

      it("「검색」을 누르면 검색 이력 탭에 한 줄이 늘고(문양 그림 · 필수 · 가중치 막대 · 결과 수 · 상위 5 그림), 「다시 불러오기」 · 「자세히 →」", () => {
        const d = open()
        fireEvent.click(within(side(d)).getByRole("tab", { name: /검색 이력/ }))
        const list = () => within(d).getByRole("list", { name: "검색 이력" })
        expect(within(list()).getAllByRole("listitem", { name: /^검색 / })).toHaveLength(2)
        fireEvent.click(within(d).getByRole("button", { name: "제안 모두 확인" }))
        fireEvent.click(within(within(d).getByRole("group", { name: /^중 s81b 가중치/ })).getByRole("button", { name: "가중치 높음" }))
        fireEvent.click(within(d).getByRole("button", { name: "검색" }))
        const rows = within(list()).getAllByRole("listitem", { name: /^검색 / })
        expect(rows).toHaveLength(3)
        expect(rows[0]).toHaveAccessibleName("검색 572434")
        // 넣은 문양 = 실제 그림(필수 · 가중치는 이름에, 배수 글자 「×」 없음)
        expect(within(rows[0]).getByRole("img", { name: "중 s81b · 가중치 높음(직접)" })).toBeInTheDocument()
        expect(rows[0]).not.toHaveTextContent(/×/)
        expect(within(within(rows[0]).getByRole("list", { name: "상위 결과" })).getAllByRole("listitem")).toHaveLength(5)
        expect(toastMock.success).toHaveBeenCalledWith(expect.stringMatching(/^검색 572434 — 결과 [\d,]+건/))
        // 맨 처음 검색(상 · 중 n32_04 만)을 다시 불러오면 4부위가 그때로
        fireEvent.click(within(d).getByRole("button", { name: "검색 572419 — 이 조건 다시 불러오기" }))
        const board = within(d).getByRole("group", { name: "현장 이미지 문양" })
        expect(within(board).getByRole("button", { name: /^중 부위 1개/ })).toBeInTheDocument()
        expect(within(board).getByRole("button", { name: /^윤곽 부위 0개/ })).toBeInTheDocument()
        // 자세히 = 검색 결과 탭
        fireEvent.click(within(d).getByRole("button", { name: "검색 572419 — 자세히" }))
        expect(query().get("tab")).toBe("search")
      })

      it("1회차 검수 — 탭을 옮겨도 문양 · 가중치 · 검색 이력이 남고, 「자세히 →」는 그 검색의 건수 · 순위를 보인다", () => {
        const d = open()
        const board = () => within(dialog()).getByRole("group", { name: "현장 이미지 문양" })
        // 중 s81b 가중치를 높음으로 · 검색
        fireEvent.click(within(within(board()).getByRole("group", { name: /^중 s81b 가중치/ })).getByRole("button", { name: "가중치 높음" }))
        fireEvent.click(within(d).getByRole("button", { name: "검색" }))
        fireEvent.click(within(side(d)).getByRole("tab", { name: /검색 이력/ }))
        const first = within(within(dialog()).getByRole("list", { name: "검색 이력" })).getAllByRole("listitem", { name: /^검색 / })[0]
        const count = /([\d,]+)건/.exec(first.textContent ?? "")?.[1]
        // 지금 조건과 같은 줄에 「지금」
        expect(first).toHaveTextContent("지금")
        // 사건 정보 탭으로 갔다가 돌아와도 그대로
        fireEvent.click(workTab(/사건 정보/))
        fireEvent.click(workTab(/문양 코드/))
        expect(within(board()).getByRole("group", { name: "중 s81b 가중치 높음 직접" })).toBeInTheDocument()
        fireEvent.click(within(side(dialog())).getByRole("tab", { name: /검색 이력/ }))
        expect(within(within(dialog()).getByRole("list", { name: "검색 이력" })).getAllByRole("listitem", { name: /^검색 / })).toHaveLength(3)
        // 자세히 → 검색 결과 탭: 그 검색의 건수(시안 고정 857 이 아님)
        fireEvent.click(within(dialog()).getByRole("button", { name: "검색 572434 — 자세히" }))
        expect(query().get("run")).toBe("572434")
        expect(within(dialog()).getByText(`${count}건`, { exact: false })).toBeInTheDocument()
        expect(within(dialog()).queryByText(/^857건/)).toBeNull()
      })

      it("2회차 검수 — 일반 문양 목록에서 넣은 문양은 AI 추출에 같은 이름이 있어도 수동, 「AI」 탭에서 넣어야 AI 출처 · 확신도", () => {
        const d = open()
        const board = within(d).getByRole("group", { name: "현장 이미지 문양" })
        fireEvent.click(within(board).getByRole("button", { name: /^하 부위/ }))
        const lib = within(d).getByRole("region", { name: "문양 목록" })
        const kinds = within(within(lib).getByRole("tablist", { name: "문양 종류" }))
        const bottom = () => d.querySelector('[data-drop-zone="bottom"]') as HTMLElement
        fireEvent.click(kinds.getByRole("tab", { name: S04_KINDS.n51_03 }))
        fireEvent.click(within(lib).getByRole("button", { name: "하에 n51_03 넣기" }))
        expect(bottom().querySelectorAll('[data-card-status="manual"]')).toHaveLength(1)
        fireEvent.click(within(lib).getByRole("button", { name: "하에서 n51_03 빼기" }))
        fireEvent.click(kinds.getByRole("tab", { name: /^AI/ }))
        fireEvent.click(within(lib).getByRole("button", { name: "하에 n51_03 넣기(AI 0.71)" }))
        expect(bottom().querySelectorAll('[data-card-status="manual"]')).toHaveLength(0)
        expect(bottom().querySelectorAll('[data-card-status="ai"]')).toHaveLength(1)
      })

      it("2회차 검수 — 「다시 불러오기」는 그때의 확인 전 AI 제안도 되살려 R5(세 부위 반복) · 가중치가 검색 때와 같다(「지금」)", () => {
        const d = open()
        // 처음 값: 하 n32_04 는 확인 전 제안 — 그래도 상 n32_04 는 R5(상 · 중 · 하 반복)로 낮음
        fireEvent.click(within(d).getByRole("button", { name: "검색" }))
        fireEvent.click(within(d).getByRole("button", { name: "다시입력" }))
        fireEvent.click(within(side(d)).getByRole("tab", { name: /검색 이력/ }))
        fireEvent.click(within(d).getByRole("button", { name: "검색 572434 — 이 조건 다시 불러오기" }))
        const board = within(d).getByRole("group", { name: "현장 이미지 문양" })
        expect(within(board).getByRole("button", { name: /^하 부위 1개/ })).toBeInTheDocument()
        const first = within(within(d).getByRole("list", { name: "검색 이력" })).getAllByRole("listitem", { name: /^검색 / })[0]
        expect(first).toHaveTextContent("지금")
      })

      it("1회차 검수 — 「다시입력」은 직접 가중치도 지운다(빈 화면에 「직접 n」이 남지 않음)", () => {
        const d = open()
        fireEvent.click(within(within(d).getByRole("group", { name: /^중 s81b 가중치/ })).getByRole("button", { name: "가중치 높음" }))
        fireEvent.click(within(d).getByRole("button", { name: "다시입력" }))
        fireEvent.click(within(side(d)).getByRole("tab", { name: /검색 조건/ }))
        expect(within(d).getByRole("region", { name: "가중치 규칙" })).toHaveTextContent("직접 0개")
      })

      it("확대경: 켜고 마우스를 대면 동그란 확대경(누를 수 없는 장식)이 따라오고, [ ] 키로 지름을 바꾼다", () => {
        const d = open()
        const box = d.querySelector("[data-lens]") as HTMLElement
        expect(box).toHaveAttribute("data-lens", "off")
        fireEvent.click(within(d).getByRole("button", { name: "확대경" }))
        expect(box).toHaveAttribute("data-lens", "on")
        fireEvent.pointerMove(box, { clientX: 40, clientY: 60, buttons: 0, pointerType: "mouse" })
        const lens = d.querySelector('[data-slot="pattern-lens"]') as HTMLElement
        expect(lens).toHaveClass("pointer-events-none")
        expect(lens).toHaveAttribute("aria-hidden", "true")
        expect(lens.style.width).toBe("144px")
        fireEvent.keyDown(document, { key: "]" })
        expect((d.querySelector('[data-slot="pattern-lens"]') as HTMLElement).style.width).toBe("168px")
        expect(within(d).getByRole("slider", { name: "확대경 지름" })).toHaveValue("168")
        // 누른 채 움직이면(경계선 끌기) 숨긴다
        fireEvent.pointerMove(box, { clientX: 50, clientY: 60, buttons: 1, pointerType: "mouse" })
        expect(d.querySelector('[data-slot="pattern-lens"]')).toBeNull()
      })

      it("현장 이미지를 두 번 누르면 살펴보기 판 — 보기 조정 · 문양 넣기, Esc 는 살펴보기만 닫는다(사건 창은 그대로)", () => {
        const d = open()
        fireEvent.doubleClick(d.querySelector("[data-lens]") as HTMLElement)
        const look = screen.getByRole("dialog", { name: "이미지 살펴보기" })
        expect(look).toHaveAttribute("data-theme", "dark")
        expect(look).toHaveTextContent("보기 조정은 저장하지 않습니다")
        expect(within(look).getByRole("button", { name: "살펴보기 닫기" })).toHaveFocus()
        fireEvent.click(within(look).getByRole("button", { name: "감마 높이기" }))
        expect(within(look).getByRole("img", { name: /감마 1\.25/ })).toBeInTheDocument()
        fireEvent.click(within(look).getByRole("button", { name: "상에 n31_02 넣기" }))
        expect(within(d).getByRole("button", { name: "상 부위 3개 입력 중" })).toBeInTheDocument()
        fireEvent.keyDown(document.activeElement ?? document, { key: "Escape" })
        expect(screen.queryByRole("dialog", { name: "이미지 살펴보기" })).toBeNull()
        expect(screen.getByRole("dialog", { name: /사건 창$/ })).toBeInTheDocument()
        // 살펴보기에서 바꾼 보기는 작은 그림에도 남는다(저장은 안 함)
        expect(within(d).getByText("감마 1.25")).toBeInTheDocument()
      })
    })

    it("검색 결과 탭(11/17 「순위가 쭉」): 왼쪽 현장 족적(보기 조정 · 이어 보기) | 순위 목록(1 · 3 · 5개 · 본 것 · 수동/자동 ⚙), 화류번호 찾기 · 유사도 필터 · AI 10건 없음, 카드 누름 = 고름 · Enter = 정밀 대조", () => {
      renderAt("/dev/s01?case=ready&as=analyst&open=00001-25-0649&img=1&tab=search")
      const d = dialog()
      expect(within(d).queryByText("문양검색결과")).toBeNull()
      expect(within(d).queryByText("이미지번호")).toBeNull()
      const left = within(d).getByRole("region", { name: "현장 족적" })
      expect(within(left).getByRole("group", { name: "보기 조정" })).toBeInTheDocument()
      // 검색번호 없이 열면 가장 최근 검색(572433)의 결과 — 시안 고정 857건이 아님(2회차 검수)
      expect(within(d).queryByText(/^857건/)).toBeNull()
      const hits = rankOfRun(S04_RUNS[0])
      const list = within(d).getByRole("region", { name: "순위 목록" })
      for (const name of ["한 줄 개수", "본 것 거르기", "결과 이미지 보기", "넘김"]) expect(within(list).getByRole("group", { name })).toBeInTheDocument()
      expect(within(d).queryByPlaceholderText(/화류번호/)).toBeNull()
      expect(within(d).queryByText("80↑")).toBeNull()
      expect(within(d).queryByText(/AI가 먼저 보라는/)).toBeNull()
      // 1위부터 이어진 한 목록 · 점수 · 부위 일치 표식
      const cards = list.querySelectorAll("[data-result-card]")
      expect(cards[0]).toHaveAttribute("data-rank", "1")
      expect(cards.length).toBe(Math.min(hits.length, S05_WINDOW_FIRST))
      expect(cards[0]).toHaveTextContent(hits[0].ftwrId)
      // 넣은 문양이 있는 부위(상 · 중 · 윤곽)만 일치 표식
      expect(cards[0].querySelectorAll("[data-zone-mark]")).toHaveLength(3)
      // ⚙ 설정 팝 — 속도 · 쪽 넘김
      fireEvent.click(within(list).getByRole("button", { name: "자동 설정" }))
      expect(within(list).getByRole("dialog", { name: "자동 설정" })).toHaveTextContent("쪽 넘김")
      // 누르면 고름(바닥 줄) · Enter 는 정밀 대조 탭
      fireEvent.click(cards[2])
      expect(within(d).getByText(hits[2].ftwrId, { selector: "[data-selected-summary] span" })).toBeInTheDocument()
      fireEvent.keyDown(cards[2], { key: "Enter" })
      expect(workTab("정밀 대조")).toHaveAttribute("aria-selected", "true")
    })

    it("정밀 대조 탭: 먹색 작업판(유류 | 발견 · 칸마다 보기 조정) · 함께 확대 · 상중하 문양 비교 띠 · AI 대조 한눈에 — 자동/수동 · 대응 목록 · 정보 탭 없음", () => {
      renderAt("/dev/s01?case=ready&as=analyst&open=00001-25-0649&img=1&tab=compare")
      const d = dialog()
      expect(within(d).queryByText("현장문양검색결과 상세조회")).toBeNull()
      expect(within(d).queryByRole("button", { name: /^닫기$/ })).toBeNull()
      const main = within(d).getByRole("region", { name: "유류 · 발견 대조" })
      expect(within(main).getByRole("heading", { name: "유류 · 발견 대조" })).toBeInTheDocument()
      expect(within(main).getByRole("group", { name: "비교" })).toBeInTheDocument()
      for (const name of ["이전", "다음", "정렬 설정", "확대 찍기", "확대경", "연동", "신발 상세 보기"]) {
        expect(within(main).getByRole("button", { name })).toBeInTheDocument()
      }
      for (const name of ["확인대상", "감정서 첨부", "그룹등록"]) expect(within(d).getByRole("button", { name })).toBeInTheDocument()
      // 칸마다 보기 조정(대비 · 반전 · 이진화 · 회전)
      expect(within(main).getAllByRole("group", { name: "보기 조정" })).toHaveLength(2)
      expect(within(main).getAllByRole("button", { name: "회전" })).toHaveLength(2)
      // 뺀 것: 자동/수동 · 대응 목록 · 정보 탭 · 확인 물음 막대
      expect(within(d).queryByRole("radio", { name: "자동" })).toBeNull()
      expect(within(d).queryByRole("tablist", { name: "대조 근거 · 정보" })).toBeNull()
      expect(within(d).queryByLabelText("대응 목록")).toBeNull()
      expect(within(d).queryByText(/확인대상에 등록할까요/)).toBeNull()
      // 확대 찍기 → 한쪽을 누르면 두 그림이 함께 확대(연동) · 다시 누르면 풀림
      const crime = main.querySelector('[data-match-image="crime"]') as HTMLElement
      const shoe = main.querySelector('[data-match-image="shoe"]') as HTMLElement
      fireEvent.click(within(main).getByRole("button", { name: "확대 찍기" }))
      fireEvent.click(crime)
      expect(crime).toHaveAttribute("data-pinned", "true")
      expect(shoe).toHaveAttribute("data-pinned", "true")
      fireEvent.click(crime)
      expect(shoe).not.toHaveAttribute("data-pinned")
      // 상 · 중 · 하 문양 비교 띠 · AI 대조(종합 · 부위 점수)
      const strip = within(main).getByRole("region", { name: "상 · 중 · 하 문양 비교" })
      expect(strip.querySelectorAll("[data-zone-cell]")).toHaveLength(4)
      const ai = within(d).getByRole("region", { name: "AI 대조" })
      expect(ai).toHaveTextContent("87")
      expect(within(ai).getAllByRole("meter", { name: /부위 점수/ })).toHaveLength(3)
      // 신발 상세는 발견 이미지 쪽 작은 팝
      fireEvent.click(within(main).getByRole("button", { name: "신발 상세 보기" }))
      expect(within(d).getByRole("dialog", { name: "신발 상세" })).toHaveTextContent("00758")
    })

    it("?plus=0: 흐름 줄 · 탭은 그대로 보인다", () => {
      renderAt("/dev/s01?case=ready&plus=0&open=00001-25-0649&img=1&tab=info")
      expect(within(screen.getByRole("list", { name: "사건 진행 흐름" })).getAllByRole("listitem")).toHaveLength(5)
      expect(screen.getByRole("tablist", { name: "작업" })).toBeInTheDocument()
    })
  })

  it("작업 탭을 바꾸면 그 화면 위젯이 본문에 보인다(S03 · S04 · S05 · S06 · S07)", () => {
    renderAt("/dev/s01?case=ready&open=00001-25-0646")
    const tabs = within(screen.getByRole("tablist", { name: "작업" }))
    fireEvent.click(tabs.getByRole("tab", { name: "이미지 편집" }))
    expect(query().get("tab")).toBe("edit")
    expect(within(dialog()).getAllByLabelText("이미지 편집").length).toBeGreaterThan(0)
    fireEvent.click(tabs.getByRole("tab", { name: "문양 코드" }))
    expect(within(dialog()).getByRole("region", { name: "현장 이미지 문양" })).toBeInTheDocument()
    fireEvent.click(tabs.getByRole("tab", { name: "검색 결과" }))
    expect(within(dialog()).getByLabelText("결과 이미지 보기")).toBeInTheDocument()
    fireEvent.click(tabs.getByRole("tab", { name: "정밀 대조" }))
    expect(within(dialog()).getByRole("region", { name: "유류 · 발견 대조" })).toBeInTheDocument()
    fireEvent.click(tabs.getByRole("tab", { name: /결과 확인/ }))
    expect(query().get("tab")).toBe("confirm")
    // R6: 그 사건(0646 — 발견 · 불발견 · 감정불능 1장씩) 값으로 이미지별 판정 줄
    expect(within(dialog()).getByRole("group", { name: "00001-25-0646_1 판정" })).toBeInTheDocument()
    expect(within(dialog()).getByTestId("confirm-conclusion")).toHaveTextContent("발견")
  })

  it("결과 확인 탭은 연 사건의 이미지 수 · 판정으로 줄을 만든다(0649 = 12장, 판정 1)", () => {
    renderAt("/dev/s01?case=ready&open=00001-25-0649&tab=confirm")
    expect(within(dialog()).getByRole("group", { name: "00001-25-0649_12 판정" })).toBeInTheDocument()
    expect(within(dialog()).queryByRole("group", { name: "00001-25-0646_1 판정" })).toBeNull()
    expect(within(dialog()).getByText("판정 1 / 12")).toBeInTheDocument()
  })

  it("1회차 검수 — 정밀 대조 「확인대상」으로 넘긴 신발이 결과 확인 탭 그 장의 줄에 실린다", () => {
    renderAt("/dev/s01?case=ready&as=analyst&open=00001-25-0649&img=4&tab=compare&ftwr=02219")
    fireEvent.click(within(dialog()).getByRole("button", { name: "확인대상" }))
    expect(query().get("tab")).toBe("confirm")
    const row = within(dialog()).getByRole("group", { name: "00001-25-0649_4 판정" }).closest("tr, [role='row'], li, div") as HTMLElement
    expect(within(row.parentElement as HTMLElement).getByText("02219")).toBeInTheDocument()
  })

  it("2회차 검수 — 사건 정보 탭: 현장 이미지 칸(이미지 번호 · 채취 장소)은 장마다 따로, 사건 공통 칸은 사건 단위", () => {
    renderAt("/dev/s01?case=ready&as=analyst&open=00001-25-0649&img=1&tab=info")
    const field = (name: string) => within(dialog()).getByRole("textbox", { name }) as HTMLInputElement
    const showTab = (name: RegExp) => fireEvent.click(within(dialog()).getByRole("tab", { name }))
    fireEvent.change(field("사건 이름"), { target: { value: "주거침입(고침)" } })
    showTab(/현장 이미지 정보/)
    fireEvent.change(field("채취 장소"), { target: { value: "거실 A" } })
    const rail = () => screen.getByRole("navigation", { name: /현장 이미지/ }).querySelectorAll('[data-slot="window-rail-item"]')
    fireEvent.click(rail()[1])
    showTab(/현장 이미지 정보/)
    expect(field("이미지 번호").value).toBe("2")
    expect(field("채취 장소").value).not.toBe("거실 A")
    showTab(/사건정보/)
    expect(field("사건 이름").value).toBe("주거침입(고침)")
    fireEvent.click(rail()[0])
    showTab(/현장 이미지 정보/)
    expect(field("채취 장소").value).toBe("거실 A")
    expect(field("이미지 번호").value).toBe("1")
  })

  it("2회차 검수 — 확인대상: 검색 결과 ★ · 정밀 대조 「확인대상」이 한 목록(여러 후보), ★ 는 다른 검색으로 옮겨 붙지 않는다", () => {
    renderAt("/dev/s01?case=ready&as=analyst&open=00001-25-0649&img=2&tab=search")
    const first = rankOfRun(S04_RUNS[0])[0].ftwrId
    fireEvent.click(within(dialog()).getByRole("button", { name: `1위 ${first} 확인대상 넣기` }))
    // 다른 검색(572419)을 열면 그 신발이 그 검색 1위라도 ★ 가 꺼져 있다
    fireEvent.click(workTab(/문양 코드/))
    fireEvent.click(within(dialog()).getByRole("tab", { name: /검색 이력/ }))
    fireEvent.click(within(dialog()).getByRole("button", { name: "검색 572419 — 자세히" }))
    const other = rankOfRun(S04_RUNS[1])[0].ftwrId
    expect(within(dialog()).getByRole("button", { name: `1위 ${other} 확인대상 넣기` })).toHaveAttribute("aria-pressed", "false")
    // 정밀 대조에서 다른 신발을 확인대상으로 → 결과 확인 _2 줄 = 대표(정밀 대조) + 외 1
    fireEvent.click(workTab(/정밀 대조/))
    fireEvent.click(within(dialog()).getByRole("button", { name: "확인대상" }))
    expect(query().get("tab")).toBe("confirm")
    const row = within(dialog()).getByRole("group", { name: "00001-25-0649_2 판정" })
    expect(row).toHaveTextContent(/확인대상 · #\d+ 외 1/)
    // 확인대상이 있으니 발견을 누를 수 있다
    expect(within(within(dialog()).getByRole("group", { name: "_2 판정" })).getByRole("button", { name: "발견" })).toBeEnabled()
  })

  it("2회차 검수 — 검색 1위 후보만 있는 줄은 「1위 후보」(발견 잠김), 판정을 누르면 왼쪽 이미지 목록 알약이 바로 바뀐다", () => {
    renderAt("/dev/s01?case=ready&as=analyst&open=00001-25-0649&tab=confirm")
    const judge = (no: string) => within(within(dialog()).getByRole("group", { name: `_${no} 판정` }))
    expect(within(dialog()).getByRole("group", { name: "00001-25-0649_3 판정" })).toHaveTextContent("1위 후보")
    expect(judge("3").getByRole("button", { name: "발견" })).toBeDisabled()
    fireEvent.click(judge("3").getByRole("button", { name: "불발견" }))
    // 불발견을 눌러도 1위 후보 글자는 「확인대상」으로 바뀌지 않는다
    expect(within(dialog()).getByRole("group", { name: "00001-25-0649_3 판정" })).toHaveTextContent("1위 후보")
    const rail = screen.getByRole("navigation", { name: /현장 이미지/ }).querySelectorAll('[data-slot="window-rail-item"]')
    expect(rail[2]).toHaveAccessibleName("_3 · 불발견")
  })

  it("2회차 검수 — 발견으로 판정한 뒤 확인대상을 바꾸면 발견을 물려받지 않고 「다시 판정」, 「열기」는 그 줄의 신발로", () => {
    renderAt("/dev/s01?case=ready&as=analyst&open=00001-25-0649&tab=confirm")
    // _1 은 발견으로 저장된 장 — 열기 = 정밀 대조 탭, 그 줄의 확인대상 신발로(기본 신발 00758 이 아님)
    const row1 = within(dialog()).getByRole("group", { name: "00001-25-0649_1 판정" })
    const shoeId = within(row1).getAllByText(/^[\w-]+$/, { selector: "b" }).map((b) => b.textContent)[1]
    fireEvent.click(within(dialog()).getByRole("button", { name: "_1 열기" }))
    expect(query().get("tab")).toBe("compare")
    expect(query().get("ftwr")).toBe(shoeId)
    // 다른 신발을 확인대상으로 넣으면 _1 은 다시 판정
    fireEvent.click(within(dialog()).getByRole("button", { name: "다음" }))
    fireEvent.click(within(dialog()).getByRole("button", { name: "확인대상" }))
    const row = within(dialog()).getByRole("group", { name: "00001-25-0649_1 판정" })
    expect(row).toHaveTextContent("다시 판정")
    expect(within(within(dialog()).getByRole("group", { name: "_1 판정" })).getByRole("button", { name: "발견" })).toHaveAttribute("aria-pressed", "false")
  })

  it("2회차 검수 — 수사관 시점 위 막대 건수는 자기 관서 사건 수(전국 건수 아님)", () => {
    renderAt("/dev/s01?case=ready&as=investigator")
    expect(screen.queryByText("116건")).toBeNull()
  })

  it("1회차 검수 — 수사관은 자기 관서(대구청) 의뢰만 열리고, 창은 「사건 정보」 탭만, 신발 DB 패널은 주소로도 안 열림", () => {
    // 0647 은 경북청 의뢰 — 수사관(대구청)은 목록 · 창 모두 안 보임
    const other = renderAt("/dev/s01?case=ready&as=investigator&open=00001-25-0647&tab=info")
    expect(screen.queryByRole("dialog")).toBeNull()
    expect(screen.queryByText("00001-25-0647")).toBeNull()
    other.unmount()
    // 0649 는 대구청 — 열리지만 검색 결과 탭 주소로 와도 사건 정보만
    renderAt("/dev/s01?case=ready&as=investigator&open=00001-25-0649&img=1&tab=search&shoe=1")
    const tabs = within(dialog().closest('[data-slot="case-window-tabbed"]') as HTMLElement)
    expect(tabs.getByRole("tab", { name: /사건 정보/ })).toHaveAttribute("aria-selected", "true")
    for (const name of [/이미지 편집/, /문양 코드/, /검색 결과/, /정밀 대조/, /결과 확인/]) expect(tabs.queryByRole("tab", { name })).toBeNull()
    expect(screen.queryByRole("dialog", { name: "신발 DB" })).toBeNull()
  })

  it("1회차 검수 — 사건 · 이미지를 바꾸면 앞 이미지의 검색 문맥(ftwr · rank · run)을 지운다", () => {
    renderAt("/dev/s01?case=ready&open=00001-25-0649&img=1&tab=search&run=572419&ftwr=00758&rank=1")
    fireEvent.click(screen.getByRole("navigation", { name: /현장 이미지/ }).querySelectorAll('[data-slot="window-rail-item"]')[2])
    expect(query().get("img")).toBe("3")
    for (const k of ["ftwr", "rank", "run"]) expect(query().get(k)).toBeNull()
  })

  it("왼쪽 목록 줄을 누르면 그 이미지로(img)", () => {
    renderAt("/dev/s01?case=ready&open=00001-25-0649")
    fireEvent.click(screen.getByRole("navigation", { name: /현장 이미지/ }).querySelectorAll('[data-slot="window-rail-item"]')[4])
    expect(query().get("img")).toBe("5")
  })

  it("✕ · Esc · 가림막으로 닫힌다(열린 사건 탭 목록은 남는다)", () => {
    const { container } = renderAt("/dev/s01?case=ready&open=00001-25-0649")
    fireEvent.click(screen.getByRole("button", { name: "창 닫기" }))
    expect(screen.queryByRole("dialog")).toBeNull()
    expect(query().get("open")).toBeNull()
    expect(query().get("tabs")).toBe("00001-25-0649")

    fireEvent.click(screen.getByText("00001-25-0649"))
    fireEvent.keyDown(document, { key: "Escape" })
    expect(screen.queryByRole("dialog")).toBeNull()

    fireEvent.click(screen.getByText("00001-25-0649"))
    fireEvent.click(container.querySelector('[data-slot="case-window-scrim"]')!)
    expect(screen.queryByRole("dialog")).toBeNull()
  })

  it("‹ › = 목록 순서 앞 · 뒤 사건(처음이면 ‹ 잠김), 지금 탭 자리를 바꾼다", () => {
    renderAt("/dev/s01?case=ready&open=00001-25-0649&tab=pattern")
    expect(screen.getByRole("button", { name: "앞 사건" })).toBeDisabled()
    fireEvent.click(screen.getByRole("button", { name: "다음 사건" }))
    expect(screen.getByRole("dialog", { name: "00001-25-0647 절도 사건 창" })).toBeInTheDocument()
    expect(query().get("tab")).toBe("pattern")
    expect(query().get("tabs")).toBe("00001-25-0647")
    fireEvent.click(screen.getByRole("button", { name: "앞 사건" }))
    expect(query().get("open")).toBe("00001-25-0649")
  })

  it("작업 탭 줄: 다른 사건 행을 열면 탭이 더해지고, × 로 닫으면 옆 탭 · 마지막이면 창이 닫힌다", () => {
    renderAt("/dev/s01?case=ready")
    fireEvent.click(screen.getByText("00001-25-0649"))
    fireEvent.click(screen.getByRole("button", { name: "창 닫기" }))
    fireEvent.click(screen.getByText("00001-25-0647"))
    expect(query().get("tabs")).toBe("00001-25-0649,00001-25-0647")
    expect(workTab("00001-25-0647 · 절도")).toHaveAttribute("aria-selected", "true")
    fireEvent.click(workTab("00001-25-0649 · 주거침입"))
    expect(query().get("open")).toBe("00001-25-0649")
    fireEvent.click(screen.getByRole("button", { name: "00001-25-0649 · 주거침입 탭 닫기" }))
    expect(query().get("open")).toBe("00001-25-0647")
    fireEvent.click(screen.getByRole("button", { name: "00001-25-0647 · 절도 탭 닫기" }))
    expect(screen.queryByRole("dialog")).toBeNull()
    expect(query().get("tabs")).toBeNull()
  })

  it("작업 탭 줄 「+」: 사건을 찾아 누르면 탭이 더해지고(Esc 는 메뉴만 닫음), 기능 열기 「신발 DB」는 패널을 연다", () => {
    renderAt("/dev/s01?case=ready&as=admin&open=00001-25-0649&img=1&tab=info")
    const win = screen.getByRole("dialog", { name: /사건 창$/ })
    fireEvent.click(screen.getByRole("button", { name: "탭 추가" }))
    const menu = screen.getByRole("dialog", { name: "탭 추가" })
    fireEvent.keyDown(document, { key: "Escape" })
    expect(screen.queryByRole("dialog", { name: "탭 추가" })).toBeNull()
    expect(win).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "탭 추가" }))
    fireEvent.change(within(screen.getByRole("dialog", { name: "탭 추가" })).getByRole("textbox", { name: "사건 찾기" }), { target: { value: "0647" } })
    fireEvent.click(within(screen.getByRole("region", { name: /^사건 찾기/ })).getByRole("button", { name: /00001-25-0647/ }))
    expect(query().get("tabs")).toBe("00001-25-0649,00001-25-0647")
    expect(query().get("open")).toBe("00001-25-0647")
    expect(menu).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "탭 추가" }))
    fireEvent.click(within(screen.getByRole("region", { name: "기능 열기" })).getByRole("button", { name: /신발 DB/ }))
    expect(query().get("shoe")).toBe("1")
  })

  it("작업 탭은 8개까지 — 가득이면 회색 한 줄 까닭, 새 사건은 열지 않고 알린다", () => {
    const eight = ["0649", "0647", "0646", "0640", "0633", "0621", "0612", "0583"].map((n) => `00001-25-${n}`).join(",")
    renderAt(`/dev/s01?case=ready&tabs=${eight}`)
    fireEvent.click(screen.getByText("00001-25-0582"))
    expect(toastMock).toHaveBeenCalledWith(OPEN_CASES_FULL)
    expect(screen.queryByRole("dialog")).toBeNull()
    fireEvent.click(screen.getByText("00001-25-0649"))
    expect(within(dialog().closest('[data-slot="case-window-tabbed"]') as HTMLElement).getByRole("status")).toHaveTextContent(OPEN_CASES_FULL)
  })

  it("사건 진행 칸 「검색」 → 검색 안 한 첫 이미지의 검색 결과 탭, 「확인」 → 사건 단위 결과 확인 탭", () => {
    renderAt("/dev/s01?case=ready")
    fireEvent.click(within(rowOf("00001-25-0649")).getByRole("button", { name: "검색" }))
    expect([query().get("tab"), query().get("img")]).toEqual(["search", "4"])
    expect(within(dialog()).getByLabelText("결과 이미지 보기")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "창 닫기" }))
    fireEvent.click(within(rowOf("00001-25-0647")).getByRole("button", { name: "확인" }))
    expect(query().get("tab")).toBe("confirm")
  })

  it("창 안 S02 「이미지 커팅 열기」 같은 화면 이동은 창 탭 바꾸기로 받는다", () => {
    renderAt("/dev/s01?case=ready&open=00001-25-0649&tab=pattern")
    // S04 「검색결과」는 S05 로 간다 → 창의 검색 결과 탭
    fireEvent.click(within(dialog()).getByRole("button", { name: "검색결과" }))
    expect(query().get("tab")).toBe("search")
    // S03 「취소」는 S02 로 간다 → 창의 사건 정보 탭
    fireEvent.click(within(screen.getByRole("tablist", { name: "작업" })).getByRole("tab", { name: "이미지 편집" }))
    fireEvent.click(within(dialog()).getByRole("button", { name: "취소" }))
    expect(query().get("tab")).toBe("info")
  })

  it("?plus=0 에서도 창은 열리고, +α 사건 진행 단계 꼬리표는 숨는다", () => {
    const { container } = renderAt("/dev/s01?case=ready&plus=0")
    fireEvent.click(screen.getByText("00001-25-0649"))
    const head = container.querySelector('[data-slot="window-head"]') as HTMLElement
    expect(within(head).getByText("대구청")).toBeInTheDocument()
    expect(within(head).queryByText("이미지 확인 중")).toBeNull()
  })

  it("주소만으로 같은 창이 열린다(공유 가능)", () => {
    renderAt("/dev/s01?case=ready&open=00001-25-0646&img=3&tab=search&tabs=00001-25-0649,00001-25-0646")
    expect(screen.getByRole("dialog", { name: "00001-25-0646 주거침입 사건 창" })).toBeInTheDocument()
    expect(workTab("00001-25-0649 · 주거침입")).toHaveAttribute("aria-selected", "false")
    expect(screen.getByRole("navigation", { name: /현장 이미지/ }).querySelectorAll('[data-slot="window-rail-item"]')[2]).toHaveAttribute("aria-current", "true")
  })
})
