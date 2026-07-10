import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

import { fetchPerspective } from "@/services/api"

/** 증거 이미지 위에서 활성화되는 클라이언트 편집 모드. 상호배타적이다. */
export type EditorMode = "none" | "crop" | "calibration" | "measure"

interface Point {
  x: number
  y: number
}

/** 표시된 이미지에 대해 측정된 오버레이 canvas의 위치 + 크기. */
interface OverlayRect {
  left: number
  top: number
  width: number
  height: number
}

const MIN_CROP = 5
const POINT_COLORS = ["#ff4d4f", "#52c41a", "#4a9eff", "#faad14"]
/** 길이측정 색상: 기준선(P1·P2)은 파랑, 측정선(P3·P4)은 빨강. */
const MEASURE_REF = "#4a9eff"
const MEASURE_LINE = "#ff4d4f"

/**
 * `/crimeRegister`용 클라이언트 증거-이미지 편집기: 사각형 크롭, 4점 원근(각도
 * 보정), 그리고 길이측정. 표시된 `<img>` 위에 픽셀 단위로 정확히 겹쳐진 하나의
 * 오버레이 `<canvas>`를 공유한다.
 *
 * 크롭 수학은 레거시 `Canvas.jsx`(`cropImageBySelection`)에서 이식했다: 선택
 * 영역을 canvas/CSS 픽셀로 잡은 뒤 오프스크린 canvas로 이미지의 자연 픽셀에
 * 맞춰 스케일한다. 각도보정은 레거시 `useCalibration.js` 변환(canvas 좌표 →
 * 0~1 상대 → 자연 픽셀)을 그대로 따르며 `fetchPerspective`로 POST하고, 요청은
 * TanStack 뮤테이션을 거쳐 앱 전역 `MutationCache` 토스트가 실패를 보고한다.
 * 길이측정은 레거시 `ImageLoader.jsx`의 측정 로직을 이식했다: P1·P2로 알려진
 * 1cm 기준의 픽셀↔cm 배율을 정하고 P3·P4로 실제 길이를 잰다(거리 비율이라
 * 표시 픽셀 공간에서 스케일 불변).
 *
 * 정렬 전략: 오버레이는 `containerRef` 기준으로 `imgRef.getBoundingClientRect()`
 * 에서 측정하므로, 패널의 반응형 `object-contain` 크기와 무관하게 이미지를
 * 정확히 추적한다.
 */
export function useImageEditor(image: string | null, onImageChange: (next: string) => void) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const overlayRef = useRef<HTMLCanvasElement | null>(null)

  const [mode, setMode] = useState<EditorMode>("none")
  const [overlayRect, setOverlayRect] = useState<OverlayRect | null>(null)

  // 각도보정 점(canvas 픽셀 좌표).
  const [points, setPoints] = useState<Point[]>([])

  // 길이측정 점(canvas 픽셀 좌표) + 커서(P4 배치 전 실시간 미리보기용).
  const [measurePoints, setMeasurePoints] = useState<Point[]>([])
  const [cursorPos, setCursorPos] = useState<Point | null>(null)

  // 크롭 선택 영역을 state(재그리기용)와 ref(안정적인 applyCrop용)에 둔다.
  const [selStart, setSelStart] = useState<Point>({ x: 0, y: 0 })
  const [selEnd, setSelEnd] = useState<Point>({ x: 0, y: 0 })
  const [isSelecting, setIsSelecting] = useState(false)
  const selStartRef = useRef<Point>({ x: 0, y: 0 })
  const selEndRef = useRef<Point>({ x: 0, y: 0 })

  const resetSelection = useCallback(() => {
    setPoints([])
    setMeasurePoints([])
    setCursorPos(null)
    setIsSelecting(false)
    setSelStart({ x: 0, y: 0 })
    setSelEnd({ x: 0, y: 0 })
    selStartRef.current = { x: 0, y: 0 }
    selEndRef.current = { x: 0, y: 0 }
  }, [])

  // 표시된 이미지에 맞춰 오버레이를 측정한다. 마우스/canvas 좌표가 1:1로
  // 대응하도록 canvas 비트맵 크기도 CSS 크기에 맞춘다.
  const recomputeOverlay = useCallback(() => {
    const img = imgRef.current
    const container = containerRef.current
    if (!img || !container) return
    const ir = img.getBoundingClientRect()
    const cr = container.getBoundingClientRect()
    if (ir.width === 0 || ir.height === 0) return
    setOverlayRect({
      left: ir.left - cr.left,
      top: ir.top - cr.top,
      width: ir.width,
      height: ir.height,
    })
    const canvas = overlayRef.current
    if (canvas) {
      canvas.width = Math.round(ir.width)
      canvas.height = Math.round(ir.height)
    }
  }, [])

  // 모드가 활성인 동안 오버레이 정렬을 유지한다(반응형 리사이즈 등).
  useEffect(() => {
    if (mode === "none") return
    recomputeOverlay()
    const img = imgRef.current
    const ro = new ResizeObserver(() => recomputeOverlay())
    if (img) ro.observe(img)
    window.addEventListener("resize", recomputeOverlay)
    return () => {
      ro.disconnect()
      window.removeEventListener("resize", recomputeOverlay)
    }
  }, [mode, image, recomputeOverlay])

  // 이미지를 떠나면(초기화) 활성 모드를 종료하고, 새 이미지는 이전 표식을 지운다.
  useEffect(() => {
    if (!image) setMode("none")
    resetSelection()
  }, [image, resetSelection])

  // 오버레이에 크롭 사각형 / 4개 각도보정 표식 / 길이측정 선을 그린다.
  useEffect(() => {
    const canvas = overlayRef.current
    if (!canvas || mode === "none") return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (mode === "crop") {
      const w = Math.abs(selEnd.x - selStart.x)
      const h = Math.abs(selEnd.y - selStart.y)
      if (w < 1 || h < 1) return
      const x = Math.min(selStart.x, selEnd.x)
      const y = Math.min(selStart.y, selEnd.y)
      ctx.save()
      // 선택 영역 바깥을 어둡게 처리.
      ctx.fillStyle = "rgba(5,8,13,0.55)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.clearRect(x, y, w, h)
      ctx.strokeStyle = "rgba(74,158,255,0.95)"
      ctx.lineWidth = 2
      ctx.setLineDash([6, 4])
      ctx.strokeRect(x, y, w, h)
      // 모서리 핸들.
      ctx.setLineDash([])
      ctx.fillStyle = "rgba(74,158,255,0.95)"
      const hs = 8
      ;[
        [x, y],
        [x + w, y],
        [x, y + h],
        [x + w, y + h],
      ].forEach(([cx, cy]) => ctx.fillRect(cx - hs / 2, cy - hs / 2, hs, hs))
      ctx.restore()
      return
    }

    if (mode === "measure") {
      const mp = measurePoints
      // P1·P2 거리 = 1cm 기준 → 픽셀당 cm 배율.
      const pxPerCm =
        mp.length >= 2 ? Math.hypot(mp[0].x - mp[1].x, mp[0].y - mp[1].y) : 0

      const drawLine = (a: Point, b: Point, color: string) => {
        ctx.strokeStyle = color
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.stroke()
      }
      const drawTag = (p: Point, text: string, color: string) => {
        ctx.font = "bold 13px Arial"
        const w = ctx.measureText(text).width
        ctx.fillStyle = "rgba(5,8,13,0.82)"
        ctx.fillRect(p.x + 8, p.y - 22, w + 10, 18)
        ctx.fillStyle = color
        ctx.fillText(text, p.x + 13, p.y - 9)
      }

      // 기준선 P1-P2 (파랑).
      if (mp.length >= 2) {
        drawLine(mp[0], mp[1], MEASURE_REF)
        drawTag(
          { x: (mp[0].x + mp[1].x) / 2, y: (mp[0].y + mp[1].y) / 2 },
          "기준 1cm",
          MEASURE_REF
        )
      }

      // 측정선 P3-(P4 또는 커서) (빨강) + 실측 cm.
      const end = mp[3] ?? (mp.length === 3 ? cursorPos : null)
      if (mp[2] && end && pxPerCm > 0) {
        drawLine(mp[2], end, MEASURE_LINE)
        const cm = Math.hypot(mp[2].x - end.x, mp[2].y - end.y) / pxPerCm
        drawTag(
          { x: (mp[2].x + end.x) / 2, y: (mp[2].y + end.y) / 2 },
          `${cm.toFixed(2)} cm`,
          MEASURE_LINE
        )
      }

      // 각 점(원 + 라벨). 앞 2개는 기준(파랑), 뒤 2개는 측정(빨강).
      mp.forEach((pt, i) => {
        const color = i < 2 ? MEASURE_REF : MEASURE_LINE
        ctx.beginPath()
        ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.fill()
        ctx.font = "bold 12px Arial"
        ctx.fillText(`P${i + 1}`, pt.x + 7, pt.y - 7)
      })
      return
    }

    // 각도보정 — X 표식 + 번호, 그리고 가이드 다각형.
    if (points.length > 1) {
      ctx.strokeStyle = "rgba(74,158,255,0.6)"
      ctx.lineWidth = 1
      ctx.setLineDash([4, 3])
      ctx.beginPath()
      points.forEach((pt, i) => (i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)))
      if (points.length === 4) ctx.closePath()
      ctx.stroke()
      ctx.setLineDash([])
    }
    points.forEach((pt, i) => {
      const size = 7
      const color = POINT_COLORS[i] ?? "#ff4d4f"
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(pt.x - size, pt.y - size)
      ctx.lineTo(pt.x + size, pt.y + size)
      ctx.moveTo(pt.x - size, pt.y + size)
      ctx.lineTo(pt.x + size, pt.y - size)
      ctx.stroke()
      ctx.fillStyle = color
      ctx.font = "bold 14px Arial"
      ctx.fillText(String(i + 1), pt.x + size + 3, pt.y - size - 3)
    })
  }, [mode, overlayRect, points, selStart, selEnd, measurePoints, cursorPos])

  // 마우스 이벤트를 canvas 픽셀 좌표로 변환한다.
  const canvasPoint = useCallback((e: MouseEvent): Point | null => {
    const canvas = overlayRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY }
  }, [])

  // 크롭은 현재 선택 영역을 자연 해상도로 잘라낸다.
  const applyCrop = useCallback(async () => {
    const canvas = overlayRef.current
    if (!image || !canvas) return
    const start = selStartRef.current
    const end = selEndRef.current
    const x = Math.min(start.x, end.x)
    const y = Math.min(start.y, end.y)
    const w = Math.abs(end.x - start.x)
    const h = Math.abs(end.y - start.y)
    if (w < MIN_CROP || h < MIN_CROP) {
      toast.error("크롭 영역을 드래그하여 지정해주세요")
      return
    }
    const source = new Image()
    source.src = image
    await source.decode()
    const scaleX = source.naturalWidth / canvas.width
    const scaleY = source.naturalHeight / canvas.height
    const sx = Math.round(x * scaleX)
    const sy = Math.round(y * scaleY)
    const sw = Math.round(w * scaleX)
    const sh = Math.round(h * scaleY)
    const out = document.createElement("canvas")
    out.width = sw
    out.height = sh
    const ctx = out.getContext("2d")
    if (!ctx) return
    ctx.drawImage(source, sx, sy, sw, sh, 0, 0, sw, sh)
    onImageChange(out.toDataURL("image/png"))
  }, [image, onImageChange])

  const perspective = useMutation({
    mutationFn: (polygon: number[][]) =>
      fetchPerspective(image, polygon) as Promise<{ image: string }>,
    meta: { success: "각도 보정이 완료되었습니다." },
    onSuccess: (data) => {
      onImageChange(data.image)
      setMode("none")
      resetSelection()
    },
    // 실패 시 앱 전역 MutationCache 토스트가 뜬다; 재시도할 수 있게 점을 비운다.
    onError: () => setPoints([]),
  })

  // 크롭 버튼: 첫 클릭은 크롭 모드 진입, 두 번째 클릭은 적용 + 종료.
  const toggleCrop = useCallback(async () => {
    if (!image) {
      toast.error("이미지를 먼저 등록해주세요")
      return
    }
    if (mode === "crop") {
      await applyCrop()
      setMode("none")
      resetSelection()
    } else {
      resetSelection()
      setMode("crop")
    }
  }, [image, mode, applyCrop, resetSelection])

  // 각도보정 버튼: 4점 모드를 켜고 끈다.
  const toggleCalibration = useCallback(() => {
    if (!image) {
      toast.error("이미지를 먼저 등록해주세요")
      return
    }
    resetSelection()
    setMode((m) => (m === "calibration" ? "none" : "calibration"))
  }, [image, resetSelection])

  // 길이측정 버튼: 측정 모드를 켜고 끈다.
  const toggleMeasure = useCallback(() => {
    if (!image) {
      toast.error("이미지를 먼저 등록해주세요")
      return
    }
    resetSelection()
    setMode((m) => (m === "measure" ? "none" : "measure"))
  }, [image, resetSelection])

  const onOverlayMouseDown = useCallback(
    (e: MouseEvent) => {
      if (mode !== "crop") return
      const p = canvasPoint(e)
      if (!p) return
      setSelStart(p)
      setSelEnd(p)
      selStartRef.current = p
      selEndRef.current = p
      setIsSelecting(true)
    },
    [mode, canvasPoint]
  )

  const onOverlayMouseMove = useCallback(
    (e: MouseEvent) => {
      // 측정 모드: 커서를 추적해 P4 배치 전 실시간 길이를 보여준다.
      if (mode === "measure") {
        const p = canvasPoint(e)
        if (p) setCursorPos(p)
        return
      }
      if (mode !== "crop" || !isSelecting) return
      const p = canvasPoint(e)
      if (!p) return
      setSelEnd(p)
      selEndRef.current = p
    },
    [mode, isSelecting, canvasPoint]
  )

  const onOverlayMouseUp = useCallback(() => {
    if (mode === "crop") setIsSelecting(false)
  }, [mode])

  const onOverlayClick = useCallback(
    (e: MouseEvent) => {
      const canvas = overlayRef.current
      const p = canvasPoint(e)
      if (!p || !canvas) return
      if (p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height) return

      // 측정 모드: 점을 찍는다. 4점이 다 찍힌 뒤 클릭하면 새 측정을 시작한다.
      if (mode === "measure") {
        setMeasurePoints((prev) => (prev.length >= 4 ? [p] : [...prev, p]))
        return
      }

      if (mode !== "calibration" || points.length >= 4) return
      const img = imgRef.current
      if (!img) return
      const next = [...points, p]
      setPoints(next)
      if (next.length === 4) {
        const polygon = next.map((pt) => [
          Number(((pt.x / canvas.width) * img.naturalWidth).toFixed(2)),
          Number(((pt.y / canvas.height) * img.naturalHeight).toFixed(2)),
        ])
        perspective.mutate(polygon)
      }
    },
    [mode, points, canvasPoint, perspective]
  )

  return {
    mode,
    containerRef,
    imgRef,
    overlayRef,
    overlayRect,
    pointCount: points.length,
    measureCount: measurePoints.length,
    isCalibrating: perspective.isPending,
    toggleCrop,
    toggleCalibration,
    toggleMeasure,
    onOverlayMouseDown,
    onOverlayMouseMove,
    onOverlayMouseUp,
    onOverlayClick,
    recomputeOverlay,
  }
}

export type ImageEditor = ReturnType<typeof useImageEditor>
