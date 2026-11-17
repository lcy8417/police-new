import * as React from "react"

import { shouldHandleShortcut } from "@/shared/lib"
import { cn } from "@/shared/lib/utils"

import { toDisplayFromSaved, type Point } from "../lib/alignment-geometry"
import { sceneImageUrl } from "../lib/scene-image-url"
import type { UseAlignment } from "../model/use-alignment"

// 판 안 정렬 지정 캔버스(11/17 사용자 「영역만 여기서 바로 이미지가 뜨고 지정해주면. 그리고 폴리곤 치기 좀 쉽게 해줘」 ·
// 「정렬 설정 누르면 저기서 바로 설정할 수 있게」). 사건 창 정밀 대조 판(유류 칸)에 그대로 놓는다.
//
// 조작(도구 막대 · 안내 한 줄은 위젯이 그린다 — 여기는 그림 위 입력만):
//   점 찍기  : 누름 = 점, 첫 점(고리)을 누르거나 두 번 누름 · Enter = 닫기, Backspace = 마지막 점 지우기, 점은 끌어 옮김
//   사각형   : 끌기 = 네모(4점 폴리곤) — 그린 뒤에는 닫힌 틀(모서리 · 안쪽 끌기), 다시 끌면 새 네모
//   밑창 틀  : 닫힌 틀 — 안쪽 끌기 = 통째 옮김, 점 끌기 = 모양 맞춤
//   방향     : 닫힌 틀에서 끌지 않고 누르면 앞굽 → 뒤꿈치. 저장된 정렬도 같은 그림 위에 미리 그려 두고 점 · 틀을 끌어 고친다.
// 좌표: 클릭 → `저장 현장 이미지 좌표계` 환산은 훅(`useAlignment` — alignment-geometry 의 computeScale · toSavedPoint · clamp)이 한다.
//   여기는 표시 좌표로 고르기(가까운 점 · 안쪽)만 한다. 그림 상자 = 그림(자연 비율 그대로 칸에 꽉) — `getBoundingClientRect` 가 곧 그림.
// 색은 토큰만(옛 AlignmentCaptureCanvas 의 hex 대신), 겹 그림은 모두 pointer-events-none.

/** 첫 점 이만큼(표시 px) 안을 누르면 닫는다 */
const CLOSE_PX = 12
/** 마지막 점 이만큼 안을 다시 누르면 새 점을 넣지 않는다(두 번 누름으로 닫을 때 겹점 방지) */
const DEDUPE_PX = 5
/** 이만큼 움직여야 끌기(그 아래는 누름) */
const DRAG_PX = 4
/** 사각형 최소 변(표시 px) */
const MIN_RECT_PX = 8
/** 점 고르기 반경(표시 px) */
const HIT_PX = 10

/** 캔버스가 쓰는 정렬 훅 값 · 동작 */
export type AlignmentDrawHandle = Pick<
  UseAlignment,
  | "phase"
  | "drawMode"
  | "polygon"
  | "arrow"
  | "arrowStep"
  | "flipHorizontal"
  | "seedTemplate"
  | "addPoint"
  | "closePolygon"
  | "removeLastPoint"
  | "setRectangle"
  | "dragVertex"
  | "dragShape"
  | "pickArrowPoint"
  | "canClosePolygon"
>

type Drag =
  | { kind: "vertex"; index: number; x: number; y: number; moved: boolean }
  | { kind: "shape"; x: number; y: number; lastX: number; lastY: number; moved: boolean }
  | { kind: "rect"; x: number; y: number }
  | { kind: "click"; x: number; y: number; moved: boolean }

const dist = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1])

/** 점이 다각형 안인가(표시 좌표, 광선 교차) */
function inside(p: Point, poly: readonly Point[]): boolean {
  let hit = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]
    const [xj, yj] = poly[j]
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) hit = !hit
  }
  return hit
}

export interface AlignmentDrawSurfaceProps {
  /** 그릴 그림 주소 — 운영은 `AlignmentDrawCanvas`(저장 원본 고정)를 쓴다. 진열 화면만 표본 사진을 직접 넘긴다 */
  src: string
  align: AlignmentDrawHandle
  /** 그림 대체글 */
  alt?: string
}

/** 판 안 정렬 지정 — 그림 + 영역 · 방향 겹(입력 표면) */
export function AlignmentDrawSurface({ src, align, alt = "정렬용 저장 현장 이미지" }: AlignmentDrawSurfaceProps) {
  const { phase, drawMode, polygon, arrow, arrowStep, flipHorizontal } = align
  const imgRef = React.useRef<HTMLImageElement | null>(null)
  const [natural, setNatural] = React.useState<{ src: string; width: number; height: number } | null>(null)
  const [failed, setFailed] = React.useState<string | null>(null)
  const [box, setBox] = React.useState<{ width: number; height: number } | null>(null)
  const [hover, setHover] = React.useState<Point | null>(null)
  const [rectPreview, setRectPreview] = React.useState<{ a: Point; b: Point } | null>(null)
  const [dragging, setDragging] = React.useState(false)
  const dragRef = React.useRef<Drag | null>(null)
  const markerId = `align-arrow-${React.useId().replace(/:/g, "")}`

  const nat = natural && natural.src === src ? natural : null
  const { seedTemplate } = align
  const onLoaded = React.useCallback(
    (img: HTMLImageElement) => {
      if (img.naturalWidth <= 0 || img.naturalHeight <= 0) return
      setNatural((prev) =>
        prev && prev.src === src && prev.width === img.naturalWidth && prev.height === img.naturalHeight
          ? prev
          : { src, width: img.naturalWidth, height: img.naturalHeight }
      )
      seedTemplate(img.naturalWidth, img.naturalHeight)
    },
    [src, seedTemplate]
  )
  // 캐시 적중으로 onLoad 가 붙기 전에 끝난 그림
  React.useEffect(() => {
    const img = imgRef.current
    if (img?.complete && img.naturalWidth > 0) onLoaded(img)
  }, [onLoaded])

  // 표시 크기(그림 상자) — 칸 크기가 바뀌면 다시
  React.useEffect(() => {
    const img = imgRef.current
    if (!img) return
    const measure = () => {
      const r = img.getBoundingClientRect()
      setBox((prev) => (r.width > 0 && r.height > 0 && (prev?.width !== r.width || prev?.height !== r.height) ? { width: r.width, height: r.height } : prev))
    }
    measure()
    if (typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(measure)
    ro.observe(img)
    return () => ro.disconnect()
  }, [nat])

  const scale = nat && box ? nat.width / box.width : null
  const locked = flipHorizontal || !nat
  const display = React.useMemo(() => (scale ? polygon.map((p) => toDisplayFromSaved(p, scale)) : []), [polygon, scale])
  const displayArrow = scale ? arrow.map((p) => toDisplayFromSaved(p, scale)) : []
  /** 점 찍기 중(아직 열린 선) */
  const open = drawMode === "scratch" && phase === "polygon"
  /** 닫힌 틀(끌어 옮기고 안쪽 누름 = 방향) */
  const closed = polygon.length >= 3 && !open
  const canPick = arrowStep !== "complete" && (phase === "arrow" || (phase === "polygon" && closed))

  const rectOf = () => imgRef.current?.getBoundingClientRect() ?? null
  const local = (e: { clientX: number; clientY: number }, r: DOMRect): Point => [e.clientX - r.left, e.clientY - r.top]
  const vertexAt = (p: Point) => {
    let best = -1
    let bestD = HIT_PX
    display.forEach((v, i) => {
      const d = dist(v, p)
      if (d <= bestD) {
        best = i
        bestD = d
      }
    })
    return best
  }
  const nearFirst = (p: Point | null) => open && display.length >= 3 && p !== null && dist(display[0], p) <= CLOSE_PX

  /** 끌지 않은 누름 */
  const handleClick = (clientX: number, clientY: number, r: DOMRect) => {
    if (locked || !nat) return
    const p = local({ clientX, clientY }, r)
    if (open) {
      if (nearFirst(p) && align.canClosePolygon) {
        align.closePolygon()
        return
      }
      const last = display.at(-1)
      if (last && dist(last, p) <= DEDUPE_PX) return
      align.addPoint(clientX, clientY, r, nat.width)
      return
    }
    if (arrowStep !== "complete" && canPick) align.pickArrowPoint(arrowStep, clientX, clientY, r, nat.width)
  }

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (locked || e.button !== 0) return
    const r = rectOf()
    if (!r) return
    const p = local(e, r)
    const v = vertexAt(p)
    if (v >= 0 && !nearFirst(p)) {
      // 점 끌기(그리는 중 첫 점 고리는 누름 = 닫기라 뺀다)
      dragRef.current = { kind: "vertex", index: v, x: e.clientX, y: e.clientY, moved: false }
    } else if (closed && inside(p, display)) {
      // 틀 안쪽 = 통째 옮기기(끌지 않으면 방향 누름)
      dragRef.current = { kind: "shape", x: e.clientX, y: e.clientY, lastX: e.clientX, lastY: e.clientY, moved: false }
    } else if (drawMode === "rect") {
      // 틀 밖에서 끌기 = 새 네모
      dragRef.current = { kind: "rect", x: e.clientX, y: e.clientY }
    } else {
      dragRef.current = { kind: "click", x: e.clientX, y: e.clientY, moved: false }
    }
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = rectOf()
    if (!r || !nat) return
    const p = local(e, r)
    const drag = dragRef.current
    if (!drag) {
      setHover(p)
      return
    }
    const far = Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > DRAG_PX
    if (drag.kind === "vertex") {
      if (!drag.moved && !far) return
      drag.moved = true
      setDragging(true)
      align.dragVertex(drag.index, e.clientX, e.clientY, r, nat.width)
    } else if (drag.kind === "shape") {
      if (!drag.moved && !far) return
      drag.moved = true
      setDragging(true)
      align.dragShape(e.clientX - drag.lastX, e.clientY - drag.lastY, nat.width, r.width)
      drag.lastX = e.clientX
      drag.lastY = e.clientY
    } else if (drag.kind === "rect") {
      setRectPreview({ a: [drag.x - r.left, drag.y - r.top], b: p })
    } else if (far) {
      drag.moved = true
    }
  }

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    dragRef.current = null
    setDragging(false)
    setRectPreview(null)
    e.currentTarget.releasePointerCapture?.(e.pointerId)
    const r = rectOf()
    if (!drag || !r || !nat) return
    if (drag.kind === "rect") {
      if (Math.abs(e.clientX - drag.x) >= MIN_RECT_PX && Math.abs(e.clientY - drag.y) >= MIN_RECT_PX) {
        align.setRectangle(drag.x, drag.y, e.clientX, e.clientY, r, nat.width)
      } else {
        handleClick(e.clientX, e.clientY, r)
      }
      return
    }
    if (drag.moved) return
    if (drag.kind === "vertex" && open) return // 그리는 중 점 누름은 아무것도(첫 점 닫기는 click 쪽)
    handleClick(e.clientX, e.clientY, r)
  }

  const onDoubleClick = () => {
    if (!locked && open && align.canClosePolygon) align.closePolygon()
  }

  // Enter = 닫기 · Backspace(Delete) = 마지막 점 — 점 찍기 중에만, 글자 입력 · 단추 위 Enter 는 공용 검사가 거른다
  const keyRef = React.useRef<(e: KeyboardEvent) => void>(() => undefined)
  React.useEffect(() => {
    keyRef.current = (e: KeyboardEvent) => {
      if (locked || !open || !shouldHandleShortcut(e)) return
      if (e.key === "Enter" && align.canClosePolygon) {
        e.preventDefault()
        align.closePolygon()
      } else if ((e.key === "Backspace" || e.key === "Delete") && polygon.length > 0) {
        e.preventDefault()
        align.removeLastPoint()
      }
    }
  })
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => keyRef.current(e)
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // 마우스 모양 — 끄는 중 · 점 위 · 닫을 첫 점 · 틀 안 · 그리기
  const hoverVertex = hover ? vertexAt(hover) : -1
  const cursor = locked
    ? "cursor-default"
    : dragging
      ? "cursor-grabbing"
      : nearFirst(hover)
        ? "cursor-pointer"
        : hoverVertex >= 0
          ? "cursor-grab"
          : closed && hover && inside(hover, display)
            ? canPick
              ? "cursor-pointer"
              : "cursor-move"
            : "cursor-crosshair"

  const pts = display.map(([x, y]) => `${x},${y}`).join(" ")
  const last = display.at(-1)
  const [toe, heel] = displayArrow
  const rectBox = rectPreview
    ? {
        x: Math.min(rectPreview.a[0], rectPreview.b[0]),
        y: Math.min(rectPreview.a[1], rectPreview.b[1]),
        w: Math.abs(rectPreview.a[0] - rectPreview.b[0]),
        h: Math.abs(rectPreview.a[1] - rectPreview.b[1]),
      }
    : null

  return (
    <div data-slot="alignment-draw" className="relative grid size-full min-h-0 place-items-center [container-type:size]">
      <div
        data-testid="alignment-draw-surface"
        data-phase={phase}
        data-draw-mode={drawMode}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={() => !dragRef.current && setHover(null)}
        onDoubleClick={onDoubleClick}
        // 그림 상자 = 그림(자연 비율 그대로 칸에 꽉 — 좌표 파생 크기). 크기를 알기 전에는 칸 꽉
        style={
          nat
            ? { width: `min(100cqw, calc(100cqh * ${nat.width} / ${nat.height}))`, aspectRatio: `${nat.width} / ${nat.height}` }
            : undefined
        }
        className={cn(
          "relative touch-none overflow-visible select-none",
          !nat && "size-full",
          cursor,
          flipHorizontal && "scale-x-[-1]"
        )}
      >
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          draggable={false}
          onLoad={(e) => onLoaded(e.currentTarget)}
          onError={() => setFailed(src)}
          className={cn("block size-full select-none", !nat && "object-contain opacity-0")}
        />
        <svg aria-hidden="true" className="pointer-events-none absolute inset-0 size-full overflow-visible">
          <defs>
            <marker id={markerId} markerWidth={8} markerHeight={8} refX={6} refY={4} orient="auto">
              <path d="M0,0 L8,4 L0,8 Z" className="fill-warn" />
            </marker>
          </defs>
          {closed ? (
            <polygon data-align-shape points={pts} className="fill-brand/15 stroke-brand" strokeWidth={2} strokeLinejoin="round" />
          ) : display.length > 1 ? (
            <polyline data-align-line points={pts} className="fill-none stroke-brand" strokeWidth={2} strokeLinejoin="round" />
          ) : null}
          {/* 점 찍기 고무줄 — 마지막 점 → 마우스(첫 점 근처면 첫 점으로) */}
          {open && last && hover && !dragging ? (
            <line
              x1={last[0]}
              y1={last[1]}
              x2={nearFirst(hover) ? display[0][0] : hover[0]}
              y2={nearFirst(hover) ? display[0][1] : hover[1]}
              className="stroke-brand"
              strokeWidth={1.5}
              strokeDasharray="5 4"
              opacity={0.8}
            />
          ) : null}
          {rectBox ? (
            <rect
              data-align-rect-preview
              x={rectBox.x}
              y={rectBox.y}
              width={rectBox.w}
              height={rectBox.h}
              className="fill-brand/10 stroke-brand"
              strokeWidth={1.5}
              strokeDasharray="6 4"
            />
          ) : null}
          {display.map(([x, y], i) => {
            const closer = open && i === 0 && display.length >= 3
            return (
              <g key={i} data-align-vertex={i}>
                {closer ? (
                  // 첫 점 고리 — 누르면 닫힘(가까이 가면 굵게)
                  <circle cx={x} cy={y} r={nearFirst(hover) ? 10 : 8} className="fill-none stroke-ok" strokeWidth={2} />
                ) : null}
                <circle
                  cx={x}
                  cy={y}
                  r={hoverVertex === i ? 6.5 : 5}
                  className={cn("stroke-canvas", closer ? "fill-ok" : "fill-brand")}
                  strokeWidth={1.5}
                />
              </g>
            )
          })}
          {toe && heel ? (
            <line
              x1={heel[0]}
              y1={heel[1]}
              x2={toe[0]}
              y2={toe[1]}
              className="stroke-warn"
              strokeWidth={2.5}
              markerEnd={`url(#${markerId})`}
            />
          ) : null}
          {displayArrow.map(([x, y], i) => (
            <g key={`arrow-${i}`} data-align-arrow={i === 0 ? "toe" : "heel"}>
              <circle cx={x} cy={y} r={6} className="fill-warn stroke-canvas" strokeWidth={1.5} />
              <text
                x={x + 9}
                y={y - 8}
                className="fill-warn stroke-canvas font-ui text-[11px] font-bold [paint-order:stroke]"
                strokeWidth={3}
              >
                {i === 0 ? "앞굽" : "뒤꿈치"}
              </text>
            </g>
          ))}
        </svg>
      </div>
      {failed === src ? (
        <span role="alert" className="pointer-events-none absolute text-[12px] text-danger-fg">
          현장 이미지를 불러오지 못했습니다
        </span>
      ) : !nat ? (
        <span role="status" className="pointer-events-none absolute text-[12px] text-muted-foreground">
          현장 이미지 불러오는 중
        </span>
      ) : null}
      {flipHorizontal ? (
        <span className="pointer-events-none absolute bottom-[8px] rounded-[6px] bg-canvas/90 px-[8px] py-[3px] text-[11px] text-brand">
          좌우 반전 미리보기 — 고치려면 반전을 끄세요
        </span>
      ) : null}
    </div>
  )
}

export interface AlignmentDrawCanvasProps {
  /** 정렬 대상 감정물 번호 — 그림은 항상 저장 원본 `sceneImageUrl(aprthngNo)`(REQ-ALIGN-002b — 편집본을 받는 prop 이 없다) */
  aprthngNo: string
  align: AlignmentDrawHandle
}

/** 운영 판 안 정렬 지정 — 저장 현장 원본 고정 */
export function AlignmentDrawCanvas({ aprthngNo, align }: AlignmentDrawCanvasProps) {
  return <AlignmentDrawSurface src={sceneImageUrl(aprthngNo)} align={align} />
}
