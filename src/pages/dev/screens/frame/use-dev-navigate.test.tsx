import { act, renderHook } from "@testing-library/react"
import { MemoryRouter, useLocation } from "react-router-dom"
import { describe, expect, it } from "vitest"

import { useDevNavigate } from "./use-dev-navigate"

function setup(url: string) {
  return renderHook(
    () => {
      const to = useDevNavigate()
      const loc = useLocation()
      return { to, loc }
    },
    { wrapper: ({ children }) => <MemoryRouter initialEntries={[url]}>{children}</MemoryRouter> },
  )
}

describe("useDevNavigate", () => {
  it("보는 사람(as)을 유지하고 추가 쿼리를 붙인다", () => {
    const { result } = setup("/dev/s01?as=readonly&case=error")
    act(() => result.current.to("/dev/s02", { id: "00001-25-0649" }))
    expect(result.current.loc.pathname).toBe("/dev/s02")
    const q = new URLSearchParams(result.current.loc.search)
    expect(q.get("as")).toBe("readonly")
    expect(q.get("id")).toBe("00001-25-0649")
    expect(q.get("case")).toBeNull()
  })

  it("plus=0 도 유지한다(1 이나 없음은 붙이지 않는다)", () => {
    const off = setup("/dev/s01?plus=0")
    act(() => off.result.current.to("/dev/s02"))
    expect(new URLSearchParams(off.result.current.loc.search).get("plus")).toBe("0")
    const on = setup("/dev/s01?plus=1")
    act(() => on.result.current.to("/dev/s02"))
    expect(on.result.current.loc.search).toBe("")
  })

  it("as 가 없으면 쿼리 없이 옮긴다", () => {
    const { result } = setup("/dev/s01")
    act(() => result.current.to("/dev/s05"))
    expect(result.current.loc.pathname).toBe("/dev/s05")
    expect(result.current.loc.search).toBe("")
  })
})
