import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { TabMark, UnderlineTabs } from "./UnderlineTabs"

describe("UnderlineTabs", () => {
  it("고른 탭 aria-selected + brand 밑줄, endKey 탭은 오른쪽 끝, idPrefix 로 id, 누르면 onChange", () => {
    const onChange = vi.fn()
    render(
      <UnderlineTabs
        label="작업"
        tabs={[
          ["info", "사건 정보"],
          ["edit", "이미지 편집"],
          ["confirm", "결과 확인"],
        ]}
        value="info"
        onChange={onChange}
        endKey="confirm"
        idPrefix="t"
      />
    )
    const list = screen.getByRole("tablist", { name: "작업" })
    expect(list).toHaveAttribute("data-part-variant", "window")
    const on = screen.getByRole("tab", { name: "사건 정보" })
    expect(on).toHaveAttribute("aria-selected", "true")
    expect(on).toHaveAttribute("id", "t-info")
    expect(on.className).toContain("border-brand")
    expect(screen.getByRole("tab", { name: "결과 확인" }).className).toContain("ml-auto")
    fireEvent.click(screen.getByRole("tab", { name: "이미지 편집" }))
    expect(onChange).toHaveBeenCalledWith("edit")
  })

  it("1회차 검수 — 고른 탭만 Tab 순서(roving tabIndex), ← → · Home · End 로 옮겨 고른다", () => {
    const onChange = vi.fn()
    render(
      <UnderlineTabs
        label="작업"
        tabs={[
          ["info", "사건 정보"],
          ["edit", "이미지 편집"],
          ["confirm", "결과 확인"],
        ]}
        value="info"
        onChange={onChange}
      />
    )
    const info = screen.getByRole("tab", { name: "사건 정보" })
    expect(info).toHaveAttribute("tabindex", "0")
    expect(screen.getByRole("tab", { name: "이미지 편집" })).toHaveAttribute("tabindex", "-1")
    fireEvent.keyDown(info, { key: "ArrowRight" })
    expect(onChange).toHaveBeenLastCalledWith("edit")
    expect(screen.getByRole("tab", { name: "이미지 편집" })).toHaveFocus()
    fireEvent.keyDown(info, { key: "ArrowLeft" })
    expect(onChange).toHaveBeenLastCalledWith("confirm")
    fireEvent.keyDown(info, { key: "End" })
    expect(onChange).toHaveBeenLastCalledWith("confirm")
  })
})

describe("TabMark", () => {
  it("done ✓ · problem ! · blanks 수(0 이면 없음) · notApplicable –", () => {
    const { container, rerender } = render(<TabMark kind="done" />)
    expect(container.querySelector('[data-mark="done"]')).toHaveTextContent("✓")
    rerender(<TabMark kind="problem" />)
    expect(screen.getByLabelText("확인할 문제")).toHaveTextContent("!")
    rerender(<TabMark kind="blanks" count={2} />)
    expect(container.querySelector('[data-mark="blanks"]')).toHaveTextContent("2")
    rerender(<TabMark kind="blanks" count={0} />)
    expect(container.querySelector('[data-slot="panel-tab-mark"]')).toBeNull()
    rerender(<TabMark kind="notApplicable" />)
    expect(screen.getByLabelText("해당 없음")).toHaveTextContent("–")
  })

  it("탭 이름에는 끝 ✓ · 빈 칸 수가 섞이지 않는다", () => {
    render(
      <UnderlineTabs
        label="작업"
        tabs={[
          ["a", <>사건 정보<TabMark kind="blanks" count={1} /></>],
          ["b", <>문양 코드<TabMark kind="done" /></>],
        ]}
        value="a"
        onChange={() => undefined}
      />
    )
    expect(screen.getByRole("tab", { name: "사건 정보" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "문양 코드" })).toBeInTheDocument()
  })
})
