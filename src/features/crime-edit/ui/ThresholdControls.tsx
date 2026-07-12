import { Binary } from "lucide-react"

import type { ThresholdMode } from "@/shared/lib"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import { Slider } from "@/shared/ui/slider"
import { TechCorners } from "@/shared/ui/tech-corners"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip"

export interface ThresholdControlsProps {
  /** 이진화 임계값(0..255). */
  threshold: number
  /** 이진화 모드(OpenCV THRESH_* 1:1 대응). */
  mode: ThresholdMode
  /** 슬라이더 드래그 시 즉시 호출(서버 요청 없음 — 클라이언트 재베이크). */
  onThresholdChange: (v: number) => void
  /** 모드 칩 클릭 시 호출. */
  onModeChange: (m: ThresholdMode) => void
  /** "적용" 버튼 클릭 시 호출(현재 프리뷰를 workingImage로 커밋). */
  onApply: () => void
  /** 이미지 없음 등으로 전체 비활성화. */
  disabled?: boolean
}

interface ModeOption {
  mode: ThresholdMode
  /** 한국어 라벨. */
  label: string
  /** 툴팁에 노출할 OpenCV 대응 설명(영문 모드명 포함). */
  hint: string
}

/** ThresholdMode → 한국어 라벨 + 설명. OpenCV THRESH_* 1:1 대응(shared/lib/image/threshold.ts). */
const MODE_OPTIONS: ModeOption[] = [
  { mode: "standard", label: "이진(표준)", hint: "standard · BINARY — 임계값 초과는 흰색, 이하는 검정" },
  {
    mode: "standard_inv",
    label: "이진(반전)",
    hint: "standard_inv · BINARY_INV — 임계값 초과는 검정, 이하는 흰색",
  },
  { mode: "trunc", label: "절단", hint: "trunc · TRUNC — 임계값 초과분을 임계값 값으로 절단" },
  { mode: "tozero", label: "제로화", hint: "tozero · TOZERO — 임계값 이하를 0으로 소거" },
  {
    mode: "tozero_inv",
    label: "제로화(반전)",
    hint: "tozero_inv · TOZERO_INV — 임계값 초과를 0으로 소거",
  },
]

/**
 * 이진화 게이지 — forensic 스타일 5모드 세그먼트 + 0..255 슬라이더.
 * 이진화는 **완전 클라이언트**(canvas 재베이크, 서버 요청 0)라 슬라이더가 즉시 반응한다는
 * 사실을 "실시간" 배지·카피로 체감시킨다. 선택된 모드 칩은 teal(#2DD4BF)로 강조한다.
 */
export function ThresholdControls({
  threshold,
  mode,
  onThresholdChange,
  onModeChange,
  onApply,
  disabled = false,
}: ThresholdControlsProps) {
  return (
    <section
      className={cn(
        "relative flex flex-col gap-3 rounded-xl border border-[#1E2A3C] bg-[#0B121D] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
        disabled && "pointer-events-none opacity-40"
      )}
    >
      <TechCorners size={14} active />

      {/* 헤더: 타이틀 + 실시간 배지 */}
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.14em] text-[#8A93A6] uppercase">
          <Binary className="size-3.5 text-[#2DD4BF]" aria-hidden="true" />
          이진화 게이지
        </span>
        <span className="flex items-center gap-1.5 rounded-md border border-[#1E2A3C] bg-[#0F1826] px-2 py-0.5 font-mono text-[10px] tracking-[0.12em] text-[#2DD4BF] uppercase">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2DD4BF] opacity-60" />
            <span className="relative inline-flex size-1.5 rounded-full bg-[#2DD4BF] shadow-[0_0_5px_rgba(45,212,191,0.8)]" />
          </span>
          실시간
        </span>
      </div>
      <p className="-mt-1.5 font-mono text-[10px] tracking-wide text-[#4C5670]">
        서버 요청 없이 브라우저에서 즉시 반영됩니다
      </p>

      {/* 5모드 세그먼트 칩 */}
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        {MODE_OPTIONS.map((opt) => (
          <Tooltip key={opt.mode}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => onModeChange(opt.mode)}
                aria-pressed={mode === opt.mode}
                className={cn(
                  "flex flex-col items-start gap-0.5 rounded-md border px-2 py-1.5 text-left transition-all",
                  mode === opt.mode
                    ? "border-[#2DD4BF]/50 bg-[#123330] text-[#2DD4BF] shadow-[0_0_14px_rgba(45,212,191,0.3)]"
                    : "border-[#1E2A3C] bg-[#0F1826] text-[#8A93A6] hover:border-[#2DD4BF]/40 hover:bg-[#123330]/60 hover:text-[#C7CEDB]"
                )}
              >
                <span className="text-xs font-medium">{opt.label}</span>
                <span className="font-mono text-[9px] tracking-wide uppercase opacity-70">
                  {opt.mode}
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-56 bg-[#0F1826] text-[#C7CEDB]">
              {opt.hint}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>

      {/* 0..255 슬라이더 + 라이브 숫자 readout */}
      <div className="space-y-1.5">
        <div className="flex items-end justify-between">
          <span className="text-xs text-[#8A93A6]">임계값</span>
          <span className="font-mono text-2xl leading-none font-semibold tabular-nums text-[#5FE0D0]">
            {threshold}
            <span className="ml-0.5 text-xs font-normal text-[#4C5670]">/255</span>
          </span>
        </div>
        <Slider
          value={[threshold]}
          min={0}
          max={255}
          step={1}
          onValueChange={([v]) => onThresholdChange(v)}
          disabled={disabled}
          className="[&_[data-slot=slider-range]]:bg-[#2DD4BF] [&_[data-slot=slider-thumb]]:border-[#2DD4BF] [&_[data-slot=slider-thumb]]:shadow-[0_0_8px_rgba(45,212,191,0.6)] [&_[data-slot=slider-track]]:bg-[#0F1826]"
        />
        <div className="flex justify-between font-mono text-[10px] text-[#4C5670]">
          <span>0</span>
          <span>255</span>
        </div>
      </div>

      <Button
        type="button"
        onClick={onApply}
        disabled={disabled}
        className="h-9 border border-[#2DD4BF]/40 bg-[#123330] text-[#5FE0D0] shadow-[0_0_16px_rgba(45,212,191,0.25)] hover:bg-[#164039] hover:text-[#2DD4BF]"
      >
        적용
      </Button>
    </section>
  )
}
