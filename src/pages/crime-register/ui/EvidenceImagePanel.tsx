import { useRef, useState, type ChangeEvent } from "react"
import {
  ChevronDown,
  Crosshair,
  ImagePlus,
  Maximize,
  RotateCcw,
  RotateCw,
  Search,
  type LucideIcon,
} from "lucide-react"

import type { ImageAdjustments, ImageEditor } from "@/features/crime-register"
import { Slider } from "@/shared/ui/slider"
import { TechCorners } from "@/shared/ui/tech-corners"
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/toggle-group"

import { AdjustmentsDock } from "./AdjustmentsDock"

const ROTATION_TICKS = ["-180°", "-90°", "0°", "90°", "180°"]

/** Before/after compare: "원본" shows raw pixels, "보정" the adjusted preview. */
const VIEW_MODES = ["원본", "보정"] as const

function ToolbarIconButton({
  icon: Icon,
  label,
  onClick,
  disabled = false,
}: {
  icon: LucideIcon
  label: string
  onClick?: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="flex size-8 items-center justify-center rounded-md text-[#6B7688] transition-colors hover:bg-white/5 hover:text-[#4A9EFF] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[#6B7688]"
    >
      <Icon className="size-4" aria-hidden="true" />
    </button>
  )
}

interface EvidenceImagePanelProps {
  image: string | null
  onFileSelect: (file: File) => void
  onRotate: (deg: number) => void
  editor: ImageEditor
  adjust: ImageAdjustments
  /** Free-angle rotation (-180..180), previewed via CSS transform. */
  rotation: number
  onRotationChange: (deg: number) => void
}

/**
 * Left "현장 이미지" panel: rotation toolbar, a ruler-framed evidence viewport
 * with a right-hand "가시성 보정" dock, and a status bar with a 원본/보정
 * compare toggle. Upload + ±90 rotation are backed by the page; the `editor`
 * layers a crop / 4-point-calibration overlay pixel-perfect over the displayed
 * image, and `adjust` drives non-destructive visibility filters.
 */
export function EvidenceImagePanel({
  image,
  onFileSelect,
  onRotate,
  editor,
  adjust,
  rotation,
  onRotationChange,
}: EvidenceImagePanelProps) {
  const [viewMode, setViewMode] = useState<(typeof VIEW_MODES)[number]>("보정")
  const [dimensions, setDimensions] = useState<[number, number]>([0, 0])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onFileSelect(file)
    // Allow re-selecting the same file (onChange won't fire otherwise).
    e.target.value = ""
  }

  const [width, height] = dimensions

  // 원본 shows the committed pixels raw; 보정 shows the adjusted preview.
  const showRaw = viewMode === "원본"
  const displaySrc = showRaw ? image : (adjust.displayImage ?? image)
  const displayFilter = showRaw ? "none" : adjust.cssFilter

  // Purely presentational: highlight the tick nearest the live rotation value
  // so the ruler reads like an editor's angle gauge, not a static legend.
  const nearestTickValue = ROTATION_TICKS.reduce((closest, tick) => {
    const tickValue = Number.parseInt(tick, 10)
    return Math.abs(tickValue - rotation) < Math.abs(Number.parseInt(closest, 10) - rotation)
      ? tick
      : closest
  }, ROTATION_TICKS[2])

  return (
    <section className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[#1E2A3C] bg-[#0B121D] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_40px_rgba(0,0,0,0.35)]">
      <TechCorners size={22} />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Panel header */}
      <div className="flex items-center justify-between px-6 pt-5">
        <span className="text-[15px] font-semibold text-[#E5E9F0]">현장 이미지</span>
        <span className="relative flex size-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#4A9EFF] opacity-60" />
          <span className="relative inline-flex size-2 rounded-full bg-[#4A9EFF] shadow-[0_0_8px_2px_rgba(74,158,255,0.8)]" />
        </span>
      </div>

      {/* Toolbar: rotate left/right, rotation slider w/ ticks, fit + zoom */}
      <div className="mt-4 flex items-center gap-3 border-y border-[#141D2C] bg-[#0D1420]/60 px-6 py-3">
        <div className="flex shrink-0 items-center gap-0.5 rounded-md border border-[#1E2A3C] bg-[#0F1826] p-0.5">
          <ToolbarIconButton
            icon={RotateCcw}
            label="왼쪽으로 90도 회전"
            onClick={() => onRotate(-90)}
            disabled={!image}
          />
          <ToolbarIconButton
            icon={RotateCw}
            label="오른쪽으로 90도 회전"
            onClick={() => onRotate(90)}
            disabled={!image}
          />
        </div>

        <div className="h-6 w-px shrink-0 bg-[#1E2A3C]" aria-hidden="true" />

        <div className="flex min-w-0 flex-1 flex-col gap-1.5 px-1">
          {/* Free-angle rotation: CSS-transform live preview, baked at save.
              Disabled during crop/calibration (rotation is committed on entry). */}
          <Slider
            value={[rotation]}
            onValueChange={([v]) => onRotationChange(v)}
            min={-180}
            max={180}
            step={1}
            disabled={!image || editor.mode !== "none"}
          />
          <div className="flex justify-between font-mono text-[10px] tracking-wide tabular-nums">
            {ROTATION_TICKS.map((tick) => (
              <span
                key={tick}
                className={
                  tick === nearestTickValue
                    ? "text-[#4A9EFF] drop-shadow-[0_0_4px_rgba(74,158,255,0.6)]"
                    : "text-[#5B6B85]"
                }
              >
                {tick}
              </span>
            ))}
          </div>
        </div>

        <div className="h-6 w-px shrink-0 bg-[#1E2A3C]" aria-hidden="true" />

        <span className="w-14 shrink-0 rounded-md border border-[#1E2A3C] bg-[#0F1826] px-2 py-1 text-center font-mono text-[11px] tabular-nums text-[#4A9EFF]">
          {rotation}°
        </span>

        <div className="h-6 w-px shrink-0 bg-[#1E2A3C]" aria-hidden="true" />

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            className="flex h-8 items-center gap-1.5 rounded-md border border-[#1E2A3C] bg-[#0F1826] px-3 text-xs text-[#C7CEDB] transition-colors hover:border-[#3B82F6]/50 hover:bg-[#141F30] hover:text-white"
          >
            <Maximize className="size-3.5" aria-hidden="true" />
            맞춤
          </button>
          <button
            type="button"
            className="flex h-8 items-center gap-1.5 rounded-md border border-[#1E2A3C] bg-[#0F1826] px-3 text-xs text-[#C7CEDB] transition-colors hover:border-[#3B82F6]/50 hover:bg-[#141F30] hover:text-white"
          >
            <Search className="size-3.5" aria-hidden="true" />
            <span className="tabular-nums">100%</span>
            <ChevronDown className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Viewport (ruler-framed) + right-hand 가시성 보정 dock.
          Stacks to a column below `lg` so the dock falls beneath the
          viewport instead of squeezing it on narrow widths. */}
      <div className="mt-4 mb-3 flex min-h-0 flex-1 flex-col gap-4 px-6 lg:flex-row">
        <div className="relative flex min-h-[280px] min-w-0 flex-1 items-center justify-center overflow-hidden rounded-xl border border-[#141D2C] bg-[#05080D] lg:min-h-0">
          {/* checkerboard scale bars */}
          <div
            className="absolute inset-x-2 top-2 h-[8px] rounded-sm opacity-70"
            style={{
              backgroundImage: "repeating-linear-gradient(90deg, #E5E9F0 0 8px, #0B121D 8px 16px)",
            }}
          />
          <div
            className="absolute inset-y-2 left-2 w-[8px] rounded-sm opacity-70"
            style={{
              backgroundImage: "repeating-linear-gradient(180deg, #E5E9F0 0 8px, #0B121D 8px 16px)",
            }}
          />

          {/* corner crosshairs */}
          <Crosshair className="absolute top-4 left-4 size-5 text-[#4A9EFF]/70 drop-shadow-[0_0_4px_rgba(74,158,255,0.6)]" aria-hidden="true" />
          <Crosshair className="absolute top-4 right-4 size-5 text-[#4A9EFF]/70 drop-shadow-[0_0_4px_rgba(74,158,255,0.6)]" aria-hidden="true" />
          <Crosshair className="absolute bottom-4 left-4 size-5 text-[#4A9EFF]/70 drop-shadow-[0_0_4px_rgba(74,158,255,0.6)]" aria-hidden="true" />
          <Crosshair className="absolute right-4 bottom-4 size-5 text-[#4A9EFF]/70 drop-shadow-[0_0_4px_rgba(74,158,255,0.6)]" aria-hidden="true" />

          {image ? (
            <div
              ref={editor.containerRef}
              className="relative flex max-h-full max-w-full items-center justify-center"
            >
              <img
                ref={editor.imgRef}
                src={displaySrc ?? undefined}
                alt="현장 증거 이미지 미리보기"
                draggable={false}
                onLoad={(e) => {
                  const el = e.currentTarget
                  setDimensions([el.naturalWidth, el.naturalHeight])
                  editor.recomputeOverlay()
                }}
                className="max-h-full max-w-full object-contain select-none"
                style={{
                  filter: displayFilter,
                  transform: rotation ? `rotate(${rotation}deg)` : undefined,
                }}
              />
              {editor.mode !== "none" && editor.overlayRect && (
                <canvas
                  ref={editor.overlayRef}
                  onMouseDown={editor.onOverlayMouseDown}
                  onMouseMove={editor.onOverlayMouseMove}
                  onMouseUp={editor.onOverlayMouseUp}
                  onMouseLeave={editor.onOverlayMouseUp}
                  onClick={editor.onOverlayClick}
                  className="absolute cursor-crosshair"
                  style={{
                    left: editor.overlayRect.left,
                    top: editor.overlayRect.top,
                    width: editor.overlayRect.width,
                    height: editor.overlayRect.height,
                  }}
                />
              )}
              {editor.mode === "calibration" && (
                <span className="pointer-events-none absolute top-2 left-1/2 -translate-x-1/2 rounded-md border border-[#3B82F6]/50 bg-[#0B121D]/90 px-3 py-1 font-mono text-[11px] tabular-nums text-[#4A9EFF] shadow-[0_0_16px_rgba(37,99,235,0.4)]">
                  {editor.pointCount} / 4 점
                </span>
              )}
              {editor.mode === "crop" && (
                <span className="pointer-events-none absolute top-2 left-1/2 -translate-x-1/2 rounded-md border border-[#3B82F6]/50 bg-[#0B121D]/90 px-3 py-1 font-mono text-[11px] text-[#4A9EFF] shadow-[0_0_16px_rgba(37,99,235,0.4)]">
                  영역을 드래그한 뒤 크롭 완료
                </span>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative flex flex-col items-center gap-3 rounded-xl border border-dashed border-[#26334A] px-10 py-8 text-[#5B6B85] transition-colors hover:border-[#3B82F6]/60 hover:text-[#4A9EFF]"
            >
              <ImagePlus className="size-9" aria-hidden="true" />
              <span className="text-sm font-medium">현장 이미지를 업로드하세요</span>
              <span className="text-[11px] text-[#4C5670]">클릭하여 이미지 파일 선택</span>
            </button>
          )}

          <span className="absolute bottom-3 left-12 font-mono text-[10px] tracking-wider text-[#5B6B85]">
            KCSI / Forensic Imaging
          </span>
        </div>

        <AdjustmentsDock adjust={adjust} disabled={!image} />
      </div>

      {/* Status bar */}
      <div className="flex flex-wrap items-center gap-3 border-t border-[#141D2C] px-6 py-3">
        <span className="rounded-md border border-[#1E2A3C] bg-[#0F1826] px-2.5 py-1 font-mono text-[11px] tabular-nums text-[#8A93A6]">
          {width} x {height} px
        </span>

        <ToggleGroup
          type="single"
          value={viewMode}
          onValueChange={(v) => v && setViewMode(v as (typeof VIEW_MODES)[number])}
          className="gap-0.5 rounded-md border border-[#1E2A3C] bg-[#0F1826] p-0.5"
        >
          {VIEW_MODES.map((mode) => (
            <ToggleGroupItem
              key={mode}
              value={mode}
              className="h-6 rounded-[5px] px-2.5 text-[11px] font-medium text-[#6B7688] hover:text-[#C7CEDB] data-[state=on]:border data-[state=on]:border-[#3B82F6]/50 data-[state=on]:bg-[#152238] data-[state=on]:text-[#4A9EFF]"
            >
              {mode}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <span className="ml-auto font-mono text-[11px] tabular-nums text-[#6B7688]">
          X: 0000&nbsp;&nbsp;Y: 0000
        </span>
      </div>
    </section>
  )
}
