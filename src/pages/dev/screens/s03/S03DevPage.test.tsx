import { fireEvent, render, screen, within } from "@testing-library/react"
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom"
import { describe, expect, it } from "vitest"

import { S03DevPage } from "./S03DevPage"

function Landing() {
  const { pathname, search } = useLocation()
  return <p data-testid="landing">{`${pathname}${search}`}</p>
}

function renderAt(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/dev/s03" element={<S03DevPage />} />
        <Route path="/dev/:id" element={<Landing />} />
      </Routes>
    </MemoryRouter>,
  )
}

const TOOLS = ["크롭", "각도보정", "길이측정", "배경제거", "접합장애물제거", "이진화", "노이즈제거"]
const SCAS_BOTTOM = ["처음상태", "평준화", "색상반전", "좌우반전", "밝게", "어둡게", "상하반전"]

/** a 가 b 보다 문서에서 앞에 있는가 */
const before = (a: Element, b: Element) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING)

describe("S03DevPage — 이미지 편집", () => {
  it("ready 케이스에 A 이미지 커팅의 SCAS 위 버튼 줄과 덧붙인 도구 줄을 그린다", () => {
    renderAt("/dev/s03?case=ready")
    const cutting = screen.getByRole("region", { name: "이미지 커팅" })
    const save = within(cutting).getByRole("button", { name: "저장" })
    for (const name of ["취소", "확인"]) expect(within(cutting).getByRole("button", { name })).toBeInTheDocument()

    const toolButtons = TOOLS.map((name) => within(cutting).getByRole("button", { name }))
    // 도구 줄은 SCAS 버튼(… 취소 · 확인 · 저장) 뒤에 덧붙이고, 순서는 표대로
    expect(before(save, toolButtons[0])).toBe(true)
    for (let i = 1; i < toolButtons.length; i++) expect(before(toolButtons[i - 1], toolButtons[i])).toBe(true)
  })

  it("SCAS 아래 버튼 줄은 이름 · 순서 그대로이고 「되돌리기」는 맨 끝에 덧붙인다", () => {
    renderAt("/dev/s03?case=ready")
    const row = screen.getByRole("group", { name: "SCAS 아래 버튼 줄" })
    const names = within(row)
      .getAllByRole("button")
      .map((b) => b.textContent)
    expect(names).toEqual([...SCAS_BOTTOM, "되돌리기"])
  })

  it("SCAS 버튼 중 지금 기능이 없는 것은 비활성이고 「준비 중」 안내가 붙는다", () => {
    renderAt("/dev/s03?case=ready")
    const row = screen.getByRole("group", { name: "SCAS 아래 버튼 줄" })
    const flip = within(row).getByRole("button", { name: "좌우반전" })
    expect(flip).toBeDisabled()
    expect(flip.closest("[title='준비 중']")).not.toBeNull()
  })

  it("이진화를 누르면 모드 5개 · 임계값 · 적용이 나온다", () => {
    renderAt("/dev/s03?case=ready")
    fireEvent.click(screen.getByRole("button", { name: "이진화" }))
    const modes = screen.getByRole("group", { name: "이진화 모드" })
    expect(within(modes).getAllByRole("button").map((b) => b.textContent)).toEqual([
      "이진(표준)",
      "이진(반전)",
      "절단",
      "제로화",
      "제로화(반전)",
    ])
    expect(screen.getByLabelText("이진화 임계값")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "적용" })).toBeInTheDocument()
  })

  it("도구 버튼은 제어형이라 누르면 눌림 표시가 옮겨 간다", () => {
    renderAt("/dev/s03?case=ready")
    const measure = screen.getByRole("button", { name: "길이측정" })
    expect(measure).toHaveAttribute("aria-pressed", "false")
    fireEvent.click(measure)
    expect(screen.getByRole("button", { name: "길이측정" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByText(/P1 · P2 = 1 cm/)).toBeInTheDocument()
  })

  it("캔버스 칸의 도구 장식은 누름을 막지 않는다(pointer-events-none)", () => {
    const { container } = renderAt("/dev/s03?case=ready")
    const crop = container.querySelector("[data-deco='crop-frame']")
    expect(crop).not.toBeNull()
    expect(crop!.closest(".pointer-events-none")).not.toBeNull()
  })

  it("B 이미지 뷰어로 바꾸면 보기 방식 밝기 · 대비 · 감마 · 임계값 · 반전 · 흑백이 있고 값이 바뀐다", () => {
    renderAt("/dev/s03?case=ready")
    fireEvent.click(screen.getByRole("button", { name: "B · 이미지 뷰어" }))
    const viewer = screen.getByRole("region", { name: "이미지 뷰어" })
    for (const label of ["밝기", "대비", "감마", "임계값"]) {
      expect(within(viewer).getByLabelText(label)).toBeInTheDocument()
    }
    expect(within(viewer).getByRole("button", { name: "반전" })).toBeInTheDocument()
    expect(within(viewer).getByRole("button", { name: "흑백" })).toBeInTheDocument()

    fireEvent.change(within(viewer).getByLabelText("밝기"), { target: { value: "20" } })
    expect(within(viewer).getByLabelText("밝기")).toHaveValue(20)

    fireEvent.click(within(viewer).getByRole("button", { name: "반전" }))
    expect(within(viewer).getByRole("button", { name: "반전" })).toHaveAttribute("aria-pressed", "true")
    // 보기용이라 저장 버튼이 없다(시안 핀 7)
    expect(within(viewer).queryByRole("button", { name: "저장" })).toBeNull()
  })

  it("running 케이스에 노이즈제거 AiProgress가 돈다", () => {
    const { container } = renderAt("/dev/s03?case=running")
    const bar = screen.getByRole("progressbar", { name: "노이즈제거" })
    expect(bar.closest("[data-part='AiProgress']")).toHaveAttribute("data-part-variant", "running")
    expect(container.querySelector("[data-part='ScanOverlay']")).not.toBeNull()
  })

  it("움직임 줄이기: AI 움직임 클래스는 motion-safe: 로만 걸린다", () => {
    const { container } = renderAt("/dev/s03?case=running")
    const animated = Array.from(container.querySelectorAll("[class*='animate-']"))
    expect(animated.length).toBeGreaterThan(0)
    for (const el of animated) {
      const bare = el
        .getAttribute("class")!
        .split(/\s+/)
        .filter((c) => c.startsWith("animate-"))
      expect(bare).toEqual([])
    }
  })

  it("loading 케이스는 aria-busy=\"true\"", () => {
    const { container } = renderAt("/dev/s03?case=loading")
    expect(container.querySelector("[aria-busy='true']")).not.toBeNull()
  })

  it("error 케이스는 「다시」 버튼이 있고 「결과 없음」이 없다", () => {
    renderAt("/dev/s03?case=error")
    expect(screen.getByRole("button", { name: "다시" })).toBeInTheDocument()
    expect(screen.queryByText(/결과 없음/)).toBeNull()
    expect(screen.getByText("확인 못 함")).toBeInTheDocument()
  })

  it("readonly 보기에서 「저장」 · 「확인」 · 도구 버튼이 disabled", () => {
    renderAt("/dev/s03?case=ready&as=readonly")
    expect(screen.getByRole("button", { name: "저장" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "확인" })).toBeDisabled()
    for (const name of TOOLS) expect(screen.getByRole("button", { name })).toBeDisabled()
  })

  it("「저장」을 누르면 보는 사람을 유지한 채 S04로 간다", () => {
    renderAt("/dev/s03?case=ready&as=admin")
    fireEvent.click(screen.getByRole("button", { name: "저장" }))
    expect(screen.getByTestId("landing")).toHaveTextContent("/dev/s04?as=admin")
  })
})
