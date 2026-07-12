import type { ReactNode } from "react"
import {
  Binary,
  Loader2,
  MousePointerClick,
  RotateCcw,
  Save,
  Scissors,
  Sparkles,
  Stamp,
  Wrench,
} from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import { TechCorners } from "@/shared/ui/tech-corners"

import type { EditTool } from "../model/use-image-edit"

export interface ToolDockProps {
  /** 현재 선택된 편집 툴(null = 미선택 · 관찰 모드). */
  activeTool: EditTool | null
  /** 툴 버튼 클릭 시 호출(같은 툴 재클릭이면 호출자가 null로 토글해도 됨). */
  onToolChange: (t: EditTool | null) => void
  /** undo 스택에 항목이 있는지. */
  canUndo: boolean
  /** "되돌리기" 클릭 시 호출. */
  onUndo: () => void
  /** "노이즈 제거 실행" 클릭 시 호출. */
  onRunDenoise: () => void
  /** "저장" 클릭 시 호출. */
  onSave: () => void
  /** 서버 처리(배경제거/노이즈제거/접합장애물제거) 진행 중 여부 — 전체 비활성. */
  isProcessing: boolean
  /** threshold 활성 시 렌더할 ThresholdControls(조립 워커 주입). */
  thresholdSlot?: ReactNode
}

interface ToolMeta {
  tool: EditTool
  label: string
  icon: typeof Scissors
  /** 활성 강조색 — 서버 처리(blue) vs 클라이언트 즉시반영(threshold=teal). */
  accent: "blue" | "teal"
}

const TOOLS: ToolMeta[] = [
  { tool: "background", label: "배경제거", icon: Scissors, accent: "blue" },
  { tool: "threshold", label: "이진화", icon: Binary, accent: "teal" },
  { tool: "denoise", label: "노이즈제거", icon: Sparkles, accent: "blue" },
  { tool: "inpaint", label: "접합장애물제거", icon: Stamp, accent: "blue" },
]

const ACCENT_ACTIVE: Record<ToolMeta["accent"], string> = {
  blue: "border-[#3B82F6]/50 bg-[#152238] text-[#4A9EFF] shadow-[0_0_18px_rgba(37,99,235,0.35)]",
  teal: "border-[#2DD4BF]/50 bg-[#123330] text-[#2DD4BF] shadow-[0_0_18px_rgba(45,212,191,0.35)]",
}

/**
 * 4기능 편집 도크 — 배경제거·이진화·노이즈제거·접합장애물제거 툴 버튼 + 활성 툴별
 * 파라미터 패널(폴리곤 안내 문구 / thresholdSlot / 노이즈제거 실행 버튼) + 공통
 * 되돌리기·저장 액션. 폴리곤 좌표 판정·전송은 이 컴포넌트 밖(EditCanvas/model)이 소유 —
 * 여기서는 안내 문구와 버튼만 다룬다.
 */
export function ToolDock({
  activeTool,
  onToolChange,
  canUndo,
  onUndo,
  onRunDenoise,
  onSave,
  isProcessing,
  thresholdSlot,
}: ToolDockProps) {
  return (
    <aside
      className={cn(
        "relative flex w-full shrink-0 flex-col gap-3 rounded-xl border border-[#141D2C] bg-[#0B121D]/60 p-4",
        isProcessing && "pointer-events-none opacity-60"
      )}
    >
      <TechCorners size={16} active={activeTool !== null} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Wrench className="size-3.5 text-[#4A9EFF]" aria-hidden="true" />
          <span className="text-[11px] font-semibold tracking-[0.14em] text-[#8A93A6] uppercase">
            편집 도구
          </span>
        </div>
        {isProcessing && (
          <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-wide text-[#4A9EFF]">
            <Loader2 className="size-3 animate-spin" aria-hidden="true" />
            처리 중…
          </span>
        )}
      </div>

      {/* 4개 툴 버튼 */}
      <div className="grid grid-cols-4 gap-2">
        {TOOLS.map(({ tool, label, icon: Icon, accent }) => {
          const active = activeTool === tool
          return (
            <button
              key={tool}
              type="button"
              onClick={() => onToolChange(active ? null : tool)}
              className={cn(
                "flex h-16 flex-col items-center justify-center gap-1 rounded-md border px-1 text-[10px] leading-tight font-medium transition-all",
                active
                  ? ACCENT_ACTIVE[accent]
                  : "border-[#1E2A3C] bg-[#0F1826] text-[#8A93A6] hover:border-[#2A3B54] hover:bg-[#141F30] hover:text-[#C7CEDB]"
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              <span className="text-center">{label}</span>
            </button>
          )
        })}
      </div>

      {/* 활성 툴별 파라미터 패널 */}
      {activeTool === "threshold" && thresholdSlot}

      {(activeTool === "background" || activeTool === "inpaint") && (
        <div className="flex items-start gap-2 rounded-md border border-[#1E2A3C] bg-[#0F1826] px-3 py-2.5">
          <MousePointerClick className="mt-0.5 size-3.5 shrink-0 text-[#4A9EFF]" aria-hidden="true" />
          <p className="font-mono text-[11px] leading-relaxed text-[#8A93A6]">
            좌클릭으로 영역 지정, 우클릭/더블클릭으로 확정
            <br />
            최소 3점 필요
          </p>
        </div>
      )}

      {activeTool === "denoise" && (
        <div className="space-y-2 rounded-md border border-[#1E2A3C] bg-[#0F1826] p-3">
          <p className="font-mono text-[11px] leading-relaxed text-[#8A93A6]">
            AI 노이즈 제거 — 처리에 다소 시간이 소요될 수 있습니다
          </p>
          <Button
            type="button"
            onClick={onRunDenoise}
            disabled={isProcessing}
            className="h-9 w-full border border-[#3B82F6]/50 bg-[#152238] text-[#4A9EFF] shadow-[0_0_16px_rgba(37,99,235,0.25)] hover:bg-[#182b45]"
          >
            <Sparkles className="size-4" aria-hidden="true" />
            노이즈 제거 실행
          </Button>
        </div>
      )}

      <div className="mt-auto flex gap-2 pt-1">
        <Button
          type="button"
          onClick={onUndo}
          disabled={!canUndo || isProcessing}
          className="h-9 flex-1 border border-[#1E2A3C] bg-[#0F1826] text-[#8A93A6] hover:border-[#2A3B54] hover:text-white"
        >
          <RotateCcw className="size-3.5" aria-hidden="true" />
          되돌리기
        </Button>
        <Button
          type="button"
          onClick={onSave}
          disabled={isProcessing}
          className="h-9 flex-1 border border-[#3B82F6]/50 bg-[#152238] text-[#4A9EFF] shadow-[0_0_18px_rgba(37,99,235,0.35)] hover:bg-[#182b45]"
        >
          <Save className="size-3.5" aria-hidden="true" />
          저장
        </Button>
      </div>
    </aside>
  )
}
