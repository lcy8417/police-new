import * as React from "react"

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
  /** 확대경이 보고 있는 자리가 바뀜(켜져 있고 누르지 않은 채 움직일 때만) — 확대 보기 칸 */
  onLensMove?: (spot: LensSpot) => void
  className?: string
  children: React.ReactNode
}

/** 글을 쓰는 중인가(그때는 [ ] 키를 가로채지 않는다) */
const typing = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName))

/**
 * 공용 확대경 상자(11/17 사용자 「각각 마우스 대면 확대 기능을 달아. 그 원의 크기는 늘릴 수 있고」).
 * 움직임은 바깥 상자의 pointer 이벤트로만 읽고(막지도 · 가로채지도 않음), 확대경은 `pointer-events-none` 장식이다 —
 * 운영에서 이 상자 안에 들어갈 `PatternCanvas` 의 좌표 판정 · 경계선 끌기를 막지 않는다(docs/api-communication.md §4, 좌표 수학 안 건드림).
 * 지름: Shift + 휠 · [ ] 키(마우스가 상자 위에 있을 때). 위치는 런타임 좌표라 인라인 style(CLAUDE.md 예외), 움직임 효과는 없다.
 */
export function LensBox({ enabled, size, zoom, source, tune, onSizeStep, onDoubleClick, lensSlot = "viewer-lens", onLensMove, className, children }: LensBoxProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [at, setAt] = React.useState<LensPoint | null>(null)
  const stepRef = React.useRef(onSizeStep)
  React.useEffect(() => {
    stepRef.current = onSizeStep
  }, [onSizeStep])
  const on = enabled && source != null

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
    if (onLensMove && r.width > 0 && r.height > 0) onLensMove({ rx: x / r.width, ry: y / r.height, w: r.width, h: r.height })
  }

  const off = at ? lensOffset(at.x, at.y, zoom, size) : null
  return (
    <div
      ref={ref}
      data-lens={on ? "on" : "off"}
      onPointerMove={handleMove}
      onPointerLeave={() => setAt(null)}
      onDoubleClick={onDoubleClick}
      className={cn("relative", on && "cursor-crosshair", className)}
    >
      {children}
      {on && at && off ? (
        <div
          aria-hidden="true"
          data-slot={lensSlot}
          className="pointer-events-none absolute z-[3] overflow-hidden rounded-full border-2 border-solid border-fg-2 bg-canvas [box-shadow:0_8px_24px_var(--t-panel-drop)]"
          style={{ left: Math.round(at.x - size / 2), top: Math.round(at.y - size / 2), width: size, height: size }}
        >
          <div className={cn("absolute origin-top-left", LENS_SCALE[zoom])} style={{ left: off.left, top: off.top, width: at.w, height: at.h }}>
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
    </div>
  )
}
