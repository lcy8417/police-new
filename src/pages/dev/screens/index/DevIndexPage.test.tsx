import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it } from "vitest"

import { DEV_SCREENS } from "../frame"
import { DevIndexPage } from "./DevIndexPage"

describe("DevIndexPage", () => {
  it("화면 11개 링크를 그린다", () => {
    render(
      <MemoryRouter>
        <DevIndexPage />
      </MemoryRouter>,
    )
    const links = screen
      .getAllByRole("link")
      .map((a) => a.getAttribute("href"))
      .filter((h): h is string => /^\/dev\/s\d\d$/.test(h ?? ""))
    expect(links).toHaveLength(11)
    expect(links).toContain("/dev/s01")
    expect(links).toContain("/dev/s14")
  })

  it("화면마다 실제 케이스 링크를 그린다", () => {
    render(
      <MemoryRouter>
        <DevIndexPage />
      </MemoryRouter>,
    )
    for (const s of DEV_SCREENS) {
      for (const c of s.cases) {
        expect(screen.getByRole("link", { name: `${s.screen} ${c}` })).toHaveAttribute("href", `/dev/${s.id}?case=${c}`)
      }
    }
    // 화면에 없는 케이스는 링크도 없다
    expect(screen.queryByRole("link", { name: "S02 empty" })).toBeNull()
    expect(screen.getByRole("link", { name: "S00 password-change" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "S03 denoise-failed" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "S14 exact-page" })).toBeInTheDocument()
  })

  it("보는 사람(as)을 화면 · 케이스 링크에 싣는다", () => {
    render(
      <MemoryRouter initialEntries={["/dev?as=readonly"]}>
        <DevIndexPage />
      </MemoryRouter>,
    )
    expect(screen.getByRole("link", { name: "S06 no-alignment" })).toHaveAttribute("href", "/dev/s06?case=no-alignment&as=readonly")
    expect(screen.getByRole("link", { name: /로그인/ })).toHaveAttribute("href", "/dev/s00?as=readonly")
  })
})
