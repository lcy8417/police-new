import {
  Binary,
  MousePointerClick,
  RefreshCcw,
  RotateCcw,
  Save,
  Scissors,
  Sparkles,
  Stamp,
} from "lucide-react"

import type { ThresholdMode } from "@/shared/lib"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"

import type { EditTool } from "../model/use-image-edit"
import { ThresholdControls } from "./ThresholdControls"

export interface EditToolbarProps {
  /** 현재 선택된 편집 툴(null = 미선택). */
  activeTool: EditTool | null
  /** 툴 버튼 클릭(같은 툴 재클릭이면 null로 토글). */
  onToolChange: (t: EditTool | null) => void
  /** undo 스택에 항목이 있는지. */
  canUndo: boolean
  onUndo: () => void
  /** 편집 캔버스를 원본으로 되돌린다(로컬 리셋). */
  onRestore: () => void
  /** 최종 이미지를 저장한다(→ 검색 재실행). */
  onSave: () => void
  /** 노이즈 제거 서버 처리 실행. */
  onRunDenoise: () => void
  /** 서버 처리 진행 중 여부 — 전체 비활성. */
  isProcessing: boolean
  /** 이진화 파라미터(ThresholdControls로 위임). */
  threshold: number
  thresholdMode: ThresholdMode
  onThresholdChange: (v: number) => void
  onThresholdModeChange: (m: ThresholdMode) => void
  onApplyThreshold: () => void
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
 * PatternCanvas 편집 모드의 하단 2줄 푸터. 위줄 = 현재 선택된 도구의 파라미터
 * (이진화 게이지 / 노이즈 실행 / 폴리곤 안내), 아래줄 = 4도구 버튼 + 되돌리기·원본복원·저장.
 * 문양추출 캔버스의 추출/초기화 푸터 위치를 편집 액션으로 대체한다. 상태는 소유하지 않고
 * (useImageEdit이 소유) 배선만 한다.
 */
export function EditToolbar({
  activeTool,
  onToolChange,
  canUndo,
  onUndo,
  onRestore,
  onSave,
  onRunDenoise,
  isProcessing,
  threshold,
  thresholdMode,
  onThresholdChange,
  onThresholdModeChange,
  onApplyThreshold,
}: EditToolbarProps) {
  const isPolygonTool = activeTool === "background" || activeTool === "inpaint"

  return (
    <div
      className={cn(
        "flex flex-col gap-2.5 px-4 py-3",
        isProcessing && "pointer-events-none opacity-60"
      )}
    >
      {/* 위줄 — 현재 도구의 파라미터 패널(도구별). 미선택이면 안내. */}
      {activeTool === "threshold" && (
        <ThresholdControls
          threshold={threshold}
          mode={thresholdMode}
          onThresholdChange={onThresholdChange}
          onModeChange={onThresholdModeChange}
          onApply={onApplyThreshold}
          disabled={isProcessing}
        />
      )}

      {activeTool === "denoise" && (
        <div className="flex items-center gap-3 rounded-md border border-[#1E2A3C] bg-[#0F1826] px-3 py-2.5">
          <p className="min-w-0 flex-1 font-mono text-[11px] leading-relaxed text-[#8A93A6]">
            AI 노이즈 제거 — 처리에 다소 시간이 소요될 수 있습니다
          </p>
          <Button
            type="button"
            onClick={onRunDenoise}
            disabled={isProcessing}
            className="h-8 shrink-0 border border-[#3B82F6]/50 bg-[#152238] text-[#4A9EFF] shadow-[0_0_16px_rgba(37,99,235,0.25)] hover:bg-[#182b45]"
          >
            <Sparkles className="size-3.5" aria-hidden="true" />
            노이즈 제거 실행
          </Button>
        </div>
      )}

      {isPolygonTool && (
        <div className="flex items-start gap-2 rounded-md border border-[#1E2A3C] bg-[#0F1826] px-3 py-2.5">
          <MousePointerClick
            className="mt-0.5 size-3.5 shrink-0 text-[#4A9EFF]"
            aria-hidden="true"
          />
          <p className="font-mono text-[11px] leading-relaxed text-[#8A93A6]">
            좌클릭으로 영역 지정, 우클릭/더블클릭으로 확정 (최소 3점)
          </p>
        </div>
      )}

      {activeTool === null && (
        <div className="rounded-md border border-dashed border-[#1E2A3C] bg-[#0F1826]/50 px-3 py-1.5 text-center font-mono text-[10px] tracking-wide text-[#5B6B85]">
          편집할 도구를 선택하세요
        </div>
      )}

      {/* 도구 4종 — 아이콘+라벨 세로형, 4등분 균등 그리드. */}
      <div className="grid grid-cols-4 gap-1.5">
        {TOOLS.map(({ tool, label, icon: Icon, accent }) => {
          const active = activeTool === tool
          return (
            <button
              key={tool}
              type="button"
              onClick={() => onToolChange(active ? null : tool)}
              className={cn(
                "flex h-14 flex-col items-center justify-center gap-1 rounded-md border px-1 text-center text-[10px] leading-tight font-medium transition-all",
                active
                  ? ACCENT_ACTIVE[accent]
                  : "border-[#1E2A3C] bg-[#0F1826] text-[#8A93A6] hover:border-[#2A3B54] hover:bg-[#141F30] hover:text-[#C7CEDB]"
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              <span className="text-center">{label}</span>
            </button>
          )
        })}
      </div>

      {/* 구분선 */}
      <div className="h-px w-full bg-[#141D2C]" aria-hidden="true" />

      {/* 액션 — 되돌리기·원본복원·저장, 3등분 균등 그리드. */}
      <div className="grid grid-cols-3 gap-1.5">
        <Button
          type="button"
          onClick={onUndo}
          disabled={!canUndo || isProcessing}
          className="h-9 w-full border border-[#1E2A3C] bg-[#0F1826] text-[11px] font-medium text-[#8A93A6] hover:border-[#2A3B54] hover:text-white"
        >
          <RotateCcw className="size-3.5" aria-hidden="true" />
          되돌리기
        </Button>
        <Button
          type="button"
          onClick={onRestore}
          disabled={isProcessing}
          className="h-9 w-full border border-[#1E2A3C] bg-[#0F1826] text-[11px] font-medium text-[#8A93A6] hover:border-[#2A3B54] hover:text-white"
        >
          <RefreshCcw className="size-3.5" aria-hidden="true" />
          원본 복원
        </Button>
        <Button
          type="button"
          onClick={onSave}
          disabled={isProcessing}
          className="h-9 w-full border border-[#3B82F6]/50 bg-[#152238] text-[11px] font-semibold text-[#4A9EFF] shadow-[0_0_18px_rgba(37,99,235,0.35)] hover:bg-[#182b45]"
        >
          <Save className="size-3.5" aria-hidden="true" />
          저장
        </Button>
      </div>
    </div>
  )
}
