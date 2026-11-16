import { fireEvent, render, screen, within } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

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
      expect(screen.getByText("중복 의심")).toBeInTheDocument()
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
