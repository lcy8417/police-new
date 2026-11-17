import * as React from "react"

import { cn } from "@/shared/lib/utils"
import { partAttrs } from "../part-attrs"

// 판 폭 조절 손잡이(11/17 사용자 「이 사이드바는 좌우 크기 조정 가능하게」 — 사건 창 왼쪽 이미지 목록 · 문양 코드 탭 오른쪽 판).
// WAI-ARIA 창 나누개(window splitter) 모양: 초점을 받는 세로 `separator` + 값(폭 px) · 끌기 · ← → 키(Shift 세 걸음) · Home/End · 두 번 누르면 기본 폭.
// 생김새: 12 폭 누름 자리 가운데 1px 선(`bg-border`) — 올리면 3px `brand-line`, 초점 · 끄는 중 3px `brand`. `bare` 는 평소 선을 숨긴다(가장자리 선 위에 겹칠 때).
// 값만 받고 상태는 들지 않는다(폭 · 기억은 부르는 쪽). 업무 말 없음.

export interface ResizeHandleProps {
  /** 화면 읽기 이름(「문양 · 검색 판 폭」) */
  label: string
  /** 지금 폭(px) — 화면 읽기 값 · 키 기준 */
  value: number
  min: number
  max: number
  /** 새 폭(정수 · min ~ max 로 자른 값) */
  onChange: (next: number) => void
  /** 끌어서 값이 커지는 쪽 — 오른쪽 판의 왼쪽 가장자리 = "left", 왼쪽 목록의 오른쪽 가장자리 = "right" */
  grow: "left" | "right"
  /** 끌기 · 키를 시작할 때 실제 폭을 재는 함수(폭이 아직 CSS 기본값일 때) — 없거나 못 재면 value */
  measure?: () => number | undefined
  /** 두 번 누름 — 기본 폭으로 */
  onReset?: () => void
  /** 키 한 걸음(px, 기본 16 — Shift 면 세 배) */
  step?: number
  /** 평소엔 선을 숨기고 올리거나 초점 · 끄는 중에만 보인다(다른 가장자리 선 위에 겹칠 때) */
  bare?: boolean
  className?: string
  /** 위치 식별자(`data-part-id`) */
  partId?: string
}

export function ResizeHandle({
  label,
  value,
  min,
  max,
  onChange,
  grow,
  measure,
  onReset,
  step = 16,
  bare = false,
  className,
  partId,
}: ResizeHandleProps) {
  const drag = React.useRef<{ x: number; start: number; id: number } | null>(null)
  const [dragging, setDragging] = React.useState(false)
  const clamp = (v: number) => Math.min(max, Math.max(min, Math.round(v)))
  const startValue = () => {
    const m = measure?.()
    return typeof m === "number" && Number.isFinite(m) && m > 0 ? m : value
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    // 끄는 동안 글자가 잡히지 않게
    e.preventDefault()
    const el = e.currentTarget
    if (typeof el.setPointerCapture === "function") el.setPointerCapture(e.pointerId)
    drag.current = { x: e.clientX, start: startValue(), id: e.pointerId }
    setDragging(true)
  }
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    const dx = e.clientX - d.x
    onChange(clamp(d.start + (grow === "right" ? dx : -dx)))
  }
  const handlePointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return
    drag.current = null
    setDragging(false)
    const el = e.currentTarget
    if (typeof el.hasPointerCapture === "function" && el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId)
  }
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const by = step * (e.shiftKey ? 3 : 1)
    const more = grow === "right" ? "ArrowRight" : "ArrowLeft"
    const less = grow === "right" ? "ArrowLeft" : "ArrowRight"
    const next =
      e.key === more ? startValue() + by
      : e.key === less ? startValue() - by
      : e.key === "Home" ? min
      : e.key === "End" ? max
      : null
    if (next === null) return
    e.preventDefault()
    onChange(clamp(next))
  }

  return (
    <div
      {...partAttrs("ResizeHandle", { variant: bare ? "bare" : undefined, state: dragging ? "drag" : undefined, id: partId })}
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      aria-valuenow={Math.round(value)}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={0}
      title={`${label} — 끌거나 ← → 키로 조절${onReset ? " · 두 번 누르면 기본 폭" : ""}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onKeyDown={handleKeyDown}
      onDoubleClick={onReset}
      className={cn("group relative flex w-[12px] shrink-0 cursor-col-resize touch-none justify-center outline-none select-none", className)}
    >
      <span
        aria-hidden="true"
        className={cn(
          "h-full w-px transition-[background-color,width] duration-150 motion-reduce:transition-none",
          bare ? "bg-transparent" : "bg-border",
          "group-hover:w-[3px] group-hover:bg-brand-line group-focus-visible:w-[3px] group-focus-visible:bg-brand",
          dragging && "w-[3px] bg-brand"
        )}
      />
    </div>
  )
}
