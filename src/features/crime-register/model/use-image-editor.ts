import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

import { fetchPerspective } from "@/services/api"

/** Active client-side editing mode over the evidence image. Mutually exclusive. */
export type EditorMode = "none" | "crop" | "calibration"

interface Point {
  x: number
  y: number
}

/** Position + size of the overlay canvas, measured against the displayed image. */
interface OverlayRect {
  left: number
  top: number
  width: number
  height: number
}

const MIN_CROP = 5
const POINT_COLORS = ["#ff4d4f", "#52c41a", "#4a9eff", "#faad14"]

/**
 * Client-side evidence-image editor for `/crimeRegister`: rectangular crop and
 * 4-point perspective (각도 보정) correction, sharing one overlay `<canvas>`
 * layered pixel-perfect over the displayed `<img>`.
 *
 * Crop math is ported from the legacy `Canvas.jsx` (`cropImageBySelection`):
 * the selection is captured in canvas/CSS pixels, then scaled to the image's
 * natural pixels via an offscreen canvas. Calibration mirrors the legacy
 * `useCalibration.js` transform (canvas coords → 0‑1 relative → natural pixels)
 * and POSTs through `fetchPerspective`; the request is routed through a
 * TanStack mutation so the app-wide `MutationCache` toast reports any failure.
 *
 * Alignment strategy: the overlay is measured from `imgRef.getBoundingClientRect()`
 * relative to `containerRef`, so it tracks the image exactly regardless of the
 * panel's responsive `object-contain` sizing.
 */
export function useImageEditor(image: string | null, onImageChange: (next: string) => void) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const overlayRef = useRef<HTMLCanvasElement | null>(null)

  const [mode, setMode] = useState<EditorMode>("none")
  const [overlayRect, setOverlayRect] = useState<OverlayRect | null>(null)

  // Calibration points (canvas-pixel coords).
  const [points, setPoints] = useState<Point[]>([])

  // Crop selection kept in state (for redraw) and refs (for a stable applyCrop).
  const [selStart, setSelStart] = useState<Point>({ x: 0, y: 0 })
  const [selEnd, setSelEnd] = useState<Point>({ x: 0, y: 0 })
  const [isSelecting, setIsSelecting] = useState(false)
  const selStartRef = useRef<Point>({ x: 0, y: 0 })
  const selEndRef = useRef<Point>({ x: 0, y: 0 })

  const resetSelection = useCallback(() => {
    setPoints([])
    setIsSelecting(false)
    setSelStart({ x: 0, y: 0 })
    setSelEnd({ x: 0, y: 0 })
    selStartRef.current = { x: 0, y: 0 }
    selEndRef.current = { x: 0, y: 0 }
  }, [])

  // Measure the overlay against the displayed image; also resize the canvas
  // bitmap to match its CSS size so mouse/canvas coords map 1:1.
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

  // Keep the overlay aligned while a mode is active (responsive resizes, etc.).
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

  // Leaving an image (reset) exits any active mode; a new image clears stale marks.
  useEffect(() => {
    if (!image) setMode("none")
    resetSelection()
  }, [image, resetSelection])

  // Draw the crop rectangle or the 4 calibration marks onto the overlay.
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
      // Dim everything outside the selection.
      ctx.fillStyle = "rgba(5,8,13,0.55)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.clearRect(x, y, w, h)
      ctx.strokeStyle = "rgba(74,158,255,0.95)"
      ctx.lineWidth = 2
      ctx.setLineDash([6, 4])
      ctx.strokeRect(x, y, w, h)
      // Corner handles.
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

    // calibration — X marks + numbers, plus a guide polygon.
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
  }, [mode, overlayRect, points, selStart, selEnd])

  // Convert a mouse event into canvas-pixel coordinates.
  const canvasPoint = useCallback((e: MouseEvent): Point | null => {
    const canvas = overlayRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY }
  }, [])

  // Crop crops the current selection out of the image at natural resolution.
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
    // On failure the app-wide MutationCache toast fires; clear points to retry.
    onError: () => setPoints([]),
  })

  // Crop button: first press enters crop mode, second press applies + exits.
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

  // Calibration button: toggles 4-point mode on/off.
  const toggleCalibration = useCallback(() => {
    if (!image) {
      toast.error("이미지를 먼저 등록해주세요")
      return
    }
    resetSelection()
    setMode((m) => (m === "calibration" ? "none" : "calibration"))
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
      if (mode !== "calibration" || points.length >= 4) return
      const canvas = overlayRef.current
      const img = imgRef.current
      const p = canvasPoint(e)
      if (!p || !canvas || !img) return
      if (p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height) return
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
    isCalibrating: perspective.isPending,
    toggleCrop,
    toggleCalibration,
    onOverlayMouseDown,
    onOverlayMouseMove,
    onOverlayMouseUp,
    onOverlayClick,
    recomputeOverlay,
  }
}

export type ImageEditor = ReturnType<typeof useImageEditor>
