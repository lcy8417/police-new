import { fireEvent, render, screen, within } from "@testing-library/react"
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom"
import { describe, expect, it } from "vitest"

import { S06DevPage } from "./S06DevPage"

function Where() {
  const { pathname, search } = useLocation()
  return <p data-testid="where">{`${pathname}${search}`}</p>
}

const renderAt = (query: string) =>
  render(
    <MemoryRouter initialEntries={[`/dev/s06${query}`]}>
      <Routes>
        <Route path="/dev/s06" element={<S06DevPage />} />
        <Route path="/dev/s05" element={<Where />} />
        <Route path="/dev/s07" element={<Where />} />
      </Routes>
    </MemoryRouter>
  )

const pairs = (side: "crime" | "shoe") =>
  document.querySelector(`[data-part="PointPairs"][data-part-variant="${side}"]`) as SVGElement | null

const NO_ALIGN = "정렬(ROI+방향)이 설정되지 않았습니다. 먼저 정렬을 저장해 주세요."

describe("S06 상세 조회 · 정밀 대조 진열 페이지", () => {
  it("ready 케이스에 상세조회 머리 · 신발 번호 · Top-10 대응 박스를 양쪽에 그린다", () => {
    renderAt("?case=ready&ftwr=00758&rank=1")
    expect(screen.getByText("현장문양검색결과 상세조회")).toBeInTheDocument()
    expect(screen.getAllByText("No. 00758").length).toBeGreaterThan(0)
    expect(pairs("crime")!.querySelectorAll("[data-pair]")).toHaveLength(10)
    expect(pairs("shoe")!.querySelectorAll("[data-pair]")).toHaveLength(10)
  })

  it("버튼 줄은 SCAS 순서 그대로, 새 「정렬 설정」은 맨 끝", () => {
    renderAt("?case=ready&as=admin")
    const bar = document.querySelector('[data-part="ButtonBar"]') as HTMLElement
    expect(within(bar).getAllByRole("button").map((b) => b.textContent)).toEqual([
      "이전",
      "다음",
      "그룹등록",
      "확인대상",
      "프린트",
      "닫기",
      "정렬 설정",
    ])
  })

  it("대응 목록 행에 마우스를 올리면 양쪽 같은 번호 박스가 active", () => {
    renderAt("?case=ready")
    const row = document.querySelector('[data-pair-row="2"]') as HTMLElement
    fireEvent.mouseEnter(row)
    expect(pairs("crime")!.querySelector('[data-pair="2"]')).toHaveAttribute("data-active", "true")
    expect(pairs("shoe")!.querySelector('[data-pair="2"]')).toHaveAttribute("data-active", "true")
    expect(pairs("crime")!.querySelector('[data-pair="1"]')).not.toHaveAttribute("data-active")
    fireEvent.mouseLeave(row)
    expect(pairs("crime")!.querySelector("[data-active]")).toBeNull()
  })

  it("박스에 마우스를 올려도 목록과 반대쪽이 함께 강조된다", () => {
    renderAt("?case=ready")
    fireEvent.mouseEnter(pairs("shoe")!.querySelector('[data-pair="4"]') as Element)
    expect(pairs("crime")!.querySelector('[data-pair="4"]')).toHaveAttribute("data-active", "true")
    expect(document.querySelector('[data-pair-row="4"]')).toHaveAttribute("data-active", "true")
  })

  it("보기 방식 「RGB」 ↔ 「스케치·이진」 전환", () => {
    renderAt("?case=ready")
    const seg = screen.getByRole("group", { name: "보기 방식" })
    expect(within(seg).getByRole("button", { name: "RGB" })).toHaveAttribute("aria-pressed", "true")
    fireEvent.click(within(seg).getByRole("button", { name: "스케치·이진" }))
    expect(within(seg).getByRole("button", { name: "스케치·이진" })).toHaveAttribute("aria-pressed", "true")
    expect(document.querySelectorAll('[data-match-image][data-look="sketch"]')).toHaveLength(2)
  })

  it("no-alignment 케이스는 정렬 안내와 「정렬 설정하러 가기」를 보이고 대응 박스는 없다", () => {
    renderAt("?case=no-alignment")
    expect(screen.getByText(NO_ALIGN)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "정렬 설정하러 가기" })).toBeInTheDocument()
    expect(pairs("crime")).toBeNull()
  })

  it("정렬 설정 DialogShell 에서 저장하면 대응 매칭이 보인다", () => {
    renderAt("?case=no-alignment&as=analyst")
    fireEvent.click(screen.getByRole("button", { name: "정렬 설정하러 가기" }))
    const dialog = screen.getByRole("dialog")
    expect(dialog).toHaveAttribute("data-part", "DialogShell")
    expect(within(dialog).getByText("정렬 설정")).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole("button", { name: "정렬 저장" }))
    expect(screen.queryByRole("dialog")).toBeNull()
    expect(screen.queryByText(NO_ALIGN)).toBeNull()
    expect(pairs("crime")).not.toBeNull()
  })

  it("「확인대상」은 S07 로, 「닫기」는 S05 로 간다(as 유지)", () => {
    const first = renderAt("?case=ready&ftwr=00758&rank=1&as=admin")
    fireEvent.click(screen.getByRole("button", { name: "확인대상" }))
    expect(screen.getByTestId("where")).toHaveTextContent("/dev/s07?ftwr=00758&as=admin")
    first.unmount()
    renderAt("?case=ready&as=admin")
    fireEvent.click(screen.getByRole("button", { name: "닫기" }))
    expect(screen.getByTestId("where")).toHaveTextContent("/dev/s05?as=admin")
  })

  it("loading 케이스는 aria-busy=\"true\"", () => {
    const { container } = renderAt("?case=loading")
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
    expect(pairs("crime")).toBeNull()
  })

  it("error 케이스는 「다시」 버튼이 있고 「결과 없음」이 없다", () => {
    renderAt("?case=error")
    expect(screen.getByRole("button", { name: "다시" })).toBeInTheDocument()
    expect(screen.queryByText(/결과 없음/)).toBeNull()
    expect(pairs("crime")).toBeNull()
  })

  it("readonly 보기에서 「확인대상」 · 「정렬 저장」이 disabled", () => {
    renderAt("?case=no-alignment&as=readonly")
    expect(screen.getByRole("button", { name: "확인대상" })).toBeDisabled()
    fireEvent.click(screen.getByRole("button", { name: "정렬 설정하러 가기" }))
    expect(within(screen.getByRole("dialog")).getByRole("button", { name: "정렬 저장" })).toBeDisabled()
  })

  it("시안의 +α(대응점 39 · 지표 4개 · 종합 신뢰도 · AI 미리 대조)는 담지 않는다", () => {
    renderAt("?case=ready")
    expect(screen.queryByText(/대응점 39/)).toBeNull()
    expect(screen.queryByText(/Inlier/)).toBeNull()
    expect(screen.queryByText(/종합 신뢰도/)).toBeNull()
    expect(screen.queryByText(/AI가 미리 대조/)).toBeNull()
  })
})
