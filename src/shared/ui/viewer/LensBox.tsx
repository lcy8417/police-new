import * as React from "react"
import { Pin } from "lucide-react"

import { hasLayerAbove } from "@/shared/lib"
import { cn } from "@/shared/lib/utils"

import { LENS_SCALE, lensOffset, type LensZoom } from "./view-tune"

/** 마우스 자리(상자 기준 px)와 그때 상자 크기 */
interface LensPoint {
  x: number
  y: number
  w: number
  h: number
}

/** 확대경이 보고 있는 자리 — 상자 기준 비율 좌표(0~1)와 그때 상자 크기(px). 확대 보기 칸(LensView)이 같은 자리를 그린다 */
export interface LensSpot {
  rx: number
  ry: number
  w: number
  h: number
}

export interface LensBoxProps {
  /** 확대경 켬 */
  enabled: boolean
  /** 지름(px) */
  size: number
  /** 배율 */
  zoom: LensZoom
  /** 확대경 안에 그릴 그림(누를 수 없는 복사본) — 없으면 확대경을 그리지 않는다 */
  source?: React.ReactNode
  /** 보기 조정 클래스(두 겹) — 확대경 안도 같은 모습 */
  tune: { outer: string; inner: string }
  /** 지름 한 걸음 바꾸기(Shift + 휠 · [ ] 키) */
  onSizeStep: (by: 1 | -1) => void
  /** 두 번 누름 — 크게 살펴보기 */
  onDoubleClick?: () => void
  /** 확대경 `data-slot`(화면별 시험 이름) */
  lensSlot?: string
  /** 확대경이 보고 있는 자리가 바뀜(켜져 있고 누르지 않은 채 움직일 때 · 고정할 때) — 확대 보기 칸 */
  onLensMove?: (spot: LensSpot) => void
  /** 고정된 자리(없으면 마우스를 따라감) */
  pin?: LensSpot | null
  /**
   * 고정 · 풀기(null). 주면 「누르면 고정」이 켜진다 — 상자를 누르면 그 자리에 확대경을 멈추고, 다시 누르거나 Esc 로 푼다
   * (11/17 사용자 「클릭하면 고정이 되어야지 저기 오른쪽에 고정이 있으면 어떻게 비교를 해」)
   */
  onPinChange?: (pin: LensSpot | null) => void
  className?: string
  children: React.ReactNode
}

/** 글을 쓰는 중인가(그때는 [ ] 키를 가로채지 않는다) */
const typing = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName))

/** 누른 뒤 이만큼(px) 넘게 움직였으면 끌기 — 고정 누름이 아니다 */
const CLICK_SLOP = 4
/** 상자 안이어도 제 일이 있는 조작 — 눌러도 고정하지 않는다 */
const INTERACTIVE = 'button, a[href], input, select, textarea, label, [role="button"], [role="slider"], [contenteditable="true"]'

/**
 * 공용 확대경 상자(11/17 사용자 「각각 마우스 대면 확대 기능을 달아. 그 원의 크기는 늘릴 수 있고」).
 * 움직임 · 누름은 바깥 상자의 pointer · click 이벤트로만 읽고(막지도 · 가로채지도 않음), 확대경은 `pointer-events-none` 장식이다 —
 * 운영에서 이 상자 안에 들어갈 `PatternCanvas` 의 좌표 판정 · 경계선 끌기를 막지 않는다(docs/api-communication.md §4, 좌표 수학 안 건드림).
 * 고정(`onPinChange` 를 줄 때만): 움직이지 않고 누른 것만 고정 · 풀기로 친다(끌기 · 상자 안 단추는 아님). 고정 중엔 brand 테 + 위 「고정」 핀,
 * 다시 누르거나 Esc 로 푼다(Esc 는 고정을 먼저 풀고 사건 창은 그대로 — 고정 중 `data-esc-layer`). 상자 크기가 바뀌면 같은 비율 자리로 맞춘다.
 * 지름: Shift + 휠 · [ ] 키(마우스가 상자 위에 있을 때). 위치는 런타임 좌표라 인라인 style(CLAUDE.md 예외), 움직임 효과는 없다.
 */
export function LensBox({
  enabled,
  size,
  zoom,
  source,
  tune,
  onSizeStep,
  onDoubleClick,
  lensSlot = "viewer-lens",
  onLensMove,
  pin = null,
  onPinChange,
  className,
  children,
}: LensBoxProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [at, setAt] = React.useState<LensPoint | null>(null)
  const stepRef = React.useRef(onSizeStep)
  const pinRef = React.useRef(pin)
  const pinChangeRef = React.useRef(onPinChange)
  React.useEffect(() => {
    stepRef.current = onSizeStep
    pinRef.current = pin
    pinChangeRef.current = onPinChange
  }, [onSizeStep, pin, onPinChange])
  const down = React.useRef<{ x: number; y: number } | null>(null)
  const on = enabled && source != null
  const pinned = on && pin !== null && onPinChange !== undefined

  // Shift + 휠 = 지름. React 휠 처리기는 passive 라 기본 동작을 못 막아 직접 붙인다
  React.useEffect(() => {
    const el = ref.current
    if (!el || !on) return
    const onWheel = (e: WheelEvent) => {
      if (!e.shiftKey) return
      e.preventDefault()
      stepRef.current(e.deltaY + e.deltaX < 0 ? 1 : -1)
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [on])

  // [ ] 키 = 지름(마우스가 상자 위에 있을 때만)
  const hovering = at !== null
  React.useEffect(() => {
    if (!on || !hovering) return
    const onKey = (e: KeyboardEvent) => {
      if (typing(e.target) || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === "[") stepRef.current(-1)
      else if (e.key === "]") stepRef.current(1)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [on, hovering])

  // 고정 중 Esc = 고정 풀기. 바깥 층(사건 창 · 편집 판)은 먼저 등록돼 있어 고정 중 `data-esc-layer` 를 보고 비켜 서고,
  // 이 상자보다 위에 뜬 층(살펴보기 판 등)이 있으면 그 층 몫이다(한 층씩 — shared/lib/esc-layer)
  React.useEffect(() => {
    if (!pinned) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented || hasLayerAbove(ref.current)) return
      e.preventDefault()
      pinChangeRef.current?.(null)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [pinned])

  // 고정 중 상자 크기가 바뀌면(판 접기 · 폭 조절) 같은 비율 자리로 크기만 맞춘다
  React.useEffect(() => {
    const el = ref.current
    if (!el || !pinned || typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(() => {
      const p = pinRef.current
      const r = el.getBoundingClientRect()
      if (!p || r.width <= 0 || r.height <= 0) return
      if (Math.abs(r.width - p.w) < 0.5 && Math.abs(r.height - p.h) < 0.5) return
      pinChangeRef.current?.({ ...p, w: r.width, h: r.height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [pinned])

  const spotOf = (e: React.MouseEvent<HTMLDivElement>): LensSpot | null => {
    const r = e.currentTarget.getBoundingClientRect()
    if (r.width <= 0 || r.height <= 0) return null
    return { rx: (e.clientX - r.left) / r.width, ry: (e.clientY - r.top) / r.height, w: r.width, h: r.height }
  }

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    // 끄는 중(누른 채 움직임 — 경계선 끌기)에는 확대경을 숨겨 손 밑을 가리지 않는다
    if (!on || e.pointerType === "touch" || e.buttons !== 0) {
      if (at) setAt(null)
      return
    }
    const r = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - r.left
    const y = e.clientY - r.top
    setAt({ x, y, w: r.width, h: r.height })
    // 고정 중에는 확대 보기 칸도 고정 자리 그대로
    if (!pinned && onLensMove && r.width > 0 && r.height > 0) onLensMove({ rx: x / r.width, ry: y / r.height, w: r.width, h: r.height })
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    down.current = e.button === 0 ? { x: e.clientX, y: e.clientY } : null
  }

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const start = down.current
    down.current = null
    if (!on || !onPinChange) return
    // 끌기(경계선 · 그림 이동)는 누름이 아니다
    if (start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > CLICK_SLOP) return
    // 상자 안 단추 · 입력은 제 일만
    const hit = e.target instanceof Element ? e.target.closest(INTERACTIVE) : null
    if (hit && hit !== e.currentTarget && e.currentTarget.contains(hit)) return
    const spot = spotOf(e)
    if (pinned) {
      onPinChange(null)
      if (spot) onLensMove?.(spot)
      return
    }
    if (!spot) return
    onPinChange(spot)
    onLensMove?.(spot)
  }

  const draw: LensPoint | null = !on ? null : pinned && pin ? { x: pin.rx * pin.w, y: pin.ry * pin.h, w: pin.w, h: pin.h } : at
  const off = draw ? lensOffset(draw.x, draw.y, zoom, size) : null
  return (
    <div
      ref={ref}
      data-lens={on ? "on" : "off"}
      data-esc-layer={pinned ? "" : undefined}
      onPointerMove={handleMove}
      onPointerLeave={() => setAt(null)}
      onPointerDown={onPinChange ? handlePointerDown : undefined}
      onClick={onPinChange ? handleClick : undefined}
      onDoubleClick={onDoubleClick}
      className={cn("relative", on && "cursor-crosshair", className)}
    >
      {children}
      {draw && off ? (
        <div
          aria-hidden="true"
          data-slot={lensSlot}
          data-lens-pinned={pinned ? "" : undefined}
          className={cn(
            "pointer-events-none absolute z-[3] overflow-hidden rounded-full border-2 border-solid bg-canvas [box-shadow:0_8px_24px_var(--t-panel-drop)]",
            pinned ? "border-brand" : "border-fg-2"
          )}
          style={{ left: Math.round(draw.x - size / 2), top: Math.round(draw.y - size / 2), width: size, height: size }}
        >
          <div className={cn("absolute origin-top-left", LENS_SCALE[zoom])} style={{ left: off.left, top: off.top, width: draw.w, height: draw.h }}>
            <div className={cn("size-full", tune.outer)}>
              <div className={cn("relative size-full", tune.inner)}>{source}</div>
            </div>
          </div>
          <span className="absolute top-1/2 left-1/2 size-[6px] -translate-1/2 rounded-full border border-solid border-brand" />
          <span className="absolute bottom-[8px] left-1/2 -translate-x-1/2 rounded-[4px] bg-canvas/80 px-[5px] font-code text-[10px] text-fg-2">
            ×{zoom}
          </span>
        </div>
      ) : null}
      {pinned && draw ? (
        // 고정 핀 — 원 위쪽 테에 걸친 작은 표(원 밖이라 지름이 작아도 안 잘린다)
        <span
          aria-hidden="true"
          data-slot="lens-pin"
          className="pointer-events-none absolute z-[4] inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-[2px] rounded-[4px] bg-brand px-[4px] text-[10px] leading-[15px] font-semibold whitespace-nowrap text-paper"
          style={{ left: Math.round(draw.x), top: Math.round(draw.y - size / 2) }}
        >
          <Pin className="size-[9px]" strokeWidth={2.6} />
          고정
        </span>
      ) : null}
    </div>
  )
}
