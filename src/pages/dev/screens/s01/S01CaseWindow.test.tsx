import { fireEvent, render, screen, within } from "@testing-library/react"
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

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
const rowOf = (no: string) => screen.getByText(no).closest("tr") as HTMLElement
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

    it("사건 정보 탭: 왼쪽 족윤적 이미지 | 오른쪽 「사건정보 · 현장 이미지 정보」 탭(한 번에 한 표), 현장 이미지 탭에서만 적용 범위 도구", () => {
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
      expect(within(d).getByRole("group", { name: "적용 범위" })).toBeInTheDocument()
      // 저장 줄은 두 탭 공통 바닥
      expect(within(d).getByRole("button", { name: "저장" })).toBeInTheDocument()
    })

    it("이미지 편집 탭: 1차 편집만(2차 이미지 뷰어 · 시나리오 줄 · 제목 줄 ✕ · 「1차 작업」 꼬리표 없음), 저장 단추는 칸 머리, 오른쪽 「AI 제안 · 편집 이력」 탭", () => {
      renderAt("/dev/s01?case=ready&as=analyst&open=00001-25-0649&img=1&tab=edit")
      const d = dialog()
      const cutting = within(d).getByRole("region", { name: "이미지 커팅" })
      expect(within(d).queryByRole("region", { name: "이미지 뷰어" })).toBeNull()
      expect(within(d).queryByText(/A · 1차 작업/)).toBeNull()
      expect(within(d).queryByText(/B · 2차 작업/)).toBeNull()
      expect(within(d).queryByRole("button", { name: "이미지 커팅 닫기" })).toBeNull()
      expect(within(d).queryByText("1차 작업", { selector: "[data-part=Chip]" })).toBeNull()
      // 머리 줄 = 제목 + 취소 · 확인 · 저장(저장만 채움)
      const head = cutting.querySelector('[data-slot="panel-pane-head"]') as HTMLElement
      expect(within(head).getByRole("heading", { name: "이미지 커팅" })).toBeInTheDocument()
      expect(within(head).getAllByRole("button").map((b) => b.textContent).filter((t) => t !== "i")).toEqual(["취소", "확인", "저장"])
      expect(within(head).getByRole("button", { name: "저장" })).toHaveAttribute("data-part-variant", "sm-pri")
      // 도구는 세로 칸, SCAS 아래 버튼 줄은 그대로
      expect(within(within(cutting).getByRole("group", { name: "도구" })).getByRole("button", { name: "이진화" })).toBeInTheDocument()
      expect(within(cutting).getByRole("group", { name: "SCAS 아래 버튼 줄" })).toBeInTheDocument()
      // 오른쪽 칸: 탭 둘, 이력 탭에서 되돌리기
      const side = within(d).getByRole("tablist", { name: "편집 보조" })
      expect(within(side).getAllByRole("tab").map((t) => t.textContent)).toEqual(["AI 제안3", "편집 이력3"])
      fireEvent.click(within(within(d).getByRole("region", { name: "AI 제안" })).getByRole("button", { name: "맞추기" }))
      fireEvent.click(within(side).getByRole("tab", { name: /편집 이력/ }))
      expect(within(within(d).getByRole("region", { name: "편집 이력" })).getAllByRole("listitem")).toHaveLength(4)
      fireEvent.click(within(d).getByRole("button", { name: "되돌리기" }))
      expect(within(within(d).getByRole("region", { name: "편집 이력" })).getAllByRole("listitem")).toHaveLength(3)
    })

    it("문양 코드 탭: 제목 줄 · 닫기 · 이미지 목록 표 없음, 세 칸(현장 이미지 | 문양 | 추출 · 검색 탭) + 바닥 단추 줄(검색만 채움)", () => {
      renderAt("/dev/s01?case=ready&as=analyst&open=00001-25-0649&img=1&tab=pattern")
      const d = dialog()
      expect(within(d).queryByText("문양 상세보기")).toBeNull()
      expect(within(d).queryByRole("button", { name: /^닫기$/ })).toBeNull()
      expect(within(d).queryByRole("columnheader", { name: "이미지 번호" })).toBeNull()
      for (const name of ["현장 이미지", "현장 이미지 문양", "추출 · 검색"]) expect(within(d).getByRole("region", { name })).toBeInTheDocument()
      // 칸 머리 = 밑줄 탭 모양(파란 띠 아님)
      expect(within(within(d).getByRole("region", { name: "현장 이미지" })).getByRole("heading", { name: "현장 이미지" })).toBeInTheDocument()
      expect(within(d).getByRole("group", { name: "검색 이미지" })).toBeInTheDocument()
      // 바닥 단추: 검색만 채움, 다음 이미지 →
      const search = within(d).getByRole("button", { name: "검색" })
      expect(search).toHaveAttribute("data-part-variant", "sm-pri")
      expect(within(d).getByRole("button", { name: /다음 이미지 _3/ })).not.toHaveAttribute("data-part-variant", "sm-pri")
      // 오른쪽 탭: AI 추출(기본) → 검색 조건 → 검색이력
      const side = within(d).getByRole("tablist", { name: "추출 · 검색" })
      expect(within(d).getByRole("region", { name: "AI 추출 결과" })).toBeInTheDocument()
      expect(within(d).queryByRole("region", { name: "매칭 조건" })).toBeNull()
      fireEvent.click(within(side).getByRole("tab", { name: "검색 조건" }))
      expect(within(d).getByRole("region", { name: "매칭 조건" })).toBeInTheDocument()
      expect(within(d).getByRole("radiogroup", { name: "검색 방식" })).toBeInTheDocument()
      fireEvent.click(within(side).getByRole("tab", { name: /검색이력/ }))
      expect(within(within(d).getByRole("region", { name: "검색이력" })).getAllByRole("button", { name: "보기" }).length).toBeGreaterThan(0)
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
    expect(within(dialog()).getByLabelText("대응 목록")).toBeInTheDocument()
    fireEvent.click(tabs.getByRole("tab", { name: /결과 확인/ }))
    expect(query().get("tab")).toBe("confirm")
    expect(within(dialog()).getByLabelText("00001-25-0646_1 검색결과")).toBeInTheDocument()
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

  it("작업 탭은 8개까지 — 가득이면 회색 한 줄 까닭, 새 사건은 열지 않고 알린다", () => {
    const eight = ["0649", "0647", "0646", "0640", "0633", "0621", "0612", "0583"].map((n) => `00001-25-${n}`).join(",")
    renderAt(`/dev/s01?case=ready&tabs=${eight}`)
    fireEvent.click(screen.getByText("00001-25-0582"))
    expect(toastMock).toHaveBeenCalledWith(OPEN_CASES_FULL)
    expect(screen.queryByRole("dialog")).toBeNull()
    fireEvent.click(screen.getByText("00001-25-0649"))
    expect(within(dialog().closest('[data-slot="case-window-tabbed"]') as HTMLElement).getByRole("status")).toHaveTextContent(OPEN_CASES_FULL)
  })

  it("행 끝 「검색」 → 검색 안 한 첫 이미지의 검색 결과 탭, 「확인」 → 사건 단위 결과 확인 탭", () => {
    renderAt("/dev/s01?case=ready")
    fireEvent.click(within(rowOf("00001-25-0649")).getByRole("button", { name: "검색" }))
    expect([query().get("tab"), query().get("img")]).toEqual(["search", "4"])
    expect(within(dialog()).getByLabelText("결과 이미지 보기")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "창 닫기" }))
    fireEvent.click(within(rowOf("00001-25-0647")).getByRole("button", { name: "확인" }))
    expect(query().get("tab")).toBe("confirm")
  })

  it("펼침 줄: 이미지 블록 → 그 이미지, 「사건 열기 (S02)」 → 사건 정보, 「검색결과 확인」 → 결과 확인", () => {
    renderAt("/dev/s01?case=ready")
    fireEvent.click(screen.getByRole("button", { name: "_2 불발견 이미지 열기" }))
    expect([query().get("open"), query().get("img"), query().get("tab")]).toEqual(["00001-25-0646", "2", "info"])
    fireEvent.click(screen.getByRole("button", { name: "창 닫기" }))
    fireEvent.click(screen.getByRole("button", { name: "검색결과 확인" }))
    expect(query().get("tab")).toBe("confirm")
    fireEvent.click(screen.getByRole("button", { name: "창 닫기" }))
    fireEvent.click(screen.getByRole("button", { name: "사건 열기 (S02)" }))
    expect(query().get("tab")).toBe("info")
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
