import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { InspectFrame } from "./InspectFrame"
import { DEFAULT_LENS, DEFAULT_VIEW_TUNE } from "./view-tune"

// 2회차 검수: aria-modal 판인데 Tab 으로 가려진 뒤 조작부에 들어가던 것 — 초점 가두기 · 같은 칸 형제 inert
function setup() {
  const onClose = vi.fn()
  render(
    <div className="relative">
      <button type="button">뒤 단추</button>
      <InspectFrame source={<span />} tune={DEFAULT_VIEW_TUNE} onTuneChange={() => {}} lens={DEFAULT_LENS} onLensChange={() => {}} onClose={onClose} />
    </div>,
  )
  return { onClose, dialog: screen.getByRole("dialog") }
}

describe("InspectFrame", () => {
  it("열면 닫기 단추로 초점, 같은 칸의 가려진 형제는 inert", () => {
    setup()
    expect(screen.getByRole("button", { name: "살펴보기 닫기" })).toHaveFocus()
    expect(screen.getByText("뒤 단추")).toHaveAttribute("inert")
  })

  it("Tab · Shift+Tab 은 판 안에서만 돈다", () => {
    const { dialog } = setup()
    const items = Array.from(dialog.querySelectorAll<HTMLElement>("button:not([disabled])"))
    const last = items[items.length - 1]
    last.focus()
    fireEvent.keyDown(document, { key: "Tab" })
    expect(items[0]).toHaveFocus()
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true })
    expect(last).toHaveFocus()
  })

  it("Esc 로 닫는다", () => {
    const { onClose } = setup()
    fireEvent.keyDown(document, { key: "Escape" })
    expect(onClose).toHaveBeenCalled()
  })
})
