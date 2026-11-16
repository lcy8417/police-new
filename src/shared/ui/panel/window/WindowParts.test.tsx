import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { WindowHead } from "./WindowHead"
import { WindowRail } from "./WindowRail"
import { WorkTabStrip } from "./WorkTabStrip"

describe("WorkTabStrip", () => {
  const tabs = [
    { id: "a", label: "00001-25-0649 · 주거침입" },
    { id: "b", label: "00001-25-0647 · 절도" },
  ]

  it("고른 탭은 aria-selected + 채움, 누르면 고르고 × 로 닫는다", () => {
    const onSelect = vi.fn()
    const onClose = vi.fn()
    render(<WorkTabStrip tabs={tabs} activeId="a" onSelect={onSelect} onClose={onClose} />)
    const on = screen.getByRole("tab", { name: "00001-25-0649 · 주거침입" })
    expect(on).toHaveAttribute("aria-selected", "true")
    expect(on.parentElement?.className).toContain("bg-brand-3")
    fireEvent.click(screen.getByRole("tab", { name: "00001-25-0647 · 절도" }))
    expect(onSelect).toHaveBeenCalledWith("b")
    fireEvent.click(screen.getByRole("button", { name: "00001-25-0647 · 절도 탭 닫기" }))
    expect(onClose).toHaveBeenCalledWith("b")
  })

  it("full 을 주면 오른쪽 회색 한 줄(status)로 까닭을 보인다", () => {
    render(<WorkTabStrip tabs={tabs} activeId="a" onSelect={() => undefined} onClose={() => undefined} full="최대 8개" />)
    expect(screen.getByRole("status")).toHaveTextContent("최대 8개")
  })
})

describe("WindowRail", () => {
  it("묶음 머리(이름 + 수) · 줄(이름 · 아래 글 · 알약), 고른 줄은 aria-current + bg-brand-bg", () => {
    const onSelect = vi.fn()
    render(
      <WindowRail
        label="현장 이미지"
        groups={[{ name: "신발", items: [{ id: "1", name: "_1", sub: "신발", pill: <span>확인</span> }, { id: "2", name: "_2" }] }]}
        selectedId="1"
        onSelect={onSelect}
      />
    )
    const nav = screen.getByRole("navigation", { name: "현장 이미지" })
    expect(nav).toHaveAttribute("data-part", "WindowRail")
    expect(nav.className).toContain("w-[232px]")
    const rows = screen.getAllByRole("button")
    expect(rows).toHaveLength(2)
    expect(rows[0]).toHaveAttribute("aria-current", "true")
    expect(rows[0].className).toContain("bg-brand-bg")
    expect(rows[1]).not.toHaveAttribute("aria-current")
    fireEvent.click(rows[1])
    expect(onSelect).toHaveBeenCalledWith("2")
  })

  it("footer 를 주면 맨 아래 칸에 그린다", () => {
    const { container } = render(
      <WindowRail label="목록" groups={[{ items: [] }]} selectedId={null} onSelect={() => undefined} footer={<button type="button">+ 사진 추가</button>} />
    )
    expect(container.querySelector('[data-slot="window-rail-footer"]')).toHaveTextContent("+ 사진 추가")
  })

  it("narrow 면 폭 208", () => {
    render(<WindowRail label="목록" groups={[{ items: [] }]} selectedId={null} onSelect={() => undefined} narrow />)
    expect(screen.getByRole("navigation").className).toContain("w-[208px]")
  })
})

describe("WindowHead", () => {
  it("이름 · 꼬리표 · ‹ › × — 끝이면 잠긴다", () => {
    const onPrev = vi.fn()
    const onNext = vi.fn()
    const onClose = vi.fn()
    render(
      <WindowHead
        mark="주"
        title="00001-25-0649"
        subtitle="주거침입"
        tags={["대구청", "12장"]}
        onPrev={onPrev}
        onNext={onNext}
        prevOff
        onClose={onClose}
      />
    )
    expect(screen.getByText("00001-25-0649")).toBeInTheDocument()
    expect(screen.getByText("대구청")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "앞 사건" })).toBeDisabled()
    fireEvent.click(screen.getByRole("button", { name: "다음 사건" }))
    fireEvent.click(screen.getByRole("button", { name: "창 닫기" }))
    expect(onNext).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onPrev).not.toHaveBeenCalled()
  })

  it("셋째 줄 now 「⑥ 결재 › 결재 올리기 [지금 할 차례]」 · ⋯ 메뉴 항목을 고르면 onSelect", () => {
    const copy = vi.fn()
    const { container } = render(
      <WindowHead
        mark="강"
        title="00001-25-0633"
        now={{ num: 6, stage: "결재", task: "결재 올리기", badge: "지금 할 차례" }}
        menu={[{ label: "사건복사", onSelect: copy }, { label: "수정", onSelect: () => undefined }]}
        onPrev={() => undefined}
        onNext={() => undefined}
        onClose={() => undefined}
      />
    )
    const now = container.querySelector('[data-slot="window-head-now"]') as HTMLElement
    expect(now).toHaveTextContent("6결재›결재 올리기지금 할 차례")
    const trigger = screen.getByRole("button", { name: "이 창 메뉴" })
    fireEvent.keyDown(trigger, { key: "Enter" })
    const items = screen.getAllByRole("menuitem")
    expect(items.map((i) => i.textContent)).toEqual(["사건복사", "수정"])
    fireEvent.click(items[0])
    expect(copy).toHaveBeenCalledTimes(1)
  })

  it("menu 가 없으면 ⋯ 단추가 없다", () => {
    render(<WindowHead mark="a" title="x" onPrev={() => undefined} onNext={() => undefined} onClose={() => undefined} />)
    expect(screen.queryByRole("button", { name: "이 창 메뉴" })).toBeNull()
  })
})
