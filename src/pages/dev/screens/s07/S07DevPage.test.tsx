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
  it("ready 케이스에 이미지 블록마다 RadioRow 「발견」 · 「불발견」을 그린다(신규 기능 끔 — 1차 그대로)", () => {
    renderAt("?case=ready&plus=0")
    const blocks = document.querySelectorAll("[data-image-block]")
    expect(blocks).toHaveLength(3)
    blocks.forEach((b) => {
      const group = within(b as HTMLElement).getByRole("radiogroup")
      expect(group).toHaveAttribute("data-part", "RadioRow")
      expect(within(group).getAllByRole("radio").map((r) => r.textContent?.replace(/[◉○]\s*/, ""))).toEqual(["발견", "불발견"])
    })
  })

  it("S06 에서 넘어온 확인대상 신발 번호를 앞자리 0 그대로 보인다", () => {
    const a = renderAt("?case=ready&ftwr=00758&plus=0")
    expect(within(block("00001-25-0646_1")).getByText("No. 00758")).toBeInTheDocument()
    a.unmount()
    // +α 확인대상 상자(시안 카드)도 같은 번호
    renderAt("?case=ready&ftwr=00758")
    const best = block("00001-25-0646_1").querySelector("[data-best-candidate]") as HTMLElement
    expect(within(best).getByText("00758")).toBeInTheDocument()
  })

  it("판정을 고르고 「결과확인완료」를 누르면 이력에 한 줄이 쌓인다(제어형)", () => {
    renderAt("?case=ready&ftwr=00758&as=analyst")
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

  it("readonly 보기에서 라디오와 「결과확인완료」가 disabled(신규 기능 끔 — 1차 그대로)", () => {
    renderAt("?case=ready&as=readonly&plus=0")
    screen.getAllByRole("radio").forEach((r) => expect(r).toBeDisabled())
    screen.getAllByRole("button", { name: "결과확인완료" }).forEach((b) => expect(b).toBeDisabled())
  })

  it("?plus=0 이면 [data-plus] 가 하나도 없고 감정불능 · AI 추천 · 교차 검증 · 판정 메모도 없다(1차 그대로)", () => {
    renderAt("?case=ready&plus=0")
    expect(document.querySelectorAll("[data-plus]")).toHaveLength(0)
    expect(screen.queryByText(/감정불능/)).toBeNull()
    expect(screen.queryByText(/AI 추천/)).toBeNull()
    expect(screen.queryByText(/교차 검증/)).toBeNull()
    expect(screen.queryByPlaceholderText(/판정 메모/)).toBeNull()
    expect(document.querySelectorAll("[data-image-block]")).toHaveLength(3)
    expect(screen.getAllByRole("button", { name: "결과확인완료" })).toHaveLength(3)
  })
})

describe("S07 r2 — 시안 +α", () => {
  it("대표 +α 가 시안 문구로 보인다(AI 추천 · 이미지별 근거 · 결과확인완료 2 / 3 · 이력표 SCAS 열)", () => {
    renderAt("?case=ready&as=analyst")
    expect(within(block("00001-25-0646_1")).getByText("AI 추천 · 발견")).toBeInTheDocument()
    expect(within(block("00001-25-0646_2")).getByText("AI 추천 · 불발견")).toBeInTheDocument()
    expect(within(block("00001-25-0646_3")).getByText("AI 추천 · 감정불능")).toBeInTheDocument()
    // 이미지별 근거: 첫 확인대상 한 쌍 + 대조 87%, 확인대상 없는 블록은 근거 2줄
    expect(within(block("00001-25-0646_1")).getByText("대조 87%")).toBeInTheDocument()
    expect(within(block("00001-25-0646_1")).getByText("AI ↑ 14→2위")).toBeInTheDocument()
    expect(within(block("00001-25-0646_2")).getByText("후보 1,204건 중 가장 비슷한 것도 41.3% — 기준 50% 미만")).toBeInTheDocument()
    expect(within(block("00001-25-0646_3")).getByText("남은 면적 30%")).toBeInTheDocument()
    const strip = document.querySelector("[data-progress-strip]") as HTMLElement
    expect(within(strip).getByText("2 / 3")).toBeInTheDocument()
    expect(within(strip).getByText("_1 확인 중")).toBeInTheDocument()
    // 이력표: 시안 SCAS 열 뒤에 지금 기능 열(순위 · 매칭 신발)
    const headers = within(block("00001-25-0646_1")).getAllByRole("columnheader").map((h) => h.textContent)
    expect(headers).toEqual(["☑", "검색번호", "검색방법", "진행상태", "결과수", "검색일", "순위", "매칭 신발"])
    expect(within(block("00001-25-0646_1")).getByText("하이브리드검색")).toBeInTheDocument()
  })

  it("판정 라디오에 감정불능이 더해지고, 결과확인완료된 블록은 「✓ 결과확인완료」로 잠긴다", () => {
    renderAt("?case=ready&as=analyst")
    const b1 = block("00001-25-0646_1")
    expect(within(b1).getAllByRole("radio").map((r) => r.textContent?.replace(/[◉○]\s*/, ""))).toEqual(["발견", "불발견", "감정불능"])
    const b3 = block("00001-25-0646_3")
    expect(within(b3).getByRole("radio", { name: /감정불능/ })).toHaveAttribute("aria-checked", "true")
    expect(within(b3).getByRole("button", { name: "✓ 결과확인완료" })).toBeDisabled()
  })

  it("_1 판정 저장 → 결과확인완료 3 / 3 · 교차 검증 요청이 켜진다(저장 묶음은 1차 그대로)", () => {
    renderAt("?case=ready&ftwr=00758&as=analyst")
    const request = screen.getByRole("button", { name: "교차 검증 요청" })
    expect(request).toBeDisabled()
    expect(screen.getByText("_1 완료 후 켜짐 · 본인은 고를 수 없음")).toBeInTheDocument()
    const b1 = block("00001-25-0646_1")
    fireEvent.click(within(b1).getByRole("radio", { name: /^발견/ }))
    fireEvent.click(within(b1).getByRole("button", { name: "결과확인완료" }))
    expect(document.querySelector("[data-progress-strip]")?.textContent).toContain("결과확인완료 3 / 3")
    expect(within(block("00001-25-0646_1")).getByRole("button", { name: "✓ 결과확인완료" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "교차 검증 요청" })).toBeEnabled()
  })

  it("보는 사람 — 감정관은 결과확인완료 · 확인 막대 · 교차 검증, 기술책임자는 「읽기 전용」 칩만", () => {
    const a = renderAt("?case=ready&as=analyst")
    expect(within(block("00001-25-0646_1")).getByText("확인대상을 저장하시겠습니까?")).toBeInTheDocument()
    expect(screen.getByText("교차 검증자")).toBeInTheDocument()
    expect(screen.queryByText("기술책임자: 읽기 전용")).toBeNull()
    a.unmount()

    renderAt("?case=ready&as=verifier")
    expect(screen.getByText("기술책임자: 읽기 전용")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "결과확인완료" })).toBeNull()
    expect(screen.queryByRole("button", { name: "교차 검증 요청" })).toBeNull()
    expect(screen.queryByText("확인대상을 저장하시겠습니까?")).toBeNull()
    within(block("00001-25-0646_1"))
      .getAllByRole("radio")
      .forEach((r) => expect(r).toBeDisabled())
  })

  it("보는 사람 — 수사관에게는 「판정은 결재완료 뒤 공개」", () => {
    renderAt("?case=ready&as=investigator")
    expect(screen.getByText("수사관: 판정은 결재완료 뒤 공개")).toBeInTheDocument()
    expect(screen.queryByText("기술책임자: 읽기 전용")).toBeNull()
  })

  it("움직임 줄이기: 움직임은 모두 motion-safe: 로만(진행 막대 반짝임 · 훑기 선), 진행 막대는 목표 폭", () => {
    renderAt("?case=ready&as=analyst")
    const animated = Array.from(document.querySelectorAll('[class*="animate-"]')).flatMap((el) =>
      String(el.getAttribute("class"))
        .split(/\s+/)
        .filter((c) => c.includes("animate-")),
    )
    expect(animated.length).toBeGreaterThan(0)
    expect(animated.every((c) => c.startsWith("motion-safe:"))).toBe(true)
    const bar = document.querySelector('[data-progress-strip] [data-part="AiProgress"]') as HTMLElement
    expect(bar).toHaveAttribute("aria-valuenow", "67")
    expect((bar.querySelector("i") as HTMLElement).style.width).toMatch(/^66\.6/)
    expect(block("00001-25-0646_1").querySelector('[data-part="ScanOverlay"]')).not.toBeNull()
  })
})
