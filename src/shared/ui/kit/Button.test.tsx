import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Button } from "./Button"

describe("Button", () => {
  it("루트에 부품 표식을 붙인다", () => {
    render(<Button variant="pri">조회</Button>)
    const el = screen.getByRole("button")
    expect(el).toHaveAttribute("data-part", "Button")
    expect(el).toHaveAttribute("data-part-variant", "pri")
    expect(el).not.toHaveAttribute("data-part-state")
  })

  it("작은 크기는 변형 이름에 sm 이 붙는다", () => {
    render(
      <>
        <Button size="sm">초기화</Button>
        <Button size="sm" variant="ok">
          검색
        </Button>
      </>,
    )
    const [plain, ok] = screen.getAllByRole("button")
    expect(plain).toHaveAttribute("data-part-variant", "sm")
    expect(ok).toHaveAttribute("data-part-variant", "sm-ok")
  })

  it("기본 변형은 변형 속성이 없다", () => {
    render(<Button>확인</Button>)
    expect(screen.getByRole("button")).not.toHaveAttribute("data-part-variant")
  })

  it("locked 면 비활성 + 상태 locked", () => {
    render(<Button locked>수정</Button>)
    const el = screen.getByRole("button")
    expect(el).toBeDisabled()
    expect(el).toHaveAttribute("data-part-state", "locked")
  })

  it("partId 는 data-part-id 로", () => {
    render(<Button partId="S01-02">등록</Button>)
    expect(screen.getByRole("button")).toHaveAttribute("data-part-id", "S01-02")
  })

  it("asChild 로 링크를 감싸면 a 에 표식이 붙는다", () => {
    render(
      <Button asChild>
        <a href="/x">이동</a>
      </Button>,
    )
    const link = screen.getByRole("link")
    expect(link).toHaveAttribute("data-part", "Button")
    expect(link).toHaveAttribute("href", "/x")
  })

  it("data-part-variant 를 직접 넘기면 그 값이 우선", () => {
    render(<Button size="sm" data-part-variant="sm-h26">검색</Button>)
    expect(screen.getByRole("button")).toHaveAttribute("data-part-variant", "sm-h26")
  })
})
