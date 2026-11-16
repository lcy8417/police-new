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
    expect(within(rail).getAllByRole("button")).toHaveLength(12)
    // 장별 상태는 목록 숫자와 같다: 발견 1 · 검색됨 2 · 등록 9
    expect(within(rail).getAllByText("등록")).toHaveLength(9)
    expect(within(rail).getAllByText("검색됨")).toHaveLength(2)
    expect(within(rail).getAllByRole("button")[0]).toHaveAttribute("aria-current", "true")
    const q = query()
    expect([q.get("open"), q.get("img"), q.get("tab"), q.get("tabs"), q.get("as"), q.get("case")]).toEqual([
      "00001-25-0649",
      "1",
      "info",
      "00001-25-0649",
      "analyst",
      "ready",
    ])
    // 본문 = S02 사건 정보 위젯
    expect(within(dialog()).getByLabelText("사건 상세 도구")).toBeInTheDocument()
  })

  it("작업 탭을 바꾸면 그 화면 위젯이 본문에 보인다(S03 · S04 · S05 · S06 · S07)", () => {
    renderAt("/dev/s01?case=ready&open=00001-25-0646")
    const tabs = within(screen.getByRole("tablist", { name: "작업" }))
    fireEvent.click(tabs.getByRole("tab", { name: "이미지 편집" }))
    expect(query().get("tab")).toBe("edit")
    expect(within(dialog()).getAllByLabelText("이미지 편집").length).toBeGreaterThan(0)
    fireEvent.click(tabs.getByRole("tab", { name: "문양 코드" }))
    expect(within(dialog()).getByLabelText("검색이력")).toBeInTheDocument()
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
    fireEvent.click(within(screen.getByRole("navigation", { name: /현장 이미지/ })).getAllByRole("button")[4])
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
    // S04 「닫기」는 S02 로 간다 → 창의 사건 정보 탭
    fireEvent.click(within(dialog()).getAllByRole("button", { name: /^닫기$/ })[0])
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
    expect(within(screen.getByRole("navigation", { name: /현장 이미지/ })).getAllByRole("button")[2]).toHaveAttribute("aria-current", "true")
  })
})
