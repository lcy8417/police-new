import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { ResizeHandle } from "./ResizeHandle"

describe("ResizeHandle", () => {
  it("초점을 받는 세로 나누개 — 값 · 범위 · 표식", () => {
    render(<ResizeHandle label="판 폭" value={280} min={240} max={440} onChange={() => undefined} grow="left" />)
    const h = screen.getByRole("separator", { name: "판 폭" })
    expect(h).toHaveAttribute("aria-orientation", "vertical")
    expect(h).toHaveAttribute("aria-valuenow", "280")
    expect(h).toHaveAttribute("aria-valuemin", "240")
    expect(h).toHaveAttribute("aria-valuemax", "440")
    expect(h).toHaveAttribute("tabindex", "0")
    expect(h).toHaveAttribute("data-part", "ResizeHandle")
  })

  it("키: 커지는 쪽 화살표 = +16(Shift 48) · 반대 = −16 · Home/End = 끝, 범위 밖은 자른다", () => {
    const onChange = vi.fn()
    const { rerender } = render(<ResizeHandle label="판 폭" value={280} min={240} max={440} onChange={onChange} grow="left" />)
    const h = screen.getByRole("separator")
    fireEvent.keyDown(h, { key: "ArrowLeft" })
    expect(onChange).toHaveBeenLastCalledWith(296)
    fireEvent.keyDown(h, { key: "ArrowRight" })
    expect(onChange).toHaveBeenLastCalledWith(264)
    fireEvent.keyDown(h, { key: "ArrowLeft", shiftKey: true })
    expect(onChange).toHaveBeenLastCalledWith(328)
    fireEvent.keyDown(h, { key: "End" })
    expect(onChange).toHaveBeenLastCalledWith(440)
    rerender(<ResizeHandle label="판 폭" value={250} min={240} max={440} onChange={onChange} grow="right" />)
    fireEvent.keyDown(h, { key: "ArrowLeft" })
    expect(onChange).toHaveBeenLastCalledWith(240)
    fireEvent.keyDown(h, { key: "ArrowRight" })
    expect(onChange).toHaveBeenLastCalledWith(266)
  })

  it("끌기: 시작 폭(measure 가 있으면 잰 폭) + 움직인 거리, 커지는 쪽 반대로 끌면 줄어든다", () => {
    const onChange = vi.fn()
    render(<ResizeHandle label="판 폭" value={280} min={240} max={440} onChange={onChange} grow="left" measure={() => 300} />)
    const h = screen.getByRole("separator")
    fireEvent.pointerDown(h, { button: 0, clientX: 500, pointerId: 1 })
    expect(h).toHaveAttribute("data-part-state", "drag")
    fireEvent.pointerMove(h, { clientX: 440, pointerId: 1 })
    expect(onChange).toHaveBeenLastCalledWith(360)
    fireEvent.pointerMove(h, { clientX: 700, pointerId: 1 })
    expect(onChange).toHaveBeenLastCalledWith(240)
    fireEvent.pointerUp(h, { pointerId: 1 })
    expect(h).not.toHaveAttribute("data-part-state")
    onChange.mockClear()
    fireEvent.pointerMove(h, { clientX: 400, pointerId: 1 })
    expect(onChange).not.toHaveBeenCalled()
  })

  it("두 번 누르면 기본 폭(onReset)", () => {
    const onReset = vi.fn()
    render(<ResizeHandle label="판 폭" value={300} min={240} max={440} onChange={() => undefined} grow="right" onReset={onReset} />)
    fireEvent.doubleClick(screen.getByRole("separator"))
    expect(onReset).toHaveBeenCalledTimes(1)
  })
})
