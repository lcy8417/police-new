import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { PageHead } from "./PageHead"

describe("PageHead", () => {
  it("제목은 h3 이고 설명 · 오른쪽 내용을 그린다", () => {
    const { container } = render(
      <PageHead title="사용자 관리" description="사용자와 권한을 관리합니다" actions={<button>추가</button>} />,
    )
    expect(container.firstElementChild).toHaveAttribute("data-part", "PageHead")
    expect(screen.getByRole("heading", { name: "사용자 관리", level: 3 })).toBeInTheDocument()
    expect(screen.getByText("사용자와 권한을 관리합니다")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "추가" })).toBeInTheDocument()
  })

  it("설명이 없으면 설명 줄을 그리지 않는다", () => {
    const { container } = render(<PageHead title="사용자 관리" />)
    expect(container.querySelector("p")).toBeNull()
  })
})
