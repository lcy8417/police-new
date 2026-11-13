import { render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Button } from "../kit"
import { ButtonBar } from "./ButtonBar"
import { Panel } from "./Panel"

describe("Panel", () => {
  it("루트에 부품 표식과 기본 변형을 붙인다", () => {
    const { container } = render(<Panel title="검색 조건">내용</Panel>)
    const root = container.firstElementChild as HTMLElement
    expect(root).toHaveAttribute("data-part", "Panel")
    expect(root).toHaveAttribute("data-part-variant", "default")
  })

  it("제목은 h2 제목 역할이다", () => {
    render(<Panel title="검색 조건">내용</Panel>)
    expect(screen.getByRole("heading", { name: "검색 조건", level: 2 })).toBeInTheDocument()
  })

  it("actions 는 머리(header) 안에 놓인다", () => {
    const { container } = render(
      <Panel
        title="검색 조건"
        actions={
          <ButtonBar>
            <Button>조회</Button>
          </ButtonBar>
        }
      >
        내용
      </Panel>
    )
    const header = container.querySelector('[data-part="Panel"] header') as HTMLElement
    expect(header).not.toBeNull()
    expect(within(header).getByRole("button", { name: "조회" })).toBeInTheDocument()
  })

  it("label 은 머리 안 작은 영문 라벨", () => {
    const { container } = render(
      <Panel title="검색 조건" label="SEARCH">
        내용
      </Panel>
    )
    expect(container.querySelector("header")).toHaveTextContent("SEARCH")
  })

  it("corners 이면 변형 tc", () => {
    const { container } = render(
      <Panel title="목록" corners>
        내용
      </Panel>
    )
    expect(container.firstElementChild).toHaveAttribute("data-part-variant", "tc")
  })

  it("variant 로 default-pad 를 고른다", () => {
    const { container } = render(<Panel variant="default-pad">내용</Panel>)
    expect(container.firstElementChild).toHaveAttribute("data-part-variant", "default-pad")
  })

  it("제목 · 라벨 · actions 가 모두 없으면 머리를 그리지 않는다", () => {
    const { container } = render(<Panel>내용</Panel>)
    expect(container.querySelector("header")).toBeNull()
    expect(screen.getByText("내용")).toBeInTheDocument()
  })

  it("partId 는 data-part-id 로", () => {
    const { container } = render(<Panel partId="S02-17">내용</Panel>)
    expect(container.firstElementChild).toHaveAttribute("data-part-id", "S02-17")
  })
})
