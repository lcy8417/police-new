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

  it("layer: 변형 layer · 제목 옆 · 머리 오른쪽 · ✕ 닫기, 컨테이너 안에 뜬다", () => {
    const onOpenChange = vi.fn()
    const host = document.createElement("div")
    document.body.appendChild(host)
    render(
      <DialogShell
        open
        onOpenChange={onOpenChange}
        title="신발정보관리"
        variant="layer"
        container={host}
        titleExtra={<span>303349</span>}
        headerRight={<span>안내</span>}
      >
        <p>본문</p>
      </DialogShell>
    )
    const dialog = screen.getByRole("dialog")
    expect(dialog).toHaveAttribute("data-part-variant", "layer")
    expect(host).toContainElement(dialog)
    expect(screen.getByText("303349")).toBeVisible()
    expect(screen.getByText("안내")).toBeVisible()
    fireEvent.click(screen.getByRole("button", { name: "닫기" }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("기본 변형도 titleExtra · headerRight 를 그린다", () => {
    render(
      <DialogShell open onOpenChange={() => {}} title="사건" titleExtra={<i>옆</i>} headerRight={<i>오른쪽</i>}>
        <p>본문</p>
      </DialogShell>
    )
    expect(screen.getByText("옆")).toBeVisible()
    expect(screen.getByText("오른쪽")).toBeVisible()
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
