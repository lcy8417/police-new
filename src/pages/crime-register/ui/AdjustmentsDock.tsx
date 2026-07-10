import { RotateCcw } from "lucide-react"

import type { ImageAdjustments } from "@/features/crime-register"
import { cn } from "@/shared/lib/utils"
import { Slider } from "@/shared/ui/slider"
import { Toggle } from "@/shared/ui/toggle"

/** Threshold value applied when the analyst first enables binarization. */
const THRESHOLD_DEFAULT = 127

interface AdjustmentsDockProps {
  adjust: ImageAdjustments
  /** Greyed-out until an image is present. */
  disabled?: boolean
}

function SliderRow({
  label,
  display,
  value,
  min,
  max,
  step,
  onChange,
  disabled,
}: {
  label: string
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
        <span className="text-xs text-[#8A93A6]">{label}</span>
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
  "h-8 flex-1 rounded-md border border-[#1E2A3C] bg-[#0F1826] text-xs text-[#8A93A6] hover:bg-[#141F30] hover:text-[#C7CEDB] data-[state=on]:border-[#3B82F6]/50 data-[state=on]:bg-[#152238] data-[state=on]:text-[#4A9EFF]"

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
    <aside className="flex w-56 shrink-0 flex-col gap-4 overflow-y-auto rounded-xl border border-[#141D2C] bg-[#0B121D]/60 p-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold tracking-[0.14em] text-[#4C5670] uppercase">
          가시성 보정
        </span>
      </div>

      <SliderRow
        label="밝기"
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
          <span className="text-xs text-[#8A93A6]">임계값</span>
          <Toggle
            pressed={thresholdOn}
            onPressedChange={(on) => setAdjustment("threshold", on ? THRESHOLD_DEFAULT : null)}
            className="h-6 rounded border border-[#1E2A3C] bg-[#0F1826] px-2 font-mono text-[10px] tabular-nums text-[#8A93A6] data-[state=on]:border-[#3B82F6]/50 data-[state=on]:bg-[#152238] data-[state=on]:text-[#4A9EFF]"
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

      <div className="h-px bg-[#141D2C]" />

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
        className="mt-auto flex h-9 items-center justify-center gap-1.5 rounded-md border border-[#1E2A3C] bg-[#0F1826] text-xs text-[#8A93A6] transition-colors hover:border-[#2A3B54] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[#1E2A3C] disabled:hover:text-[#8A93A6]"
      >
        <RotateCcw className="size-3.5" aria-hidden="true" />
        보정 초기화
      </button>
    </aside>
  )
}
