import { fireEvent, render, screen, within } from "@testing-library/react"
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom"
import { describe, expect, it } from "vitest"

import { S04DevPage } from "./S04DevPage"

function Landing() {
  const { pathname, search } = useLocation()
  return <p data-testid="landing">{`${pathname}${search}`}</p>
}

function renderAt(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/dev/s04" element={<S04DevPage />} />
        <Route path="/dev/:id" element={<Landing />} />
      </Routes>
    </MemoryRouter>,
  )
}

const KINDS = ["무늬", "선", "윤곽", "다각", "삼각", "사각", "원", "항목"]

describe("S04DevPage — 문양 코딩 · 검색 조건", () => {
  it("ready 케이스에 상/중/하/윤곽 4부위를 그린다", () => {
    renderAt("/dev/s04?case=ready")
    const zones = screen.getByRole("group", { name: "현장 이미지 문양" })
    for (const z of ["상", "중", "하", "윤곽"]) {
      expect(within(zones).getByRole("button", { name: new RegExp(`^${z} 부위`) })).toBeInTheDocument()
    }
  })

  it("SCAS 버튼 줄 순서 그대로: 인공지능문양관리 · 검색결과 · 검색 · 다시입력 · 닫기", () => {
    renderAt("/dev/s04?case=ready")
    const bar = screen.getByRole("group", { name: "문양 상세보기 버튼" })
    const names = within(bar)
      .getAllByRole("button")
      .map((b) => b.textContent)
    expect(names.slice(0, 5)).toEqual(["인공지능문양관리", "검색결과", "검색", "다시입력", "닫기"])
  })

  it("팔레트 종류 8개는 순서대로이고 버튼 안에 글자만 있다", () => {
    renderAt("/dev/s04?case=ready")
    const kinds = within(screen.getByRole("group", { name: "문양 종류" })).getAllByRole("button")
    expect(kinds.map((b) => b.textContent)).toEqual(KINDS)
    for (const b of kinds) expect(b.children.length).toBe(0)
  })

  it("팔레트 종류를 바꾸면 그 종류의 문양이 보인다(제어형)", () => {
    renderAt("/dev/s04?case=ready")
    const kinds = screen.getByRole("group", { name: "문양 종류" })
    fireEvent.click(within(kinds).getByRole("button", { name: "항목" }))
    expect(within(kinds).getByRole("button", { name: "항목" })).toHaveAttribute("aria-pressed", "true")
    const palette = screen.getByRole("group", { name: "문양 팔레트" })
    expect(within(palette).getByRole("button", { name: "s81a 넣기" })).toBeInTheDocument()
  })

  it("문양 그림 경로는 /src/assets/Patterns/전체/<이름>.png 그대로 쓴다", () => {
    renderAt("/dev/s04?case=ready")
    const zones = screen.getByRole("group", { name: "현장 이미지 문양" })
    const img = within(zones).getAllByRole("img", { name: "n32_04" })[0]
    expect(img).toHaveAttribute("src", "/src/assets/Patterns/전체/n32_04.png")
  })

  it("필수 문양에 「필수」가 붙고, 우클릭하면 onToggleEssential로 필수가 바뀐다", () => {
    renderAt("/dev/s04?case=ready")
    const zones = screen.getByRole("group", { name: "현장 이미지 문양" })
    const before = within(zones).getAllByText("필수").length
    expect(before).toBeGreaterThan(0)
    const target = within(zones).getByRole("button", { name: "하 n32_04" })
    fireEvent.contextMenu(target)
    expect(within(zones).getAllByText("필수")).toHaveLength(before + 1)
    fireEvent.contextMenu(within(zones).getByRole("button", { name: "하 n32_04 필수" }))
    expect(within(zones).getAllByText("필수")).toHaveLength(before)
  })

  it("팔레트 문양을 누르면 고른 부위에 들어간다", () => {
    renderAt("/dev/s04?case=ready")
    const zones = screen.getByRole("group", { name: "현장 이미지 문양" })
    fireEvent.click(within(zones).getByRole("button", { name: /^윤곽 부위/ }))
    fireEvent.click(within(screen.getByRole("group", { name: "문양 종류" })).getByRole("button", { name: "윤곽" }))
    fireEvent.click(screen.getByRole("button", { name: "s10a 넣기" }))
    expect(within(zones).getByRole("button", { name: "윤곽 s10a" })).toBeInTheDocument()
  })

  it("추출 결과마다 ConfidenceBar로 점수를 보인다", () => {
    renderAt("/dev/s04?case=ready")
    const result = screen.getByRole("region", { name: "AI 추출 결과" })
    const meters = within(result).getAllByRole("meter", { name: "AI 확신도" })
    expect(meters.length).toBeGreaterThan(0)
    expect(meters[0].closest("[data-part='ConfidenceBar']")).not.toBeNull()
  })

  it("검색 이력 표 열은 ID · 등록일시 · 순위 · 매칭된 신발 정보이고 신발 ID 앞자리 0을 지킨다", () => {
    renderAt("/dev/s04?case=ready")
    const table = within(screen.getByRole("region", { name: "검색이력" })).getByRole("table")
    expect(within(table).getAllByRole("columnheader").map((h) => h.textContent)).toEqual([
      "ID",
      "등록일시",
      "순위",
      "매칭된 신발 정보",
    ])
    expect(within(table).getByText("00758")).toBeInTheDocument()
  })

  it("running 케이스는 문양 추출 AiProgress가 돌고 움직임은 motion-safe: 로만 걸린다", () => {
    const { container } = renderAt("/dev/s04?case=running")
    const bar = screen.getByRole("progressbar", { name: "문양 추출" })
    expect(bar.closest("[data-part='AiProgress']")).toHaveAttribute("data-part-variant", "running")
    const animated = Array.from(container.querySelectorAll("[class*='animate-']"))
    expect(animated.length).toBeGreaterThan(0)
    for (const el of animated) {
      expect(
        el
          .getAttribute("class")!
          .split(/\s+/)
          .filter((c) => c.startsWith("animate-")),
      ).toEqual([])
    }
  })

  it("loading 케이스는 aria-busy=\"true\"", () => {
    const { container } = renderAt("/dev/s04?case=loading")
    expect(container.querySelector("[aria-busy='true']")).not.toBeNull()
  })

  it("error 케이스는 「다시」 버튼이 있고 「결과 없음」이 없다", () => {
    renderAt("/dev/s04?case=error")
    expect(screen.getByRole("button", { name: "다시" })).toBeInTheDocument()
    expect(screen.queryByText(/결과 없음/)).toBeNull()
  })

  it("empty 케이스는 「결과 없음」을 보인다", () => {
    renderAt("/dev/s04?case=empty")
    expect(screen.getByText("결과 없음")).toBeInTheDocument()
  })

  it("readonly 보기에서 「검색」 · 「다시입력」 · 추출 · 문양 넣기가 disabled", () => {
    renderAt("/dev/s04?case=ready&as=readonly")
    expect(screen.getByRole("button", { name: "검색" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "다시입력" })).toBeDisabled()
    expect(screen.getByRole("button", { name: /추출$/ })).toBeDisabled()
    expect(screen.getByRole("button", { name: "n32_02 넣기" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "하 n32_04" })).toBeDisabled()
  })

  it("「검색」을 누르면 보는 사람을 유지한 채 S05로 간다", () => {
    renderAt("/dev/s04?case=ready&as=investigator")
    fireEvent.click(screen.getByRole("button", { name: "검색" }))
    expect(screen.getByTestId("landing")).toHaveTextContent("/dev/s05?as=investigator")
  })
})
