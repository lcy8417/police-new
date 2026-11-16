import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it } from "vitest"

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
})
