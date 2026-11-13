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

  it("sm-h26 · sm-h22 크기는 시안 변형 이름 그대로", () => {
    render(
      <>
        <Button size="sm-h26">검색</Button>
        <Button size="sm-h22">적용</Button>
      </>,
    )
    const [a, b] = screen.getAllByRole("button")
    expect(a).toHaveAttribute("data-part-variant", "sm-h26")
    expect(b).toHaveAttribute("data-part-variant", "sm-h22")
  })

  it("row 는 변형 이름 끝에 -row 가 붙는다", () => {
    render(
      <>
        <Button variant="ok" size="sm" row>
          검색
        </Button>
        <Button variant="warn" size="sm" row>
          검증
        </Button>
      </>,
    )
    const [ok, warn] = screen.getAllByRole("button")
    expect(ok).toHaveAttribute("data-part-variant", "sm-ok-row")
    expect(warn).toHaveAttribute("data-part-variant", "sm-warn-row")
  })

  it("roleLock 은 상태 role-lock 이고 비활성은 아니다", () => {
    render(<Button roleLock>수정</Button>)
    const el = screen.getByRole("button")
    expect(el).toHaveAttribute("data-part-state", "role-lock")
    expect(el).not.toBeDisabled()
  })
})
