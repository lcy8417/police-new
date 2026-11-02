import { useCallback, useEffect, useRef, type MouseEvent } from "react"

import { cn } from "@/shared/lib/utils"

import type { Point } from "../lib/polygon-geometry"
import type { EditTool } from "../model/use-image-edit"
import { EditLoadingOverlay } from "./EditLoadingOverlay"
import { PolygonOverlay } from "./PolygonOverlay"

// 첫 정점 근처(px)를 클릭하면 폴리곤을 자동으로 닫고 제출한다(3점 이상 확보 시).
const POLYGON_CLOSE_THRESHOLD = 12

export interface PolygonCaptureCanvasProps {
  /** 현재 편집 툴. background/inpaint일 때만 폴리곤 입력을 활성화한다. */
  activeTool: EditTool | null
  /** 수집된 폴리곤 정점(표시 이미지 rect 기준 정수 px). PolygonOverlay가 그린다. */
  points: Point[]
  /** 좌클릭 정점 추가 — 표시 이미지 rect를 넘겨 canvas-local 좌표로 변환하게 한다. */
  onAddPoint: (clientX: number, clientY: number, rect: DOMRect) => void
  /** 우클릭/더블클릭 폴리곤 제출 — render_size 산정에 같은 표시 이미지 rect를 넘긴다. */
  onSubmitPolygon: (rect: DOMRect) => void
  /** 서버 처리 진행 중 여부(로딩 오버레이). */
  isProcessing: boolean
  /** 처리 중 오버레이 문구(툴별). */
  processingLabel: string
}

/**
 * 폴리곤 입력 오버레이 — PatternCanvas 편집 모드에서 표시 이미지 위에 얹는 순수 입력 레이어.
 * 이미지는 부모(PatternCanvas)가 그리고, 이 컴포넌트는 좌표 캡처와 폴리곤 시각화만 한다.
 *
 * 좌표 계약(EditCanvas와 동일): 부모의 이미지 래퍼가 `w-fit`이라 이 레이어(absolute inset-0
 * size-full)의 canvas rect = 표시 이미지 rect다. 정점 캡처(onAddPoint)와 render_size
 * (onSubmitPolygon) 모두 **이 동일한 rect**를 넘기므로 두 좌표계가 일치한다. 소수 rect라도
 * use-image-edit의 polygon-geometry가 정수화·clamp하므로 rect는 있는 그대로 넘긴다.
 */
export function PolygonCaptureCanvas({
  activeTool,
  points,
  onAddPoint,
  onSubmitPolygon,
  isProcessing,
  processingLabel,
}: PolygonCaptureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const isPolygonTool = activeTool === "background" || activeTool === "inpaint"

  // canvas 비트맵을 자기 자신의 rect(=표시 이미지 rect)에 맞춰 1:1 정렬한다.
  const recompute = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return
    canvas.width = Math.round(rect.width)
    canvas.height = Math.round(rect.height)
  }, [])

  useEffect(() => {
    recompute()
    const canvas = canvasRef.current
    const ro = new ResizeObserver(() => recompute())
    if (canvas) ro.observe(canvas)
    window.addEventListener("resize", recompute)
    return () => {
      ro.disconnect()
      window.removeEventListener("resize", recompute)
    }
  }, [recompute])

  const handleClick = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!isPolygonTool || e.detail > 1) return
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    // 3점 이상 확보 상태에서 첫 정점 근처를 클릭하면 정점 추가 대신 자동으로 닫고 제출한다.
    if (points.length >= 3) {
      const [firstX, firstY] = points[0]
      const localX = e.clientX - rect.left
      const localY = e.clientY - rect.top
      if (Math.hypot(localX - firstX, localY - firstY) <= POLYGON_CLOSE_THRESHOLD) {
        onSubmitPolygon(rect)
        return
      }
    }
    onAddPoint(e.clientX, e.clientY, rect)
  }

  const handleContextMenu = (e: MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    if (!isPolygonTool) return
    const rect = canvasRef.current?.getBoundingClientRect()
    if (rect) onSubmitPolygon(rect)
  }

  const handleDoubleClick = () => {
    if (!isPolygonTool) return
    const rect = canvasRef.current?.getBoundingClientRect()
    if (rect) onSubmitPolygon(rect)
  }

  return (
    <div className="absolute inset-0 z-20">
      {/* 폴리곤 입력 캡처 surface — 폴리곤 툴일 때만 이벤트를 받고 crosshair를 띄운다.
          그 외 툴(threshold/denoise/null)에서는 pointer-events-none으로 통과시킨다. */}
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onDoubleClick={handleDoubleClick}
        className={cn(
          "absolute inset-0 size-full",
          isPolygonTool ? "cursor-crosshair" : "pointer-events-none"
        )}
      />
      {/* 폴리곤 시각화(순수 장식) + 서버 처리 로딩 오버레이. */}
      <PolygonOverlay points={points} activeTool={activeTool} />
      <EditLoadingOverlay show={isProcessing} label={processingLabel} />
    </div>
  )
}
