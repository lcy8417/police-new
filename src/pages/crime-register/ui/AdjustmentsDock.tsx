import { RotateCcw, SlidersHorizontal } from "lucide-react"

import type { ImageAdjustments } from "@/features/crime-register"
import { cn } from "@/shared/lib/utils"
import { EdgeGlow } from "@/shared/ui/glow-fx"
import { Slider } from "@/shared/ui/slider"
import { TechCorners } from "@/shared/ui/tech-corners"
import { Toggle } from "@/shared/ui/toggle"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip"

/** Threshold value applied when the analyst first enables binarization. */
const THRESHOLD_DEFAULT = 127

interface AdjustmentsDockProps {
  adjust: ImageAdjustments
  /** Greyed-out until an image is present. */
  disabled?: boolean
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
 * Right-hand "가시성 보정" dock: the forensic analyst's controls for lifting a
 * faint shoeprint out of a low-contrast scene photo. Brightness/contrast/invert/
 * grayscale are live CSS filters; gamma/threshold preview-bake through the
 * canvas. All values are non-destructive until the case is saved.
 */
export function AdjustmentsDock({ adjust, disabled = false }: AdjustmentsDockProps) {
  const { adjustments, setAdjustment, resetAdjustments, isAdjusted } = adjust
  const { brightness, contrast, gamma, threshold, invert, grayscale } = adjustments
  const thresholdOn = threshold !== null

  return (
    <aside className="relative flex w-full shrink-0 flex-col gap-4 overflow-y-auto rounded-xl border border-[#141D2C] bg-[#0B121D]/60 p-4 lg:w-56">
      <TechCorners size={16} active={isAdjusted} />

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

      {/* Threshold has an on/off gate (null = off) plus its 0..255 slider. */}
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
