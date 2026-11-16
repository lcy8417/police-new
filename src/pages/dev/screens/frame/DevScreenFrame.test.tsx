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
})
