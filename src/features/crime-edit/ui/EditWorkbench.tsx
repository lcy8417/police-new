import { RefreshCcw, Save } from "lucide-react"

import { Button } from "@/shared/ui/button"

import { useImageEdit } from "../model/use-image-edit"
import { EditCanvas } from "./EditCanvas"
import { ThresholdControls } from "./ThresholdControls"
import { ToolDock } from "./ToolDock"

export interface EditWorkbenchProps {
  /** 편집 대상 사건 번호(서버 처리·저장 엔드포인트 식별자). */
  crimeNumber: string
  /** 편집 시작 원본(currentCrimeData.editImage ?? image). */
  seedImage: string | null | undefined
  /** "원본 복원"이 되돌아갈 raw 원본 이미지(currentCrimeData.image). */
  originalImage?: string | null | undefined
  /** 저장 성공 후 호출(최종 이미지 전달). store 갱신·refetch는 호출자 몫. */
  onSaved?: (finalImage: string) => void
}

/**
 * 현장 이미지 편집 워크벤치 — CrimeDetailPage 본문에 **인라인**으로 들어가는 조립 셸.
 * 상태는 `useImageEdit`이 소유하고, 이 컴포넌트는 그 값을 `EditCanvas`(좌측, 크게) ·
 * `ToolDock`(우측, 고정폭) · `ThresholdControls`(이진화 툴 활성 시 도크 슬롯)에 배선한다.
 *
 * 하단 푸터에 편집 액션(원본 복원 · 저장)을 둔다 — 문양추출 캔버스의 추출/초기화 푸터
 * 위치에 대응한다. "되돌리기"는 그대로 ToolDock 안에 유지한다.
 */
export function EditWorkbench({
  crimeNumber,
  seedImage,
  originalImage,
  onSaved,
}: EditWorkbenchProps) {
  const edit = useImageEdit({ crimeNumber, seedImage, originalImage })

  const handleSave = async () => {
    // save 내부에서 실패 시 toast로 안내하고 rethrow하므로, 여기서는 미처리 rejection만 흡수한다.
    try {
      await edit.save(onSaved)
    } catch {
      // 사용자 피드백은 save 내부 toast가 담당 — 여기선 상태 유지만.
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {/* 본문 — 좌측 캔버스(가변폭) + 우측 도구 도크(고정폭). EditCanvas가 자체 헤더를 가지므로
          별도 헤더 밴드는 두지 않는다(인라인에서 이중 헤더 방지). */}
      <div className="flex min-h-0 flex-1 gap-4">
        <div className="min-w-0 flex-1">
          <EditCanvas
            displayImage={edit.displayImage}
            activeTool={edit.activeTool}
            points={edit.points}
            onAddPoint={edit.addPoint}
            onSubmitPolygon={edit.submitPolygon}
            isProcessing={edit.isProcessing}
            processingLabel={edit.processingLabel}
          />
        </div>
        <div className="w-64 shrink-0 overflow-y-auto xl:w-72">
          <ToolDock
            activeTool={edit.activeTool}
            onToolChange={edit.setActiveTool}
            canUndo={edit.canUndo}
            onUndo={edit.undo}
            onRunDenoise={edit.runDenoise}
            isProcessing={edit.isProcessing}
            thresholdSlot={
              <ThresholdControls
                threshold={edit.threshold}
                mode={edit.thresholdMode}
                onThresholdChange={edit.setThreshold}
                onModeChange={edit.setThresholdMode}
                onApply={edit.applyThreshold}
                disabled={edit.isProcessing}
              />
            }
          />
        </div>
      </div>

      {/* 푸터 — 편집 액션(원본 복원 · 저장). 저장 시 호출자가 검색을 재실행한다. */}
      <div className="flex shrink-0 items-center gap-2 rounded-xl border border-[#141D2C] bg-[#0D1420]/60 px-4 py-3">
        <Button
          type="button"
          onClick={edit.restoreOriginal}
          disabled={edit.isProcessing}
          className="h-9 border border-[#1E2A3C] bg-[#0F1826] text-[#8A93A6] hover:border-[#2A3B54] hover:text-white"
        >
          <RefreshCcw className="size-3.5" aria-hidden="true" />
          원본 복원
        </Button>
        <div className="min-w-0 flex-1" />
        <Button
          type="button"
          onClick={handleSave}
          disabled={edit.isProcessing}
          className="h-9 min-w-28 border border-[#3B82F6]/50 bg-[#152238] text-[#4A9EFF] shadow-[0_0_18px_rgba(37,99,235,0.35)] hover:bg-[#182b45]"
        >
          <Save className="size-3.5" aria-hidden="true" />
          저장
        </Button>
      </div>
    </div>
  )
}
