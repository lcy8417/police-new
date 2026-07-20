import { ArrowRight, FlipHorizontal, PenLine, Redo2, RotateCcw, Save } from "lucide-react"

import { Button } from "@/shared/ui/button"
import { DotGrid } from "@/shared/ui/glow-fx"
import { TechCorners } from "@/shared/ui/tech-corners"
import { cn } from "@/shared/lib/utils"

import { useAlignment, type ArrowStep } from "../model/use-alignment"
import { AlignmentCaptureCanvas } from "./AlignmentCaptureCanvas"

export interface AlignmentGateProps {
  /** 정렬 대상 사건 번호. */
  crimeNumber: string
  /** 정렬 대상 신발 모델 번호(REQ-ALIGN-007b: `model_number`). */
  modelNumber: string
  /** 정렬이 설정된 상태에서 사용자가 "다음 단계로"를 누르면 호출된다(호출자가 다음
   * 화면 전환을 담당 — 이 컴포넌트는 정렬 설정만 책임진다). */
  onProceed: () => void
}

const ARROW_STEP_GUIDE: Record<ArrowStep, string> = {
  toe: "앞굽(toe)을 클릭하세요.",
  heel: "뒤꿈치(heel)를 클릭하세요.",
  complete: "방향이 지정되었습니다. 필요하면 아래에서 개별 재선택할 수 있습니다.",
}

/**
 * 정렬 필수 게이트(REQ-ALIGN-001/001a) — 신발 선택 직후, 유사 영역 검색으로
 * 넘어가기 전에 항상 먼저 표시된다. 스킵/건너뛰기 경로는 제공하지 않는다: "다음
 * 단계로" 버튼은 정렬이 설정된 상태(`isAligned`)에서만 활성화된다.
 *
 * v0.6.0 CHANGE 3: 밑창 템플릿 기본 제공 + 드래그 조정 + 앞굽/뒤꿈치 명시 선택.
 * v0.6.0 CHANGE 5: 좌우 반전 토글 + 라이브 프리뷰.
 */
export function AlignmentGate({ crimeNumber, modelNumber, onProceed }: AlignmentGateProps) {
  const alignment = useAlignment({ crimeNumber, modelNumber })

  const guideText =
    alignment.phase === "polygon"
      ? alignment.drawMode === "template"
        ? "밑창 템플릿이 놓여 있습니다. 도형 내부를 드래그해 전체를 옮기거나, 점을 드래그해 모양을 맞추세요."
        : "현장 이미지 위에서 관심영역(ROI)을 3점 이상 클릭한 뒤, 첫 점 근처를 다시 클릭하거나 더블클릭해 폴리곤을 닫으세요."
      : alignment.phase === "arrow"
        ? ARROW_STEP_GUIDE[alignment.arrowStep]
        : "정렬 준비가 끝났습니다. [저장]으로 확정하거나, [다시 그리기]로 재설정할 수 있습니다."

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-[#141D2C] bg-[#0D1420]/60 px-6 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-[15px] font-semibold text-[#E5E9F0]">정렬 설정</h3>
            <p className="mt-1 text-[12px] leading-relaxed text-[#8A93A6]">{guideText}</p>
          </div>

          {/* 좌우 반전 토글(REQ-ALIGN-020a) — 족적이 신발 밑창과 좌우가 반대일 때 사용. */}
          <Button
            type="button"
            size="sm"
            onClick={alignment.toggleFlip}
            aria-pressed={alignment.flipHorizontal}
            className={cn(
              "shrink-0 border",
              alignment.flipHorizontal
                ? "border-[#4A9EFF]/60 bg-[#152238] text-[#4A9EFF] shadow-[0_0_14px_rgba(37,99,235,0.35)]"
                : "border-[#1E2A3C] bg-[#0F1826] text-[#8A93A6] hover:border-[#3B82F6]/40 hover:text-[#C7CEDB]"
            )}
          >
            <FlipHorizontal className="size-4" aria-hidden="true" />
            좌우 반전{alignment.flipHorizontal ? " · 켜짐" : ""}
          </Button>
        </div>

        {alignment.phase === "polygon" && alignment.drawMode === "template" && (
          <Button
            type="button"
            size="xs"
            onClick={alignment.startFromScratch}
            className="mt-2 border border-[#1E2A3C] bg-[#0F1826] text-[#5B6B85] hover:border-[#3B82F6]/40 hover:text-[#C7CEDB]"
          >
            <PenLine className="size-3" aria-hidden="true" />
            처음부터 그리기
          </Button>
        )}

        {alignment.phase === "arrow" && alignment.arrowStep === "complete" && (
          <div className="mt-2 flex items-center gap-2">
            <Button
              type="button"
              size="xs"
              onClick={() => alignment.clearArrowPoint("toe")}
              className="border border-[#1E2A3C] bg-[#0F1826] text-[#5B6B85] hover:border-[#EF4444]/40 hover:text-[#F87171]"
            >
              <RotateCcw className="size-3" aria-hidden="true" />
              앞굽 다시 선택
            </Button>
            <Button
              type="button"
              size="xs"
              onClick={() => alignment.clearArrowPoint("heel")}
              className="border border-[#1E2A3C] bg-[#0F1826] text-[#5B6B85] hover:border-[#EF4444]/40 hover:text-[#F87171]"
            >
              <RotateCcw className="size-3" aria-hidden="true" />
              뒤꿈치 다시 선택
            </Button>
          </div>
        )}
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-[#05080D]/70 px-2 py-3">
        <DotGrid />
        <TechCorners size={18} />
        {alignment.isLoading ? (
          <span className="relative text-[13px] text-[#5B6B85]">정렬 정보를 불러오는 중…</span>
        ) : (
          <div className="relative">
            <AlignmentCaptureCanvas
              crimeNumber={crimeNumber}
              polygon={alignment.polygon}
              arrow={alignment.arrow}
              phase={alignment.phase}
              drawMode={alignment.drawMode}
              arrowStep={alignment.arrowStep}
              flipHorizontal={alignment.flipHorizontal}
              onImageNaturalSize={alignment.seedTemplate}
              onAddPoint={alignment.addPoint}
              onClosePolygon={alignment.closePolygon}
              onMoveWholeShape={alignment.moveWholeShape}
              onMoveVertex={alignment.moveVertexAt}
              onPickArrowPoint={alignment.pickArrowPoint}
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-[#141D2C] px-4 py-3">
        {alignment.phase === "polygon" && alignment.drawMode === "scratch" && (
          <Button
            type="button"
            size="sm"
            onClick={alignment.removeLastPoint}
            disabled={alignment.polygon.length === 0}
            className="border border-[#1E2A3C] bg-[#0F1826] text-[#C7CEDB] hover:border-[#3B82F6]/50 hover:bg-[#141F30] hover:text-white"
          >
            마지막 점 삭제
          </Button>
        )}
        {alignment.phase === "polygon" && (
          <Button
            type="button"
            size="sm"
            onClick={alignment.closePolygon}
            disabled={!alignment.canClosePolygon}
            className="border border-[#3B82F6]/50 bg-[#152238] text-[#4A9EFF] hover:bg-[#182b45]"
          >
            다음: 방향 지정
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          onClick={alignment.reset}
          disabled={alignment.isSaving}
          className="border border-[#1E2A3C] bg-[#0F1826] text-[#C7CEDB] hover:border-[#3B82F6]/50 hover:bg-[#141F30] hover:text-white"
        >
          <Redo2 className="size-4" aria-hidden="true" />
          다시 그리기
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={() => void alignment.save()}
          disabled={!alignment.canSave || alignment.isSaving}
          className="border border-[#3B82F6]/50 bg-[#152238] text-[#4A9EFF] hover:bg-[#182b45]"
        >
          <Save className="size-4" aria-hidden="true" />
          {alignment.isSaving ? "저장 중…" : "저장"}
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={onProceed}
          disabled={!alignment.isAligned}
          className={cn(
            "ml-auto border",
            alignment.isAligned
              ? "border-[#22C55E]/50 bg-[#12241A] text-[#4ADE80] hover:bg-[#173420]"
              : "border-[#1E2A3C] bg-[#0F1826] text-[#5B6B85]"
          )}
        >
          다음 단계로
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}
