import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it } from "vitest"

import { PartsGalleryPage } from "./PartsGalleryPage"

function renderAt(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <PartsGalleryPage />
    </MemoryRouter>
  )
}

describe("진열 화면의 S01 조립 예시", () => {
  it("전체 진열에는 조립 예시 절이 있고 부품 5종으로 그려진다", () => {
    const { container } = renderAt("/dev/parts")
    const section = screen.getByRole("heading", { name: "S01 조립 예시" }).closest("section") as HTMLElement
    for (const part of ["Panel", "ButtonBar", "Button", "Field", "Chip"]) {
      expect(section.querySelector(`[data-part="${part}"]`), part).not.toBeNull()
    }
    // 대조 대상이 아니므로 data-part-id 가 하나도 없다
    expect(section.querySelector("[data-part-id]")).toBeNull()
    expect(section.hasAttribute("data-fixture-id")).toBe(false)
    expect(container.querySelectorAll("[data-fixture-id]").length).toBeGreaterThan(0)
  })

  it("?id= 로 하나만 열 때는 조립 예시를 그리지 않는다", () => {
    renderAt("/dev/parts?id=S02-21")
    expect(screen.queryByRole("heading", { name: "S01 조립 예시" })).toBeNull()
  })
})
