import { render, renderHook, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it } from "vitest"

import { DevScreenFrame } from "./DevScreenFrame"
import { DEV_VIEWERS, useDevViewer } from "./dev-viewers"
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

  it("기본은 investigator", () => {
    const { result } = renderHook(() => useDevViewer(), { wrapper: wrap("/dev/s01") })
    expect(result.current).toBe(DEV_VIEWERS.investigator)
    expect(result.current.features).toEqual(["CRIME_REGISTER", "CRIME_SEARCH", "SHOE_VIEW"])
  })

  it("?as=admin이면 관리자", () => {
    const { result } = renderHook(() => useDevViewer(), { wrapper: wrap("/dev/s01?as=admin") })
    expect(result.current.isAdmin).toBe(true)
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
    expect(screen.getByRole("link", { name: "사건 상세" })).toHaveAttribute("href", "/dev/s02")
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
    expect(screen.queryByRole("link", { name: "정밀 대조" })).toBeNull()
    expect(screen.getByRole("link", { name: "신발 DB" })).toHaveAttribute("href", "/dev/s10?as=readonly")
  })

  it("수사관은 사건 화면과 신발 DB 를 본다", () => {
    renderAt("/dev/s01?as=investigator")
    expect(screen.getByRole("link", { name: "정밀 대조" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "신발 DB" })).toBeInTheDocument()
  })
})
