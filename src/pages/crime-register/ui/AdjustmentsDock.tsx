import {
  Crop,
  Crosshair,
  RefreshCw,
  RotateCcw,
  SlidersHorizontal,
  Wrench,
  type LucideIcon,
} from "lucide-react"

import type { EditorMode, ImageAdjustments } from "@/features/crime-register"
import { cn } from "@/shared/lib/utils"
import { EdgeGlow } from "@/shared/ui/glow-fx"
import { Slider } from "@/shared/ui/slider"
import { TechCorners } from "@/shared/ui/tech-corners"
import { Toggle } from "@/shared/ui/toggle"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip"

/** 분석관이 이진화를 처음 켤 때 적용되는 임계값. */
const THRESHOLD_DEFAULT = 127

interface AdjustmentsDockProps {
  adjust: ImageAdjustments
  /** 크롭 모드 토글(회전 선커밋 래퍼 경유). */
  onCrop: () => void
  /** 4점 각도보정 모드 토글(회전 선커밋 래퍼 경유). */
  onCalibrate: () => void
  /** 폼·이미지·조정·회전 전체 초기화. */
  onReset: () => void
  /** 현재 오버레이 편집 모드(도구 버튼 활성 표시용). */
  mode: EditorMode
  /** 이미지가 없으면 가시성 보정 섹션만 비활성(도구는 항상 활성). */
  disabled?: boolean
}

/** 도구 섹션의 아이콘+라벨 버튼. 이미지 유무와 무관하게 항상 활성. */
function ToolButton({
  icon: Icon,
  label,
  active = false,
  onClick,
}: {
  icon: LucideIcon
  label: string
  active?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-14 flex-col items-center justify-center gap-1 rounded-md border px-1 text-[10px] leading-tight font-medium transition-all",
        active
          ? "border-[#3B82F6]/50 bg-[#152238] text-[#4A9EFF] shadow-[0_0_18px_rgba(37,99,235,0.35)]"
          : "border-[#1E2A3C] bg-[#0F1826] text-[#8A93A6] hover:border-[#2A3B54] hover:bg-[#141F30] hover:text-[#C7CEDB]"
      )}
    >
      <Icon className="size-4" aria-hidden="true" />
      <span className="text-center">{label}</span>
    </button>
  )
}

function SliderRow({
  label,
  hint,
  display,
  value,
  min,
  max,
  step,
  onChange,
  disabled,
}: {
  label: string
  hint: string
  display: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  disabled?: boolean
}) {
  return (
    <div className={cn("space-y-1.5", disabled && "pointer-events-none opacity-40")}>
      <div className="flex items-center justify-between">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-help text-xs text-[#8A93A6] underline decoration-[#2A3B54] decoration-dotted underline-offset-4 transition-colors hover:text-[#C7CEDB]">
              {label}
            </span>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-52 bg-[#0F1826] text-[#C7CEDB]">
            {hint}
          </TooltipContent>
        </Tooltip>
        <span className="font-mono text-[11px] tabular-nums text-[#C7CEDB]">{display}</span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
        disabled={disabled}
      />
    </div>
  )
}

const TOGGLE_CLASS =
  "h-8 flex-1 rounded-md border border-[#1E2A3C] bg-[#0F1826] text-xs text-[#8A93A6] transition-shadow hover:bg-[#141F30] hover:text-[#C7CEDB] data-[state=on]:border-[#3B82F6]/50 data-[state=on]:bg-[#152238] data-[state=on]:text-[#4A9EFF] data-[state=on]:shadow-[0_0_18px_rgba(37,99,235,0.35)]"

/**
 * 오른쪽 "도구/보정" 도크. 상단 도구 섹션(크롭·각도보정·전체 초기화)과 하단
 * 가시성 보정 섹션(밝기·대비·감마·임계값 + 반전·흑백)을 한곳에 모아, 현장 사진에서
 * 흐릿한 족적을 끌어올리는 편집 컨트롤을 이미지 옆에 통합한다. 밝기·대비·반전·흑백은
 * 실시간 CSS 필터, 감마·임계값은 canvas로 미리보기 굽기 — 저장 전까지 비파괴다.
 */
export function AdjustmentsDock({
  adjust,
  onCrop,
  onCalibrate,
  onReset,
  mode,
  disabled = false,
}: AdjustmentsDockProps) {
  const { adjustments, setAdjustment, resetAdjustments, isAdjusted } = adjust
  const { brightness, contrast, gamma, threshold, invert, grayscale } = adjustments
  const thresholdOn = threshold !== null

  return (
    <aside className="relative flex w-full shrink-0 flex-col gap-4 overflow-y-auto rounded-xl border border-[#141D2C] bg-[#0B121D]/60 p-4 lg:w-56">
      <TechCorners size={16} active={isAdjusted} />

      {/* 도구 섹션: 크롭·각도보정·전체 초기화. 이미지가 없어도 활성 —
          핸들러가 "이미지를 먼저 등록해주세요" 토스트를 띄운다. */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <Wrench className="size-3.5 text-[#4A9EFF]" aria-hidden="true" />
          <span className="text-[11px] font-semibold tracking-[0.14em] text-[#8A93A6] uppercase">
            도구
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <ToolButton
            icon={Crop}
            label={mode === "crop" ? "크롭 완료" : "크롭"}
            active={mode === "crop"}
            onClick={onCrop}
          />
          <ToolButton
            icon={Crosshair}
            label="각도보정"
            active={mode === "calibration"}
            onClick={onCalibrate}
          />
          <ToolButton icon={RefreshCw} label="전체 초기화" onClick={onReset} />
        </div>
      </div>

      <div className="relative h-px">
        <EdgeGlow className="inset-x-0" />
      </div>

      {/* 가시성 보정 섹션 */}
      <div className="space-y-0.5">
        <div className="flex items-center gap-1.5">
          <SlidersHorizontal className="size-3.5 text-[#4A9EFF]" aria-hidden="true" />
          <span className="text-[11px] font-semibold tracking-[0.14em] text-[#8A93A6] uppercase">
            가시성 보정
          </span>
          {isAdjusted && (
            <span className="relative ml-auto flex size-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#4A9EFF] opacity-60" />
              <span className="relative inline-flex size-1.5 rounded-full bg-[#4A9EFF] shadow-[0_0_6px_2px_rgba(74,158,255,0.8)]" />
            </span>
          )}
        </div>
        <span className="pl-5 font-mono text-[10px] tracking-wide text-[#4C5670]">
          실시간 미리보기
        </span>
      </div>

      <SliderRow
        label="밝기"
        hint="밝기: 전체 노출을 위/아래로 이동합니다"
        display={`${brightness > 0 ? "+" : ""}${brightness}`}
        value={brightness}
        min={-100}
        max={100}
        step={1}
        onChange={(v) => setAdjustment("brightness", v)}
        disabled={disabled}
      />
      <SliderRow
        label="대비"
        hint="대비: 밝은 영역과 어두운 영역의 차이를 강조합니다"
        display={`${contrast > 0 ? "+" : ""}${contrast}`}
        value={contrast}
        min={-100}
        max={100}
        step={1}
        onChange={(v) => setAdjustment("contrast", v)}
        disabled={disabled}
      />
      <SliderRow
        label="감마"
        hint="감마: 그림자·하이라이트 비선형 보정"
        display={gamma.toFixed(2)}
        value={gamma}
        min={0.2}
        max={3}
        step={0.05}
        onChange={(v) => setAdjustment("gamma", Number(v.toFixed(2)))}
        disabled={disabled}
      />

      {/* 임계값은 on/off 게이트(null = 꺼짐)와 0..255 슬라이더를 함께 가진다. */}
      <div className={cn("space-y-1.5", disabled && "pointer-events-none opacity-40")}>
        <div className="flex items-center justify-between">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help text-xs text-[#8A93A6] underline decoration-[#2A3B54] decoration-dotted underline-offset-4 transition-colors hover:text-[#C7CEDB]">
                임계값
              </span>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-52 bg-[#0F1826] text-[#C7CEDB]">
              임계값: 지정한 밝기를 기준으로 이진화(흑/백) 처리합니다
            </TooltipContent>
          </Tooltip>
          <Toggle
            pressed={thresholdOn}
            onPressedChange={(on) => setAdjustment("threshold", on ? THRESHOLD_DEFAULT : null)}
            className="h-6 rounded border border-[#1E2A3C] bg-[#0F1826] px-2 font-mono text-[10px] tabular-nums text-[#8A93A6] data-[state=on]:border-[#3B82F6]/50 data-[state=on]:bg-[#152238] data-[state=on]:text-[#4A9EFF] data-[state=on]:shadow-[0_0_14px_rgba(37,99,235,0.35)]"
          >
            {thresholdOn ? String(threshold) : "꺼짐"}
          </Toggle>
        </div>
        <Slider
          value={[threshold ?? THRESHOLD_DEFAULT]}
          min={0}
          max={255}
          step={1}
          onValueChange={([v]) => setAdjustment("threshold", v)}
          disabled={disabled || !thresholdOn}
        />
      </div>

      <div className="relative h-px">
        <EdgeGlow className="inset-x-0" />
      </div>

      <div className="flex gap-2">
        <Toggle
          pressed={invert}
          onPressedChange={(v) => setAdjustment("invert", v)}
          disabled={disabled}
          className={TOGGLE_CLASS}
        >
          반전
        </Toggle>
        <Toggle
          pressed={grayscale}
          onPressedChange={(v) => setAdjustment("grayscale", v)}
          disabled={disabled}
          className={TOGGLE_CLASS}
        >
          흑백
        </Toggle>
      </div>

      <button
        type="button"
        onClick={resetAdjustments}
        disabled={disabled || !isAdjusted}
        className="mt-auto flex h-9 items-center justify-center gap-1.5 rounded-md border border-[#1E2A3C] bg-[#0F1826] text-xs text-[#8A93A6] transition-colors hover:border-[#2A3B54] hover:text-white hover:shadow-[0_0_12px_rgba(37,99,235,0.25)] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:hover:border-[#1E2A3C] disabled:hover:text-[#8A93A6]"
      >
        <RotateCcw className="size-3.5" aria-hidden="true" />
        보정 초기화
      </button>
    </aside>
  )
}
