import * as React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { LensBox, type LensSpot } from "./LensBox"

const TUNE = { outer: "", inner: "" }

/** 고정 상태를 드는 부르는 쪽(사건 창 문양 코드 탭과 같은 모양) */
function Harness({ onMove, pinnable = true }: { onMove?: (s: LensSpot) => void; pinnable?: boolean }) {
  const [pin, setPin] = React.useState<LensSpot | null>(null)
  return (
    <LensBox
      enabled
      size={100}
      zoom={2}
      source={<img alt="" src="a.png" />}
      tune={TUNE}
      onSizeStep={() => undefined}
      lensSlot="t-lens"
      onLensMove={onMove}
      pin={pin}
      onPinChange={pinnable ? setPin : undefined}
    >
      <div data-testid="img">그림</div>
      <button type="button">상자 안 단추</button>
    </LensBox>
  )
}

/** jsdom 은 크기가 0 이라 상자 크기를 정해 준다 */
const sized = (el: Element) =>
  vi.spyOn(el, "getBoundingClientRect").mockReturnValue({ left: 0, top: 0, width: 200, height: 400, right: 200, bottom: 400, x: 0, y: 0, toJSON: () => ({}) })

describe("LensBox — 누르면 고정", () => {
  afterEach(() => vi.restoreAllMocks())

  it("움직이지 않고 누르면 그 자리에 고정(brand 테 · 「고정」 핀), 다시 누르면 푼다", () => {
    const onMove = vi.fn()
    const { container } = render(<Harness onMove={onMove} />)
    const box = container.querySelector("[data-lens]") as HTMLElement
    sized(box)
    fireEvent.pointerDown(box, { button: 0, clientX: 50, clientY: 100 })
    fireEvent.click(box, { clientX: 50, clientY: 100 })
    const lens = container.querySelector('[data-slot="t-lens"]') as HTMLElement
    expect(lens).toHaveAttribute("data-lens-pinned")
    expect(lens).toHaveClass("pointer-events-none", "border-brand")
    expect(lens.style.left).toBe("0px")
    expect(lens.style.top).toBe("50px")
    expect(container.querySelector('[data-slot="lens-pin"]')).toHaveTextContent("고정")
    expect(box).toHaveAttribute("data-esc-layer")
    expect(onMove).toHaveBeenLastCalledWith({ rx: 0.25, ry: 0.25, w: 200, h: 400 })
    // 고정 중 마우스를 움직여도 확대 보기 칸 자리는 그대로
    onMove.mockClear()
    fireEvent.pointerMove(box, { clientX: 150, clientY: 300, buttons: 0, pointerType: "mouse" })
    expect(onMove).not.toHaveBeenCalled()
    expect((container.querySelector('[data-slot="t-lens"]') as HTMLElement).style.left).toBe("0px")
    // 다시 누르면 풀림
    fireEvent.pointerDown(box, { button: 0, clientX: 150, clientY: 300 })
    fireEvent.click(box, { clientX: 150, clientY: 300 })
    expect(container.querySelector("[data-lens-pinned]")).toBeNull()
    expect(box).not.toHaveAttribute("data-esc-layer")
  })

  it("끌기(누른 뒤 4px 넘게 움직임) · 상자 안 단추 누름은 고정하지 않는다", () => {
    const { container } = render(<Harness />)
    const box = container.querySelector("[data-lens]") as HTMLElement
    sized(box)
    fireEvent.pointerDown(box, { button: 0, clientX: 50, clientY: 100 })
    fireEvent.click(box, { clientX: 70, clientY: 100 })
    expect(container.querySelector("[data-lens-pinned]")).toBeNull()
    fireEvent.click(screen.getByRole("button", { name: "상자 안 단추" }))
    expect(container.querySelector("[data-lens-pinned]")).toBeNull()
  })

  it("Esc 는 고정만 풀고, 먼저 등록된 바깥 층(사건 창)은 data-esc-layer 를 보고 닫지 않는다", () => {
    const closeWindow = vi.fn()
    // 사건 창 틀(CaseWindowFrame)과 같은 검사 — 먼저 등록
    const outer = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented || document.querySelector("[data-esc-layer]")) return
      closeWindow()
    }
    document.addEventListener("keydown", outer)
    try {
      const { container } = render(<Harness />)
      const box = container.querySelector("[data-lens]") as HTMLElement
      sized(box)
      fireEvent.click(box, { clientX: 50, clientY: 100 })
      expect(container.querySelector("[data-lens-pinned]")).not.toBeNull()
      fireEvent.keyDown(document, { key: "Escape" })
      expect(container.querySelector("[data-lens-pinned]")).toBeNull()
      expect(closeWindow).not.toHaveBeenCalled()
      // 고정이 없으면 Esc 는 바깥 층 몫
      fireEvent.keyDown(document, { key: "Escape" })
      expect(closeWindow).toHaveBeenCalledTimes(1)
    } finally {
      document.removeEventListener("keydown", outer)
    }
  })

  it("onPinChange 가 없으면(살펴보기 판 · 검색 결과 등) 눌러도 고정하지 않는다 — 예전 그대로", () => {
    const { container } = render(<Harness pinnable={false} />)
    const box = container.querySelector("[data-lens]") as HTMLElement
    sized(box)
    fireEvent.click(box, { clientX: 50, clientY: 100 })
    expect(container.querySelector("[data-lens-pinned]")).toBeNull()
    expect(box).not.toHaveAttribute("data-esc-layer")
  })
})
