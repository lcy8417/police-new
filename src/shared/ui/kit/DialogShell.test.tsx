import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { DialogShell } from "./DialogShell"

describe("DialogShell", () => {
  it("열려 있으면 제목 · 몸 · 머리 동작이 보이고 표식이 붙는다", () => {
    render(
      <DialogShell open onOpenChange={() => {}} title="사건 등록" actions={<button>저장</button>} partId="S02-31">
        <p>본문</p>
      </DialogShell>
    )
    const dialog = screen.getByRole("dialog")
    expect(dialog).toHaveAttribute("data-part", "DialogShell")
    expect(dialog).toHaveAttribute("data-part-id", "S02-31")
    expect(dialog).not.toHaveAttribute("data-part-variant")
    expect(screen.getByText("사건 등록")).toBeVisible()
    expect(screen.getByText("본문")).toBeVisible()
    expect(screen.getByRole("button", { name: "저장" })).toBeVisible()
  })

  it("닫혀 있으면 아무것도 그리지 않는다", () => {
    render(
      <DialogShell open={false} onOpenChange={() => {}} title="사건 등록">
        <p>본문</p>
      </DialogShell>
    )
    expect(screen.queryByRole("dialog")).toBeNull()
  })

  it("닫기 버튼은 onOpenChange(false)", () => {
    const onOpenChange = vi.fn()
    render(
      <DialogShell open onOpenChange={onOpenChange} title="사건 등록">
        <p>본문</p>
      </DialogShell>
    )
    fireEvent.click(screen.getByRole("button", { name: "닫기" }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("large 는 변형 large", () => {
    render(
      <DialogShell open onOpenChange={() => {}} title="크게" size="large">
        <p>본문</p>
      </DialogShell>
    )
    expect(screen.getByRole("dialog")).toHaveAttribute("data-part-variant", "large")
  })
})
