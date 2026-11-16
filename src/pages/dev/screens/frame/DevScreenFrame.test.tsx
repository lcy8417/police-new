import { render, renderHook, screen, within } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it } from "vitest"

import { DevScreenFrame } from "./DevScreenFrame"
import { DEV_SCREENS } from "./dev-screens"
import { DEV_VIEWERS, useDevPlus, useDevViewer } from "./dev-viewers"
import { useDevCase } from "./use-dev-case"

const wrap = (url: string) =>
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <MemoryRouter initialEntries={[url]}>{children}</MemoryRouter>
  }

describe("useDevCase", () => {
  const CASES = ["ready", "loading", "error", "empty"] as const

  it("?case=error면 useDevCase가 error를 준다", () => {
    const { result } = renderHook(() => useDevCase(CASES, "ready"), { wrapper: wrap("/dev/s01?case=error") })
    expect(result.current).toBe("error")
  })

  it("없는 case 값이면 fallback", () => {
    const { result } = renderHook(() => useDevCase(CASES, "ready"), { wrapper: wrap("/dev/s01?case=nope") })
    expect(result.current).toBe("ready")
  })

  it("case 가 없으면 fallback", () => {
    const { result } = renderHook(() => useDevCase(CASES, "empty"), { wrapper: wrap("/dev/s01") })
    expect(result.current).toBe("empty")
  })
})

describe("useDevViewer", () => {
  it("?as=readonly면 features가 SHOE_VIEW만", () => {
    const { result } = renderHook(() => useDevViewer(), { wrapper: wrap("/dev/s01?as=readonly") })
    expect(result.current.features).toEqual(["SHOE_VIEW"])
    expect(result.current.isAdmin).toBe(false)
  })

  it("기본은 화면 기본 역할(감정관), 사용자 화면은 관리자", () => {
    const s01 = renderHook(() => useDevViewer(), { wrapper: wrap("/dev/s01") })
    expect(s01.result.current).toBe(DEV_VIEWERS.analyst)
    const s13 = renderHook(() => useDevViewer(), { wrapper: wrap("/dev/s13") })
    expect(s13.result.current).toBe(DEV_VIEWERS.admin)
  })

  it("역할 5종의 features", () => {
    expect(DEV_VIEWERS.investigator.features).toEqual(["CRIME_REGISTER", "CASE_STATUS_VIEW", "REPORT_VIEW"])
    expect(DEV_VIEWERS.analyst.features).toEqual([
      "CRIME_REGISTER", "CRIME_SEARCH", "SHOE_VIEW", "SHOE_EDIT", "CASE_STATUS_VIEW", "REPORT_VIEW",
      "EXAM_DECIDE", "CROSS_REVIEW", "REPORT_WRITE", "SHOE_COLLECT_REVIEW",
    ])
    expect(DEV_VIEWERS.verifier.features).toEqual([
      "CRIME_SEARCH", "SHOE_VIEW", "CASE_STATUS_VIEW", "REPORT_VIEW", "REPORT_APPROVE", "REPORT_SEND",
    ])
    expect(DEV_VIEWERS.analyst.label).toBe("감정관")
    expect(DEV_VIEWERS.verifier.who).toBe("최○○ 경감")
  })

  it("화면 기본 역할: S13 · S14 는 admin, 나머지는 analyst", () => {
    for (const s of DEV_SCREENS) expect(s.defaultViewer).toBe(s.id === "s13" || s.id === "s14" ? "admin" : "analyst")
  })

  it("?as=admin이면 관리자", () => {
    const { result } = renderHook(() => useDevViewer(), { wrapper: wrap("/dev/s01?as=admin") })
    expect(result.current.isAdmin).toBe(true)
  })
})

describe("useDevPlus", () => {
  it("?plus=0 이면 false, 그 외 true", () => {
    expect(renderHook(() => useDevPlus(), { wrapper: wrap("/dev/s01?plus=0") }).result.current).toBe(false)
    expect(renderHook(() => useDevPlus(), { wrapper: wrap("/dev/s01") }).result.current).toBe(true)
    expect(renderHook(() => useDevPlus(), { wrapper: wrap("/dev/s01?plus=1") }).result.current).toBe(true)
  })
})

describe("DevScreenFrame", () => {
  it("전환 막대와 셸 안에 본문을 그린다", () => {
    render(
      <MemoryRouter initialEntries={["/dev/s01?case=error"]}>
        <DevScreenFrame screen="S01" title="사건관리" cases={["ready", "error"]}>
          <p>본문</p>
        </DevScreenFrame>
      </MemoryRouter>,
    )
    expect(screen.getByText("본문")).toBeInTheDocument()
    expect(document.querySelector('[data-part="ScasShell"]')).not.toBeNull()
    expect(screen.getByRole("link", { name: "error" })).toHaveAttribute("aria-current", "true")
    expect(screen.getByRole("link", { name: "ready" })).toHaveAttribute("href", "/dev/s01?case=ready")
  })

  it("bare면 셸 없이 그린다", () => {
    render(
      <MemoryRouter initialEntries={["/dev/s00"]}>
        <DevScreenFrame screen="S00" title="로그인" cases={["ready"]} bare>
          <p>로그인</p>
        </DevScreenFrame>
      </MemoryRouter>,
    )
    expect(document.querySelector('[data-part="ScasShell"]')).toBeNull()
    expect(screen.getByText("로그인")).toBeInTheDocument()
  })

  const renderAt = (url: string) =>
    render(
      <MemoryRouter initialEntries={[url]}>
        <DevScreenFrame screen="S01" title="사건관리" cases={["ready"]}>
          <p>본문</p>
        </DevScreenFrame>
      </MemoryRouter>,
    )

  it("메뉴 링크가 보는 사람(as)을 유지한다", () => {
    renderAt("/dev/s01?as=admin")
    expect(screen.getByRole("link", { name: "사용자 관리" })).toHaveAttribute("href", "/dev/s13?as=admin")
  })

  it("as 가 없으면 메뉴 링크에 쿼리를 붙이지 않는다", () => {
    renderAt("/dev/s01")
    expect(screen.getByRole("link", { name: "신발 DB" })).toHaveAttribute("href", "/dev/s10")
  })

  // r4 사이드바(2026-11-16 사용자): 진열 화면 나열 대신 업무 메뉴만
  const menuLinks = () => within(screen.getByRole("navigation", { name: "메뉴" })).getAllByRole("link").map((a) => a.textContent)

  it("관리자 사이드바는 4항목: 사건관리 · 신발 DB · 사용자 관리 · 사용 기록", () => {
    renderAt("/dev/s01?as=admin")
    expect(menuLinks()).toEqual(["사건관리", "신발 DB", "사용자 관리", "사용 기록"])
  })

  it("감정관 사이드바는 2항목: 사건관리 · 신발 DB(사건 상세 ~ 결과 확인은 사건 창 안)", () => {
    renderAt("/dev/s01?as=analyst")
    expect(menuLinks()).toEqual(["사건관리", "신발 DB"])
    expect(screen.queryByRole("link", { name: "정밀 대조" })).toBeNull()
  })

  it("S02–S07 진열 화면에서는 사이드바 「사건관리」가 켜지고, 위 막대 제목은 그 화면 이름", () => {
    render(
      <MemoryRouter initialEntries={["/dev/s05"]}>
        <DevScreenFrame screen="S05" title="검색 결과" cases={["ready"]}>
          <p>본문</p>
        </DevScreenFrame>
      </MemoryRouter>,
    )
    expect(screen.getByRole("link", { name: "사건관리" })).toHaveAttribute("aria-current", "page")
    expect(within(screen.getByRole("banner")).getByText("검색 결과")).toBeInTheDocument()
  })

  it("관리 묶음은 관리자에게만 보인다", () => {
    const { unmount } = renderAt("/dev/s01?as=admin")
    expect(screen.getByText("관리")).toBeInTheDocument()
    unmount()
    const second = renderAt("/dev/s01?as=investigator")
    expect(screen.queryByText("관리")).toBeNull()
    second.unmount()
    renderAt("/dev/s01?as=readonly")
    expect(screen.queryByText("관리")).toBeNull()
  })

  it("기능 권한이 없는 메뉴는 숨긴다(보기 전용은 신발 DB 만)", () => {
    renderAt("/dev/s01?as=readonly")
    expect(screen.queryByRole("link", { name: "사건관리" })).toBeNull()
    expect(screen.getByRole("link", { name: "신발 DB" })).toHaveAttribute("href", "/dev/s10?as=readonly")
  })

  it("감정관은 사건관리와 신발 DB 를 본다", () => {
    renderAt("/dev/s01?as=analyst")
    expect(screen.getByRole("link", { name: "사건관리" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "신발 DB" })).toBeInTheDocument()
  })

  it("수사관은 CRIME_SEARCH 가 없어 사건관리 · 신발 DB 가 숨는다", () => {
    renderAt("/dev/s01?as=investigator")
    expect(screen.queryByRole("link", { name: "사건관리" })).toBeNull()
    expect(screen.queryByRole("link", { name: "신발 DB" })).toBeNull()
  })

  it("기본 역할(as 없음)이면 감정관 메뉴", () => {
    renderAt("/dev/s01")
    expect(menuLinks()).toEqual(["사건관리", "신발 DB"])
  })

  it("메뉴 링크가 plus=0 도 유지한다", () => {
    renderAt("/dev/s01?as=admin&plus=0")
    expect(screen.getByRole("link", { name: "사용자 관리" })).toHaveAttribute("href", "/dev/s13?as=admin&plus=0")
  })

  it("막대: 신규 기능 보기 끄기는 as · case 를 유지하고 plus=0 을 붙인다", () => {
    renderAt("/dev/s01?as=verifier&case=error")
    const toggle = screen.getByRole("link", { name: /신규 기능 보기/ })
    expect(toggle).toHaveAttribute("aria-pressed", "true")
    const href = new URLSearchParams(toggle.getAttribute("href")!.split("?")[1])
    expect(href.get("plus")).toBe("0")
    expect(href.get("as")).toBe("verifier")
    expect(href.get("case")).toBe("error")
  })

  it("막대: plus=0 에서는 꺼짐 표시이고 누르면 plus 가 빠진다", () => {
    renderAt("/dev/s01?as=verifier&case=error&plus=0")
    const toggle = screen.getByRole("link", { name: /신규 기능 보기/ })
    expect(toggle).toHaveAttribute("aria-pressed", "false")
    const href = new URLSearchParams(toggle.getAttribute("href")!.split("?")[1])
    expect(href.get("plus")).toBeNull()
    expect(href.get("as")).toBe("verifier")
  })

  it("막대: 보는 사람 링크가 case · plus 를 유지하고 시안 표기(역할 · 이름)를 보인다", () => {
    renderAt("/dev/s01?case=error&plus=0")
    const link = screen.getByRole("link", { name: /감정관/ })
    const href = new URLSearchParams(link.getAttribute("href")!.split("?")[1])
    expect(href.get("as")).toBe("analyst")
    expect(href.get("case")).toBe("error")
    expect(href.get("plus")).toBe("0")
    expect(link).toHaveAttribute("aria-current", "true")
    expect(screen.getByText(/박○○ 경위/)).toBeInTheDocument()
  })
})
