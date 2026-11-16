import { act, fireEvent, render, screen, within } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { S10DevPage } from "./S10DevPage"

// 알림은 Toaster 없이 호출만 확인한다
const toastMock = vi.hoisted(() => Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }))
vi.mock("sonner", () => ({ toast: toastMock }))
beforeEach(() => toastMock.mockClear())
const PLANNED = "시안 — 기능 준비 중"

const renderAt = (query: string) =>
  render(
    <MemoryRouter initialEntries={[`/dev/s10?${query}`]}>
      <S10DevPage />
    </MemoryRouter>,
  )

// 진열 막대(data-dev-bar)와 껍데기 메뉴에도 「등록」 글자가 있을 수 있어 툴바 버튼만 이름으로 찾는다
const button = (name: string) => screen.queryByRole("button", { name })
// r2: 진열 기본 보기는 시안대로 문양보기(카드). 표가 필요한 시험은 목록보기로 바꾼다
const toList = () => fireEvent.click(screen.getByRole("button", { name: "목록보기" }))
const plusEls = () => document.querySelectorAll("[data-plus]")

describe("S10 신발문양 관리 진열 페이지", () => {
  it("ready 케이스에 신발 목록과 00758 을 그대로 그린다", () => {
    renderAt("case=ready&as=admin")
    toList()
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

  it("검색 폼은 3열이고 지금 11칸(신규 켜면 AI 추천 포함 12칸)이 4행에 놓인다", () => {
    const { container, unmount } = renderAt("case=ready&as=admin&plus=0")
    const form = container.querySelector('[data-part="SearchForm"]')
    expect(form).toHaveAttribute("data-part-variant", "col3")
    const labelCount = form!.querySelectorAll(":scope > div > div:nth-child(odd)").length
    expect(labelCount).toBe(11)
    expect(Math.ceil(labelCount / 3)).toBe(4)
    unmount()
    const on = renderAt("case=ready&as=admin")
    const n = on.container.querySelector('[data-part="SearchForm"]')!.querySelectorAll(":scope > div > div:nth-child(odd)").length
    expect(n).toBe(12)
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

  describe("r2 시안 그대로", () => {
    it("?plus=0 이면 [data-plus] 가 하나도 없고 지금 기능은 그대로다", () => {
      renderAt("case=ready&as=admin&plus=0")
      expect(plusEls()).toHaveLength(0)
      expect(screen.getByText("00758")).toBeInTheDocument()
      expect(button("조회")).not.toBeNull()
      fireEvent.click(screen.getByText("00758"))
      expect(plusEls()).toHaveLength(0)
      expect(screen.getByRole("dialog")).toBeInTheDocument()
    })

    it("신규 켜면 작업 단계 · 미승인 막대 · 오늘 승인이 시안 문구로 보인다", () => {
      renderAt("case=ready&as=analyst")
      expect(screen.getByText("등록됨 · 문양 대기")).toBeInTheDocument()
      expect(screen.getByText("AI 문양 제안 198 / 214")).toBeInTheDocument()
      expect(screen.getByText("AI 확인 필요 9")).toBeInTheDocument()
      expect(screen.getByText("2025-03 미승인")).toBeInTheDocument()
      expect(screen.getByText("37 / 50매")).toBeInTheDocument()
      expect(screen.getByText("하루 50매면 3월분 약 11일")).toBeInTheDocument()
      expect(screen.getByText("AI 추천")).toBeInTheDocument()
    })

    it("카드에 AI 표시: 확신도 · 읽는 중 · 중복 의심", () => {
      renderAt("case=ready&as=analyst")
      expect(screen.getByText("AI 0.95")).toBeInTheDocument()
      expect(screen.getByText("AI 읽는 중")).toBeInTheDocument()
      // r3: 같은 글자가 빠른 찾기 칩에도 있다 — 카드 위 표시는 AiTag
      expect(document.querySelector('[data-shoe-id="303349"]')).toHaveTextContent("중복 의심")
      expect(screen.getByText("AI 0.61")).toBeInTheDocument()
    })

    it("스캔선은 움직임 줄이기에서 멈추도록 motion-safe 로만 건다", () => {
      renderAt("case=ready&as=analyst")
      const scans = document.querySelectorAll('[data-part="ScanOverlay"]')
      expect(scans.length).toBeGreaterThan(0)
      scans.forEach((el) => {
        expect(el.className).toContain("motion-safe:animate-fx-scan")
        expect(el.className.split(/\s+/)).not.toContain("animate-fx-scan")
      })
    })

    it("엑셀 · 엑셀 일괄 등록은 활성이고 누르면 「시안 — 기능 준비 중」", () => {
      renderAt("case=ready&as=admin")
      const excel = screen.getByRole("button", { name: "엑셀 일괄 등록" })
      expect(excel).not.toBeDisabled()
      expect(screen.getByRole("button", { name: "엑셀" })).not.toBeDisabled()
      fireEvent.click(excel)
      expect(toastMock).toHaveBeenCalledWith(PLANNED)
    })

    it("역할: 승인 · 삭제는 관리자만 눌리고 감정관은 잠김, 엑셀 일괄 등록은 감정관도 보인다", () => {
      const a = renderAt("case=ready&as=admin")
      expect(screen.getByRole("button", { name: "승인" })).not.toBeDisabled()
      expect(screen.getByRole("button", { name: "삭제" })).not.toBeDisabled()
      a.unmount()
      renderAt("case=ready&as=analyst")
      expect(screen.getByRole("button", { name: "승인" })).toBeDisabled()
      expect(screen.getByRole("button", { name: "삭제" })).toBeDisabled()
      expect(button("엑셀 일괄 등록")).not.toBeNull()
    })

    it("역할: 기술책임자에게는 쓰기 버튼(엑셀 일괄 등록 · 등록)이 없다", () => {
      renderAt("case=ready&as=verifier")
      expect(button("엑셀 일괄 등록")).toBeNull()
      expect(button("등록")).toBeNull()
    })

    it("신발정보관리 창: 문양정보 탭에 AI 1차 입력 · 확신도 · 중복 의심이 시안 문구로 보인다", () => {
      renderAt("case=ready&as=analyst")
      fireEvent.click(screen.getByText("303349"))
      const dialog = screen.getByRole("dialog")
      fireEvent.click(within(dialog).getByRole("button", { name: "문양정보" }))
      expect(within(dialog).getByText("AI 1차 입력")).toBeInTheDocument()
      expect(within(dialog).getByText(/한 번에/)).toBeInTheDocument()
      expect(within(dialog).getByText("확인 필요 · 가격표가 가림")).toBeInTheDocument()
      expect(within(dialog).getByText("AI 미지원 · 사람이 입력")).toBeInTheDocument()
      expect(within(dialog).getByText("AI 중복 의심")).toBeInTheDocument()
      expect(within(dialog).getByText("0.96")).toBeInTheDocument()
      expect(within(dialog).getByRole("button", { name: "상·중·하 모두에 넣기" })).toBeInTheDocument()
      expect(within(dialog).getByRole("button", { name: "인공지능문양관리" })).toBeInTheDocument()
      expect(within(dialog).getByText(/AI 확인 필요 2건/)).toBeInTheDocument()
    })

    it("신발정보관리 창: 레이어 형태 · 머리에 아이디·칩·안내문 · 탭 줄 끝 닫기", () => {
      renderAt("case=ready&as=analyst&tab=pattern")
      fireEvent.click(screen.getByText("303349"))
      const dialog = screen.getByRole("dialog")
      expect(dialog).toHaveAttribute("data-part-variant", "layer")
      expect(within(dialog).getByText("뒤 목록은 그대로 깔려 있음 · Esc 닫기")).toBeInTheDocument()
      const head = within(dialog).getByText("신발정보관리").parentElement as HTMLElement
      expect(within(head).getByText("303349")).toBeInTheDocument()
      expect(within(head).getByText("AI 확인 필요")).toBeInTheDocument()
      const close = within(dialog).getAllByRole("button", { name: "닫기" })
      expect(close).toHaveLength(2) // 머리 ✕ + 탭 줄 끝 닫기
      fireEvent.click(close[1])
      expect(screen.queryByRole("dialog")).toBeNull()
    })

    it("역할: 기술책임자 · 보기 전용에는 인공지능문양관리 · 모두에 넣기가 없다", () => {
      renderAt("case=ready&as=verifier&tab=pattern")
      fireEvent.click(screen.getByText("303349"))
      const dialog = screen.getByRole("dialog")
      expect(within(dialog).queryByRole("button", { name: "인공지능문양관리" })).toBeNull()
      expect(within(dialog).queryByRole("button", { name: "상·중·하 모두에 넣기" })).toBeNull()
      expect(within(dialog).queryByRole("button", { name: "그룹으로 연결" })).toBeNull()
    })

    it("창의 이전 · 다음 · 그룹등록 · 승인은 시안 알림", () => {
      renderAt("case=ready&as=admin")
      fireEvent.click(screen.getByText("303349"))
      const dialog = screen.getByRole("dialog")
      for (const n of ["이전", "다음", "그룹등록", "승인"]) {
        toastMock.mockClear()
        fireEvent.click(within(dialog).getByRole("button", { name: n }))
        expect(toastMock).toHaveBeenCalledTimes(1)
        expect(toastMock).toHaveBeenCalledWith(PLANNED)
      }
    })

    it("?plus=0: 창 두 탭 모두 [data-plus] 0, 이전 · 다음 · 그룹등록 · 승인 없음, 문양 이름은 그대로", () => {
      renderAt("case=ready&as=admin&plus=0&tab=pattern")
      fireEvent.click(screen.getByText("303349"))
      const dialog = screen.getByRole("dialog")
      const none = () => {
        expect(plusEls()).toHaveLength(0)
        for (const n of ["이전", "다음", "그룹등록", "승인"]) expect(within(dialog).queryByRole("button", { name: n })).toBeNull()
      }
      none()
      // 문양 아이콘은 이름을 그대로 보인다(title)
      expect(dialog.querySelector('[data-part="PatternIcon"][title="n32_04"]')).not.toBeNull()
      expect(dialog.querySelector('[data-part="PatternIcon"][title="s10c"]')).not.toBeNull()
      fireEvent.click(within(dialog).getByRole("button", { name: "기본정보" }))
      none()
    })

    it("보기 전용 · 기술책임자는 문양정보 탭에 고르기 줄(분류 칩 · 팔레트)이 없다", () => {
      renderAt("case=ready&as=readonly&tab=pattern")
      fireEvent.click(screen.getByText("303349"))
      const dialog = screen.getByRole("dialog")
      expect(within(dialog).queryByRole("button", { name: /^문양 n/ })).toBeNull()
      expect(within(dialog).queryByText("내부선")).toBeNull()
    })
  })

  it("긴 모델명 행이 있다(가로 넘침 점검용)", () => {
    renderAt("case=ready")
    toList()
    expect(screen.getAllByRole("row").length).toBeGreaterThan(10)
    expect(screen.getByText(/한정판 컬러웨이$/)).toBeInTheDocument()
  })
})

describe("S10 r3 — 빠른 찾기 · 카드 크기 · 열 · 자동 넘기기", () => {
  beforeEach(() => window.localStorage.clear())
  afterEach(() => vi.useRealTimers())

  const cards = () => document.querySelectorAll("[data-shoe-id]")
  const search = (v: string) => fireEvent.change(screen.getByLabelText("검색어"), { target: { value: v } })
  const tick = (ms: number) => act(() => void vi.advanceTimersByTime(ms))
  const current = () => document.querySelector('[data-shoe-id][aria-current="true"]')?.getAttribute("data-shoe-id")
  const press = (name: string) => fireEvent.click(screen.getByRole("button", { name }))
  const key = (k: string) => fireEvent.keyDown(document.body, { key: k })

  it("검색: 화류번호 · 모델명 · 상표로 좁히고, 0건이면 「조건에 맞는 항목 없음」 + 「조건 지우기」(결과 없음 · 다시와 다름)", () => {
    renderAt("case=ready&as=admin")
    expect(cards()).toHaveLength(16)
    search("303352")
    expect(cards()).toHaveLength(1)
    search("zzzz없는값")
    expect(screen.getByText("조건에 맞는 항목 없음")).toBeInTheDocument()
    expect(screen.queryByText("결과 없음")).toBeNull()
    expect(screen.queryByRole("button", { name: "다시" })).toBeNull()
    fireEvent.click(screen.getAllByRole("button", { name: "조건 지우기" })[1])
    expect(screen.queryByText("조건에 맞는 항목 없음")).toBeNull()
    expect(cards()).toHaveLength(16)
  })

  it("칩: 상태 · 중복 의심으로 걸러진다", () => {
    renderAt("case=ready&as=admin")
    fireEvent.click(within(screen.getByRole("group", { name: "표시" })).getByRole("button", { name: "중복 의심" }))
    expect(document.querySelector('[data-shoe-id="303349"]')).not.toBeNull()
    expect(document.querySelector('[data-shoe-id="00758"]')).toBeNull()
    fireEvent.click(screen.getAllByRole("button", { name: "조건 지우기" })[0])
    fireEvent.click(within(screen.getByRole("group", { name: "상태" })).getByRole("button", { name: "측면 없음" }))
    expect(document.querySelector('[data-shoe-id="303346"]')).not.toBeNull()
    expect(document.querySelector('[data-shoe-id="303349"]')).toBeNull()
  })

  it("?plus=0: 상태 칩은 없고(신규 값) 검색은 그대로 있다", () => {
    renderAt("case=ready&as=admin&plus=0")
    expect(screen.getByLabelText("검색어")).toBeInTheDocument()
    expect(screen.queryByRole("group", { name: "상태" })).toBeNull()
    expect(document.querySelectorAll("[data-plus]")).toHaveLength(0)
  })

  it("카드 크기: 작게 · 보통 · 크게가 한 줄 카드 수(열 수)를 바꾼다", () => {
    renderAt("case=ready&as=admin")
    const grid = () => document.querySelector("[data-shoe-id]")!.parentElement!
    expect(grid().className).toContain("repeat(9,")
    press("작게")
    expect(grid().className).toContain("repeat(12,")
    expect(cards()).toHaveLength(16)
    press("크게")
    expect(grid().className).toContain("repeat(6,")
  })

  it("열 선택(목록보기): 숨기면 머리가 빠지고 순서는 그대로, 화류번호는 고정", () => {
    renderAt("case=ready&as=admin")
    toList()
    const heads = () => screen.getAllByRole("columnheader").map((h) => h.textContent)
    fireEvent.click(screen.getByRole("button", { name: /열 선택/ }))
    expect(screen.getByRole("checkbox", { name: /화류번호/ })).toBeDisabled()
    fireEvent.click(screen.getByRole("checkbox", { name: "모델명" }))
    expect(heads()).not.toContain("모델명")
    const h = heads()
    expect(h.indexOf("화류번호")).toBeLessThan(h.indexOf("그룹명"))
    expect(h.indexOf("그룹명")).toBeLessThan(h.indexOf("상표코드"))
  })

  it("자동 모드: 강조 카드가 주기대로 옮겨 가고 창은 열리지 않는다 · 주기 변경 · 일시정지/재개 · Space · ← →", () => {
    vi.useFakeTimers()
    renderAt("case=ready&as=admin")
    press("자동")
    expect(current()).toBe("00758")
    tick(2000)
    expect(current()).toBe("303352")
    expect(screen.queryByRole("dialog")).toBeNull()
    press("1초")
    tick(1000)
    expect(current()).toBe("303351")
    key(" ")
    expect(screen.getByRole("button", { name: "재생" })).toBeInTheDocument()
    tick(5000)
    expect(current()).toBe("303351")
    key(" ")
    tick(1000)
    expect(current()).toBe("303349")
    key("ArrowLeft")
    expect(current()).toBe("303351")
    key("ArrowRight")
    expect(current()).toBe("303349")
    expect(screen.queryByRole("dialog")).toBeNull()
  })

  it("초점이 「자동」 버튼에 있어도 ← → 는 동작하고, Space 는 그 버튼 몫이라 화면이 가로채지 않는다(S05 · S06 과 같은 규칙)", () => {
    vi.useFakeTimers()
    renderAt("case=ready&as=admin")
    const autoBtn = screen.getByRole("button", { name: "자동" })
    fireEvent.click(autoBtn)
    autoBtn.focus()
    fireEvent.keyDown(autoBtn, { key: "ArrowRight" })
    expect(current()).toBe("303352")
    fireEvent.keyDown(autoBtn, { key: "ArrowLeft" })
    expect(current()).toBe("00758")
    // Space: 기본 동작(버튼 눌림)을 막지 않고 재생 상태도 바꾸지 않는다
    expect(fireEvent.keyDown(autoBtn, { key: " " })).toBe(true)
    expect(screen.getByRole("button", { name: "일시정지" })).toBeInTheDocument()
    expect(autoBtn).toHaveAttribute("aria-pressed", "true")
  })

  it("초점이 「일시정지/재생」 버튼이면 Space 는 그 버튼이 눌려(브라우저 기본 동작) 재생/일시정지가 한 번만 바뀐다", () => {
    vi.useFakeTimers()
    renderAt("case=ready&as=admin")
    press("자동")
    const pauseBtn = screen.getByRole("button", { name: "일시정지" })
    pauseBtn.focus()
    // 화면은 Space 를 가로채지 않는다 → 브라우저가 버튼을 누른다(jsdom 은 눌림을 흉내 내지 않으므로 click 으로 대신)
    expect(fireEvent.keyDown(pauseBtn, { key: " " })).toBe(true)
    expect(screen.getByRole("button", { name: "일시정지" })).toBeInTheDocument()
    fireEvent.click(pauseBtn)
    expect(screen.getByRole("button", { name: "재생" })).toBeInTheDocument()
    tick(5000)
    expect(current()).toBe("00758")
    fireEvent.click(screen.getByRole("button", { name: "재생" }))
    tick(2000)
    expect(current()).toBe("303352")
  })

  it("보조키(Alt+← = 뒤로 · Ctrl · Meta)와 이미 처리된 키는 가로채지 않는다", () => {
    vi.useFakeTimers()
    renderAt("case=ready&as=admin")
    press("자동")
    tick(2000)
    expect(current()).toBe("303352")
    expect(fireEvent.keyDown(document.body, { key: "ArrowLeft", altKey: true })).toBe(true)
    fireEvent.keyDown(document.body, { key: "ArrowRight", ctrlKey: true })
    fireEvent.keyDown(document.body, { key: "ArrowRight", metaKey: true })
    fireEvent.keyDown(document.body, { key: " ", altKey: true })
    expect(current()).toBe("303352")
    expect(screen.getByRole("button", { name: "일시정지" })).toBeInTheDocument()
    // 앞선 듣개가 이미 처리(preventDefault)한 키
    const stop = (e: Event) => e.preventDefault()
    document.body.addEventListener("keydown", stop)
    try {
      fireEvent.keyDown(document.body, { key: "ArrowRight" })
      expect(current()).toBe("303352")
    } finally {
      document.body.removeEventListener("keydown", stop)
    }
  })

  it("초점이 「재생/일시정지」 버튼에 있을 때도 ← → 가 동작한다", () => {
    vi.useFakeTimers()
    renderAt("case=ready&as=admin")
    press("자동")
    const play = screen.getByRole("button", { name: "일시정지" })
    play.focus()
    fireEvent.keyDown(play, { key: "ArrowRight" })
    expect(current()).toBe("303352")
  })

  it("Enter 가 강조된 카드의 창을 연다(자동 넘기기는 열지 않는다)", () => {
    vi.useFakeTimers()
    renderAt("case=ready&as=admin")
    press("자동")
    tick(2000)
    key("Enter")
    expect(within(screen.getByRole("dialog")).getByLabelText("신발ID")).toHaveValue("303352")
  })

  it("카드 위에 마우스가 있으면 멈추고, 벗어나면 이어 간다", () => {
    vi.useFakeTimers()
    renderAt("case=ready&as=admin")
    press("자동")
    const grid = document.querySelector("[data-shoe-id]")!.parentElement!
    fireEvent.mouseEnter(grid)
    tick(6000)
    expect(current()).toBe("00758")
    fireEvent.mouseLeave(grid)
    tick(2000)
    expect(current()).toBe("303352")
  })

  it("쪽 끝에서 다음 쪽으로 넘어간다", () => {
    vi.useFakeTimers()
    renderAt("case=ready&as=admin")
    press("자동")
    press("1초")
    press("간격 0.5초 줄이기")
    tick(500 * 16)
    expect(screen.getByText(/전체 536 중 17-32/)).toBeInTheDocument()
  })

  it("자동 모드에서 조건을 바꾸면 강조 위치가 처음으로 돌아가고 자동은 유지된다", () => {
    vi.useFakeTimers()
    renderAt("case=ready&as=admin")
    press("자동")
    tick(2000 * 3)
    expect(current()).toBe("303349")
    search("30335")
    expect(current()).toBe(Array.from(cards())[0].getAttribute("data-shoe-id"))
    expect(screen.getByText(/^1 \/ \d+$/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "일시정지" })).toBeInTheDocument()
  })

  it("자동 모드에서 쪽 넘김을 누르면 그 쪽 첫 카드부터 이어 간다", () => {
    vi.useFakeTimers()
    renderAt("case=ready&as=admin")
    press("자동")
    tick(2000)
    fireEvent.click(screen.getByRole("button", { name: /다음/ }))
    expect(screen.getByText(/전체 536 중 17-32/)).toBeInTheDocument()
    expect(screen.getByText("17 / 536")).toBeInTheDocument()
    expect(current()).toBe(cards()[0].getAttribute("data-shoe-id"))
  })

  it("창이 열려 있는 동안 자동 넘기기는 멈추고, 닫으면 이어 간다", () => {
    vi.useFakeTimers()
    renderAt("case=ready&as=admin")
    press("자동")
    tick(2000)
    expect(current()).toBe("303352")
    fireEvent.click(document.querySelector('[data-shoe-id="303352"]')!)
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    tick(10000)
    fireEvent.click(within(screen.getByRole("dialog")).getAllByRole("button", { name: "닫기" })[0])
    expect(screen.queryByRole("dialog")).toBeNull()
    expect(current()).toBe("303352")
    tick(2000)
    expect(current()).toBe("303351")
  })

  it("마지막 카드에서 멈춘다", () => {
    vi.useFakeTimers()
    renderAt("case=ready&as=admin")
    search("30335")
    const n = cards().length
    expect(n).toBeGreaterThan(1)
    press("자동")
    press("1초")
    tick(1000 * (n + 3))
    expect(current()).toBe(Array.from(cards())[n - 1].getAttribute("data-shoe-id"))
    expect(screen.getByRole("button", { name: "재생" })).toBeInTheDocument()
    expect(screen.getByText(`${n} / ${n}`)).toBeInTheDocument()
  })

  it("글자 칸에서는 Space · 방향키를 가로채지 않고, 화면을 떠나면 타이머가 0개", () => {
    vi.useFakeTimers()
    const { unmount } = renderAt("case=ready&as=admin")
    press("자동")
    fireEvent.keyDown(screen.getByLabelText("검색어"), { key: " " })
    expect(screen.getByRole("button", { name: "일시정지" })).toBeInTheDocument()
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  it("수동으로 돌리면 타이머가 멈춘다", () => {
    vi.useFakeTimers()
    renderAt("case=ready&as=admin")
    press("자동")
    press("수동")
    tick(10000)
    expect(vi.getTimerCount()).toBe(0)
    expect(current()).toBeUndefined()
  })
})
