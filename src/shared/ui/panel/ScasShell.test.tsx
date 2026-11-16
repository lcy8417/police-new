import { render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { ScasShell, type ScasMenuGroup } from "./ScasShell"

const MENU: ScasMenuGroup[] = [
  {
    group: "사건관리",
    items: [
      { label: "사건관리", href: "/dev/s01" },
      { label: "문서접수대장", count: 3 },
      { label: "신발정보일괄등록", disabled: true },
    ],
  },
  { group: "관리", items: [{ label: "사용자 관리", href: "/dev/s13" }] },
]
const USER = { name: "박○○", org: "경찰청", roleLabel: "감정관" }

function renderShell(props: Partial<React.ComponentProps<typeof ScasShell>> = {}) {
  return render(
    <ScasShell active="사건관리" menu={MENU} user={USER} {...props}>
      <p>본문</p>
    </ScasShell>,
  )
}

describe("ScasShell", () => {
  it("메뉴 그룹과 항목을 그린다", () => {
    renderShell()
    const nav = screen.getByRole("navigation")
    expect(within(nav).getByText("관리")).toBeInTheDocument()
    expect(within(nav).getByText("문서접수대장")).toBeInTheDocument()
    expect(within(nav).getByText("3")).toBeInTheDocument()
    expect(within(nav).getByText("사용자 관리")).toBeInTheDocument()
  })

  it("active 항목에만 aria-current=page 를 붙인다", () => {
    renderShell()
    const nav = screen.getByRole("navigation")
    const current = nav.querySelectorAll('[aria-current="page"]')
    expect(current).toHaveLength(1)
    expect(current[0]).toHaveTextContent("사건관리")
  })

  it("비활성 항목은 aria-disabled 이고 링크가 아니다", () => {
    renderShell()
    const item = screen.getByText("신발정보일괄등록")
    expect(item.closest("[aria-disabled='true']")).not.toBeNull()
    expect(item.closest("a")).toBeNull()
  })

  it("탭 줄에 현재 탭을 표시한다", () => {
    renderShell({ tabs: ["사건관리", "감정서작성"], tabOn: "감정서작성" })
    const tabs = screen.getAllByRole("tab")
    expect(tabs).toHaveLength(2)
    expect(screen.getByRole("tab", { name: /감정서작성/ })).toHaveAttribute("aria-selected", "true")
    expect(screen.getByRole("tab", { name: /사건관리/ })).toHaveAttribute("aria-selected", "false")
  })

  it("제목 · 사용자 · 본문을 그린다", () => {
    renderShell({ title: "사건관리 목록" })
    expect(screen.getByText("사건관리 목록")).toBeInTheDocument()
    expect(screen.getByText("박○○")).toBeInTheDocument()
    expect(screen.getByText("감정관")).toBeInTheDocument()
    expect(screen.getByText("본문")).toBeInTheDocument()
  })

  it("루트에 부품 표식과 위치 식별자를 붙인다", () => {
    const { container } = renderShell({ partId: "S01-00" })
    const root = container.firstElementChild as HTMLElement
    expect(root).toHaveAttribute("data-part", "ScasShell")
    expect(root).toHaveAttribute("data-part-id", "S01-00")
  })

  it("href 없는 항목은 링크가 아닌 글자로 그린다", () => {
    renderShell()
    expect(screen.getByText("문서접수대장").closest("a")).toBeNull()
  })

  it("renderLink 가 있으면 그 함수로 링크를 그린다", () => {
    renderShell({
      renderLink: ({ href, children, ...rest }) => (
        <a data-custom href={`${href}?x=1`} {...rest}>
          {children}
        </a>
      ),
    })
    expect(screen.getByText("사용자 관리").closest("a")).toHaveAttribute("href", "/dev/s13?x=1")
  })

  it("display 가 없으면 범위 속성을 달지 않는다(:root 값 그대로 — 부품 진열 대조용)", () => {
    const { container } = renderShell()
    const root = container.querySelector('[data-part="ScasShell"]')!
    for (const a of ["data-theme", "data-font", "data-scale", "data-motion"]) expect(root).not.toHaveAttribute(a)
  })

  it("display 를 주면 루트에 범위 속성을 단다(r3)", () => {
    const { container } = renderShell({
      display: { theme: "light-soft", font: "noto-sans", scale: "xl", reducedMotion: true },
    })
    const root = container.querySelector('[data-part="ScasShell"]')!
    expect(root).toHaveAttribute("data-theme", "light-soft")
    expect(root).toHaveAttribute("data-font", "noto-sans")
    expect(root).toHaveAttribute("data-scale", "xl")
    expect(root).toHaveAttribute("data-motion", "reduce")
  })

  it("headerEnd 자리를 위 메뉴 오른쪽 끝에 그린다(r3)", () => {
    renderShell({ headerEnd: <button type="button">화면 설정</button> })
    expect(screen.getByRole("button", { name: "화면 설정" })).toBeInTheDocument()
  })
})
