import { useCallback, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react"

import { cn } from "@/shared/lib/utils"

import type { AlignmentPhase, ArrowStep, DrawMode } from "../model/use-alignment"
import { sceneImageUrl } from "../lib/scene-image-url"
import { toDisplayFromSaved, type Point } from "../lib/alignment-geometry"

/** 첫 정점 근처(px, 표시 좌표 기준)를 클릭하면 폴리곤을 자동으로 닫는다(scratch 모드 전용). */
const POLYGON_CLOSE_THRESHOLD = 12
/** 정점 핸들 히트 반경(px, 표시 좌표 기준) — 드래그 시작점을 정점으로 인식하는 범위. */
const VERTEX_HIT_RADIUS = 10

export interface AlignmentCaptureCanvasProps {
  /** 정렬 대상 사건 번호 — 이미지 소스는 항상 `sceneImageUrl(crimeNumber)`(저장 원본) 고정. */
  crimeNumber: string
  /** 폴리곤 정점(`저장 현장 이미지 좌표계`). */
  polygon: Point[]
  /** 방향 화살표 정점(`저장 현장 이미지 좌표계`) — [toe] 또는 [toe, heel] 또는 []. */
  arrow: Point[]
  /** 현재 캡처 단계 — review(완료)면 입력을 받지 않는다. */
  phase: AlignmentPhase
  /** 폴리곤 입력 모드 — template(드래그 조정) | scratch(클릭으로 그리기). */
  drawMode: DrawMode
  /** 다음에 선택해야 할 방향 단계(toe/heel/complete) — 클릭이 어느 점을 채우는지 결정한다. */
  arrowStep: ArrowStep
  /** 좌우 반전 프리뷰 상태(REQ-ALIGN-020a) — 켜지면 표시만 미러링되고 입력은 잠긴다(미리보기 전용). */
  flipHorizontal: boolean
  /** 이미지 자연 크기를 알게 되면 밑창 템플릿 시드를 시도한다(복원본이 있으면 무시됨). */
  onImageNaturalSize: (naturalWidth: number, naturalHeight: number) => void
  /** scratch 모드 좌클릭 정점 추가 — 표시 이미지 rect + naturalWidth를 그대로 넘긴다(환산은 훅이 수행). */
  onAddPoint: (clientX: number, clientY: number, rect: DOMRect, naturalWidth: number) => void
  /** 폴리곤 닫기(더블클릭 또는 첫 정점 근처 클릭, scratch 모드). */
  onClosePolygon: () => void
  /** 전체 이동 드래그 — 표시 좌표 델타(px)를 그대로 넘긴다(환산은 훅이 수행). */
  onMoveWholeShape: (dxDisplay: number, dyDisplay: number, naturalWidth: number, dispWidth: number) => void
  /** 정점별 조정 드래그. */
  onMoveVertex: (index: number, clientX: number, clientY: number, rect: DOMRect, naturalWidth: number) => void
  /** 앞굽/뒤꿈치 지정 클릭(arrow 단계). */
  onPickArrowPoint: (
    kind: "toe" | "heel",
    clientX: number,
    clientY: number,
    rect: DOMRect,
    naturalWidth: number
  ) => void
}

type DragState =
  | { kind: "vertex"; index: number }
  | { kind: "shape"; lastClientX: number; lastClientY: number }
  | null

/**
 * 정렬 캔버스 — 밑창 템플릿 폴리곤(드래그 조정) + 앞굽/뒤꿈치 명시 선택 입력 표면
 * (v0.6.0 CHANGE 3). 좌우 반전 프리뷰(CHANGE 5)도 이 컴포넌트가 표시한다.
 *
 * [HARD] REQ-ALIGN-002b: 이 컴포넌트는 `sceneImageUrl(crimeNumber)`(저장 원본
 * `static/crime_images/<n>.png`)**만** 이미지 소스로 사용한다. 편집 이미지 관련
 * prop(페이지의 편집 결과 이미지 필드, 편집 훅의 표시 이미지 등)을 일절 받지
 * 않는다 — 페이지의 원본/편집 토글 상태와 완전히 무관한 독립 컴포넌트다(props
 * 목록 자체에 그런 필드가 없으므로 구조적으로 편집 이미지를 소스로 쓸 수 없다).
 * (본 슬라이스는 정적 검사로 그 필드명 리터럴을 소스에 두지 않는다 — AC-ALIGN-021.)
 *
 * `PatternCanvas`(features/patterns-extract) 좌표 수학은 절대 수정하지 않는다 —
 * 이 컴포넌트는 완전히 독립된 캔버스다(REQ-ALIGN-014, plan.md §G).
 */
export function AlignmentCaptureCanvas({
  crimeNumber,
  polygon,
  arrow,
  phase,
  drawMode,
  arrowStep,
  flipHorizontal,
  onImageNaturalSize,
  onAddPoint,
  onClosePolygon,
  onMoveWholeShape,
  onMoveVertex,
  onPickArrowPoint,
}: AlignmentCaptureCanvasProps) {
  const imgRef = useRef<HTMLImageElement | null>(null)
  const [rect, setRect] = useState<{ width: number; height: number } | null>(null)
  const [naturalWidth, setNaturalWidth] = useState(0)
  const dragRef = useRef<DragState>(null)

  const recompute = useCallback(() => {
    const img = imgRef.current
    if (!img) return
    const r = img.getBoundingClientRect()
    if (r.width === 0 || r.height === 0) return
    setRect({ width: r.width, height: r.height })
  }, [])

  useEffect(() => {
    recompute()
    const img = imgRef.current
    const ro = new ResizeObserver(() => recompute())
    if (img) ro.observe(img)
    window.addEventListener("resize", recompute)
    return () => {
      ro.disconnect()
      window.removeEventListener("resize", recompute)
    }
  }, [recompute])

  const handleImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget
      setNaturalWidth(img.naturalWidth)
      recompute()
      onImageNaturalSize(img.naturalWidth, img.naturalHeight)
    },
    [recompute, onImageNaturalSize]
  )

  const scale = naturalWidth > 0 && rect ? naturalWidth / rect.width : null
  // 반전 프리뷰가 켜지면 표시 전용 — 좌표 캡처는 잠근다(REQ-ALIGN-020a: 표시 계층 변환일 뿐).
  const isDrawing = phase !== "review" && !flipHorizontal

  // ─── scratch 모드 클릭(폴리곤 추가/닫기) + arrow 단계 클릭(앞굽/뒤꿈치 지정) ───
  const handleSurfaceClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!isDrawing) return
    const img = imgRef.current
    if (!img || naturalWidth === 0) return
    const r = img.getBoundingClientRect()
    if (r.width === 0 || r.height === 0) return

    if (phase === "polygon" && drawMode === "scratch") {
      if (polygon.length >= 3 && scale) {
        const [firstX, firstY] = toDisplayFromSaved(polygon[0], scale)
        const localX = e.clientX - r.left
        const localY = e.clientY - r.top
        if (Math.hypot(localX - firstX, localY - firstY) <= POLYGON_CLOSE_THRESHOLD) {
          onClosePolygon()
          return
        }
      }
      onAddPoint(e.clientX, e.clientY, r, img.naturalWidth)
      return
    }

    if (phase === "arrow" && arrowStep !== "complete") {
      onPickArrowPoint(arrowStep, e.clientX, e.clientY, r, img.naturalWidth)
    }
  }

  const handleDoubleClick = () => {
    if (phase === "polygon" && drawMode === "scratch") onClosePolygon()
  }

  // ─── 드래그: 전체 이동(도형 내부) + 정점별 조정(핸들) — REQ-ALIGN-018 ───
  const beginShapeDrag = (e: ReactMouseEvent) => {
    if (phase !== "polygon" || drawMode !== "template" || !isDrawing) return
    e.stopPropagation()
    dragRef.current = { kind: "shape", lastClientX: e.clientX, lastClientY: e.clientY }
  }

  const beginVertexDrag = (e: ReactMouseEvent, index: number) => {
    if (phase !== "polygon" || drawMode !== "template" || !isDrawing) return
    e.stopPropagation()
    dragRef.current = { kind: "vertex", index }
  }

  useEffect(() => {
    const handleMouseMove = (e: globalThis.MouseEvent) => {
      const drag = dragRef.current
      if (!drag) return
      const img = imgRef.current
      if (!img || naturalWidth === 0) return
      const r = img.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) return

      if (drag.kind === "shape") {
        const dx = e.clientX - drag.lastClientX
        const dy = e.clientY - drag.lastClientY
        if (dx !== 0 || dy !== 0) {
          onMoveWholeShape(dx, dy, img.naturalWidth, r.width)
          dragRef.current = { kind: "shape", lastClientX: e.clientX, lastClientY: e.clientY }
        }
      } else {
        onMoveVertex(drag.index, e.clientX, e.clientY, r, img.naturalWidth)
      }
    }
    const handleMouseUp = () => {
      dragRef.current = null
    }
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [naturalWidth, onMoveWholeShape, onMoveVertex])

  const displayPolygon = scale ? polygon.map((p) => toDisplayFromSaved(p, scale)) : []
  const displayArrow = scale ? arrow.map((p) => toDisplayFromSaved(p, scale)) : []
  const polygonPointsAttr = displayPolygon.map(([x, y]) => `${x},${y}`).join(" ")
  const isTemplateDraggable = phase === "polygon" && drawMode === "template" && isDrawing

  return (
    <div className="relative flex h-full w-fit max-w-full items-center justify-center">
      <div
        className={cn(
          "relative flex h-full w-fit max-w-full items-center justify-center transition-transform duration-300",
          flipHorizontal && "scale-x-[-1]"
        )}
      >
        <img
          ref={imgRef}
          src={sceneImageUrl(crimeNumber)}
          alt="정렬용 저장 현장 이미지"
          draggable={false}
          onLoad={handleImageLoad}
          className="h-full w-auto max-w-full object-contain select-none"
        />

        <div
          data-testid="alignment-surface"
          onClick={handleSurfaceClick}
          onDoubleClick={handleDoubleClick}
          className={cn(
            "absolute inset-0",
            isDrawing ? "cursor-crosshair" : "pointer-events-none"
          )}
        >
          {(displayPolygon.length > 0 || displayArrow.length > 0) && (
            <svg
              className="pointer-events-none absolute inset-0 size-full overflow-visible"
              aria-hidden="true"
            >
              <defs>
                <marker
                  id="alignment-arrow-head"
                  markerWidth={8}
                  markerHeight={8}
                  refX={6}
                  refY={4}
                  orient="auto"
                >
                  <path d="M0,0 L8,4 L0,8 Z" fill="#EF4444" />
                </marker>
              </defs>

              {/* 폴리곤 본체 — 채워진 반투명 영역이 "전체 이동" 드래그 핸들이다(template 모드). */}
              {displayPolygon.length >= 2 && (
                <polygon
                  points={polygonPointsAttr}
                  fill="rgba(74,158,255,0.14)"
                  stroke="#4A9EFF"
                  strokeWidth={2}
                  data-testid="alignment-shape-handle"
                  onMouseDown={beginShapeDrag}
                  className={cn(isTemplateDraggable && "pointer-events-auto cursor-move")}
                />
              )}

              {/* 정점 핸들 — template 모드에서 드래그로 개별 조정(정점별 조정). */}
              {displayPolygon.map(([x, y], idx) => (
                <circle
                  key={`poly-${idx}`}
                  cx={x}
                  cy={y}
                  r={VERTEX_HIT_RADIUS - 4}
                  fill="#4A9EFF"
                  stroke="#0B121D"
                  strokeWidth={1.5}
                  data-testid={`alignment-vertex-${idx}`}
                  onMouseDown={(e) => beginVertexDrag(e, idx)}
                  className={cn(isTemplateDraggable && "pointer-events-auto cursor-grab")}
                />
              ))}

              {displayArrow.length === 2 && (
                <line
                  x1={displayArrow[0][0]}
                  y1={displayArrow[0][1]}
                  x2={displayArrow[1][0]}
                  y2={displayArrow[1][1]}
                  stroke="#EF4444"
                  strokeWidth={2}
                  markerEnd="url(#alignment-arrow-head)"
                />
              )}
              {displayArrow.map(([x, y], idx) => (
                <g key={`arrow-${idx}`}>
                  <circle cx={x} cy={y} r={5} fill="#EF4444" stroke="#0B121D" strokeWidth={1.5} />
                  <text
                    x={x + 8}
                    y={y - 8}
                    fill="#F87171"
                    fontSize={11}
                    fontFamily="ui-monospace, monospace"
                  >
                    {idx === 0 ? "앞굽" : "뒤꿈치"}
                  </text>
                </g>
              ))}
            </svg>
          )}
        </div>
      </div>

      {flipHorizontal && (
        <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-3">
          <span className="rounded-md border border-[#4A9EFF]/40 bg-[#0B121D]/85 px-2.5 py-1 font-mono text-[10px] tracking-[0.12em] text-[#4A9EFF] uppercase backdrop-blur-sm">
            반전 미리보기 — 조정하려면 반전을 해제하세요
          </span>
        </div>
      )}
    </div>
  )
}
