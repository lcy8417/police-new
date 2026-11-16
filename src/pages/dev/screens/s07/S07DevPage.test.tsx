import { fireEvent, render, screen, within } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it } from "vitest"

import { S07DevPage } from "./S07DevPage"

const renderAt = (query: string) =>
  render(
    <MemoryRouter initialEntries={[`/dev/s07${query}`]}>
      <S07DevPage />
    </MemoryRouter>
  )

const block = (aprthngNo: string) => screen.getByText(aprthngNo, { selector: "[data-block-title]" }).closest("[data-image-block]") as HTMLElement

describe("S07 검색결과 확인 진열 페이지", () => {
  it("ready 케이스에 이미지 블록마다 RadioRow 「발견」 · 「불발견」을 그린다", () => {
    renderAt("?case=ready")
    const blocks = document.querySelectorAll("[data-image-block]")
    expect(blocks).toHaveLength(3)
    blocks.forEach((b) => {
      const group = within(b as HTMLElement).getByRole("radiogroup")
      expect(group).toHaveAttribute("data-part", "RadioRow")
      expect(within(group).getAllByRole("radio").map((r) => r.textContent?.replace(/[◉○]\s*/, ""))).toEqual(["발견", "불발견"])
    })
  })

  it("S06 에서 넘어온 확인대상 신발 번호를 앞자리 0 그대로 보인다", () => {
    renderAt("?case=ready&ftwr=00758")
    expect(within(block("00001-25-0646_1")).getByText("No. 00758")).toBeInTheDocument()
  })

  it("판정을 고르고 「결과확인완료」를 누르면 이력에 한 줄이 쌓인다(제어형)", () => {
    renderAt("?case=ready&ftwr=00758&as=investigator")
    const b = block("00001-25-0646_1")
    const save = within(b).getByRole("button", { name: "결과확인완료" })
    expect(save).toBeDisabled()
    fireEvent.click(within(b).getByRole("radio", { name: /^발견/ }))
    expect(within(b).getByRole("radio", { name: /^발견/ })).toHaveAttribute("aria-checked", "true")
    expect(save).toBeEnabled()
    const before = within(b).getAllByRole("row").length
    fireEvent.click(save)
    expect(within(b).getAllByRole("row")).toHaveLength(before + 1)
    expect(within(b).getAllByText("00758").length).toBeGreaterThan(0)
  })

  it("확인대상이 없는 블록은 「확인대상 없음」이고 판정을 고를 수 없다", () => {
    renderAt("?case=ready")
    const b = block("00001-25-0646_3")
    expect(within(b).getByText("확인대상 없음")).toBeInTheDocument()
    within(b)
      .getAllByRole("radio")
      .forEach((r) => expect(r).toBeDisabled())
  })

  it("loading 케이스는 aria-busy=\"true\"", () => {
    const { container } = renderAt("?case=loading")
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
    expect(document.querySelector("[data-image-block]")).toBeNull()
  })

  it("error 케이스는 「다시」 버튼이 있고 「결과 없음」이 없다", () => {
    renderAt("?case=error")
    expect(screen.getByRole("button", { name: "다시" })).toBeInTheDocument()
    expect(screen.queryByText(/결과 없음/)).toBeNull()
    expect(document.querySelector("[data-image-block]")).toBeNull()
  })

  it("empty 케이스는 「결과 없음」을 보인다", () => {
    renderAt("?case=empty")
    expect(screen.getByText(/결과 없음/)).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "다시" })).toBeNull()
  })

  it("readonly 보기에서 라디오와 「결과확인완료」가 disabled", () => {
    renderAt("?case=ready&as=readonly")
    screen.getAllByRole("radio").forEach((r) => expect(r).toBeDisabled())
    screen.getAllByRole("button", { name: "결과확인완료" }).forEach((b) => expect(b).toBeDisabled())
  })

  it("시안의 감정불능 · AI 추천 · 교차 검증 요청 · 판정 메모는 담지 않는다", () => {
    renderAt("?case=ready")
    expect(screen.queryByText(/감정불능/)).toBeNull()
    expect(screen.queryByText(/AI 추천/)).toBeNull()
    expect(screen.queryByText(/교차 검증/)).toBeNull()
    expect(screen.queryByText(/판정 메모/)).toBeNull()
  })
})
