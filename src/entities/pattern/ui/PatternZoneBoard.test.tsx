import { fireEvent, render, screen, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import type { PatternZoneCards } from "../model/view"
import { PatternZoneBoard } from "./PatternZoneBoard"

const zones = (top: PatternZoneCards["top"]): PatternZoneCards => ({ top, mid: [], bottom: [], outline: [] })

describe("PatternZoneBoard — 공용 4부위 문양 행", () => {
  it("crime 카드: 코드 글자 · 확신도 막대 없이 AI 점수 · 가중치 세그먼트(낮 · 보 · 높) · 필수 진한 테", () => {
    const onWeight = vi.fn()
    render(
      <PatternZoneBoard
        zones={zones([{ name: "n32_04", src: "/x/n32_04.png", status: "ai", must: true, score: 0.91, weight: { level: "low", manual: false, why: "R2" } }])}
        selectedZone="top"
        onSelectZone={() => undefined}
        onRemove={() => undefined}
        onToggleMust={() => undefined}
        onWeight={onWeight}
        canEdit
      />,
    )
    const board = screen.getByRole("group", { name: "현장 이미지 문양" })
    expect(board).not.toHaveTextContent("n32_04")
    expect(within(board).queryByRole("meter")).toBeNull()
    expect(board).toHaveTextContent("0.91")
    expect(board.querySelector('[data-must="on"]')).not.toBeNull()
    const seg = within(board).getByRole("group", { name: "상 n32_04 가중치 낮음" })
    fireEvent.click(within(seg).getByRole("button", { name: "가중치 높음" }))
    expect(onWeight).toHaveBeenCalledWith("top", 0, "high")
  })

  it("shoe 모드(필수 · 가중치 콜백 없음): 필수 · 가중치 단추를 그리지 않는다", () => {
    render(
      <PatternZoneBoard
        label="부위별 문양"
        zones={zones([{ name: "s21b", src: "/x/s21b.png", status: "manual" }])}
        selectedZone="top"
        onSelectZone={() => undefined}
        onRemove={() => undefined}
        canEdit
      />,
    )
    const board = screen.getByRole("group", { name: "부위별 문양" })
    expect(within(board).queryByRole("button", { name: /^필수/ })).toBeNull()
    expect(within(board).queryByRole("group", { name: /가중치/ })).toBeNull()
    expect(within(board).getByRole("button", { name: "빼기 · 상 s21b" })).toBeInTheDocument()
  })
})
