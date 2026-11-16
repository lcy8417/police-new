import * as React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { CaseWindowFrame } from "./CaseWindowFrame"

function Host({ onClose = () => undefined }: { onClose?: () => void }) {
  const [open, setOpen] = React.useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        열기
      </button>
      {open ? (
        <CaseWindowFrame
          label="00001-25-0649 사건 창"
          onClose={() => {
            onClose()
            setOpen(false)
          }}
        >
          본문
        </CaseWindowFrame>
      ) : null}
    </>
  )
}

describe("CaseWindowFrame", () => {
  it("dialog 이름 · 부품 표식(wide 기본) · 본문을 그린다", () => {
    const { container } = render(
      <CaseWindowFrame label="사건 창" onClose={() => undefined}>
        본문
      </CaseWindowFrame>
    )
    expect(screen.getByRole("dialog", { name: "사건 창" })).toHaveTextContent("본문")
    expect(container.querySelector('[data-part="CaseWindowFrame"]')).toHaveAttribute("data-part-variant", "wide")
  })

  it("가림막을 누르면 닫힌다", () => {
    const onClose = vi.fn()
    const { container } = render(
      <CaseWindowFrame label="사건 창" onClose={onClose}>
        본문
      </CaseWindowFrame>
    )
    fireEvent.click(container.querySelector('[data-slot="case-window-scrim"]')!)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("Esc 로 닫히고, 다른 층(alertdialog)이 열려 있으면 그 층 몫이라 닫지 않는다", () => {
    const onClose = vi.fn()
    render(
      <CaseWindowFrame label="사건 창" onClose={onClose}>
        본문
      </CaseWindowFrame>
    )
    const layer = document.createElement("div")
    layer.setAttribute("role", "alertdialog")
    document.body.appendChild(layer)
    fireEvent.keyDown(document, { key: "Escape" })
    expect(onClose).not.toHaveBeenCalled()
    layer.remove()
    fireEvent.keyDown(document, { key: "Escape" })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("열면 창으로 초점, 닫으면 연 단추로 초점을 돌려준다", () => {
    render(<Host />)
    const opener = screen.getByRole("button", { name: "열기" })
    opener.focus()
    fireEvent.click(opener)
    expect(screen.getByRole("dialog")).toHaveFocus()
    fireEvent.keyDown(document, { key: "Escape" })
    expect(screen.queryByRole("dialog")).toBeNull()
    expect(opener).toHaveFocus()
  })

  it("tabs · head · rail 슬롯: 탭 줄은 창 위, rail 을 주면 「목록 | 본문」 격자", () => {
    const { container } = render(
      <CaseWindowFrame label="사건 창" onClose={() => undefined} tabs={<div>탭줄</div>} head={<div>머리</div>} rail={<nav aria-label="목록" />}>
        본문
      </CaseWindowFrame>
    )
    const dialog = screen.getByRole("dialog")
    expect(dialog).not.toHaveTextContent("탭줄")
    expect(container.querySelector('[data-slot="case-window-tabbed"]')).toHaveTextContent("탭줄")
    expect(dialog.firstElementChild).toHaveTextContent("머리")
    expect(screen.getByRole("navigation", { name: "목록" })).toBeInTheDocument()
    expect(container.querySelector('[data-slot="case-window-body"]')).toHaveTextContent("본문")
  })
})
