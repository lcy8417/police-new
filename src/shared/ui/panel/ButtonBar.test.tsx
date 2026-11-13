import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Button } from "../kit"
import { ButtonBar } from "./ButtonBar"

describe("ButtonBar", () => {
  it("자식 순서를 그대로 유지한다", () => {
    render(
      <ButtonBar>
        <Button>이전</Button>
        <Button>다음</Button>
        <Button>닫기</Button>
      </ButtonBar>
    )
    expect(screen.getAllByRole("button").map((b) => b.textContent)).toEqual(["이전", "다음", "닫기"])
  })

  it("루트에 부품 표식과 기본 변형 panel-head 를 붙인다", () => {
    const { container } = render(
      <ButtonBar>
        <Button>조회</Button>
      </ButtonBar>
    )
    const root = container.firstElementChild as HTMLElement
    expect(root).toHaveAttribute("data-part", "ButtonBar")
    expect(root).toHaveAttribute("data-part-variant", "panel-head")
  })

  it("variant 로 modal-head 를 고른다", () => {
    const { container } = render(
      <ButtonBar variant="modal-head">
        <Button>닫기</Button>
      </ButtonBar>
    )
    expect(container.firstElementChild).toHaveAttribute("data-part-variant", "modal-head")
  })

  it("partId 는 data-part-id 로", () => {
    const { container } = render(
      <ButtonBar partId="S01-16">
        <Button>조회</Button>
      </ButtonBar>
    )
    expect(container.firstElementChild).toHaveAttribute("data-part-id", "S01-16")
  })
})
