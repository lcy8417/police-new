import { Wand2 } from "lucide-react"

import { TechCorners } from "@/shared/ui/tech-corners"

import { useImageEdit } from "../model/use-image-edit"
import { EditCanvas } from "./EditCanvas"
import { ThresholdControls } from "./ThresholdControls"
import { ToolDock } from "./ToolDock"

export interface EditWorkbenchProps {
  /** 편집 대상 사건 번호(서버 처리·저장 엔드포인트 식별자). */
  crimeNumber: string
  /** 편집 시작 원본(currentCrimeData.editImage ?? image). */
  seedImage: string | null | undefined
  /** 저장 성공 후 호출(최종 이미지 전달). store 갱신·refetch·Sheet 닫기는 호출자 몫. */
  onSaved?: (finalImage: string) => void
}

/**
 * 현장 이미지 편집 워크벤치 — CrimeDetailPage의 우측 Sheet 안에 들어가는 조립 셸.
 * 상태는 `useImageEdit`이 소유하고, 이 컴포넌트는 그 값을 `EditCanvas`(좌측, 크게) ·
 * `ToolDock`(우측, 고정폭) · `ThresholdControls`(이진화 툴 활성 시 도크 슬롯)에 배선만 한다.
 *
 * 상단 헤더 밴드는 이 워크벤치의 조립 정체성을 알리는 것으로, `EditCanvas` 내부 헤더(폴리곤
 * 툴 활성 안내)와는 역할이 다르다 — 둘 다 유지한다.
 */
export function EditWorkbench({ crimeNumber, seedImage, onSaved }: EditWorkbenchProps) {
  const edit = useImageEdit({ crimeNumber, seedImage })

  const handleSave = async () => {
    // save 내부에서 실패 시 toast로 안내하고 rethrow하므로, 여기서는 미처리 rejection만 흡수한다.
    try {
      await edit.save(onSaved)
    } catch {
      // 사용자 피드백은 save 내부 toast가 담당 — 여기선 상태 유지만.
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      {/* 헤더 밴드 — 워크벤치 정체성(제목 + 부제) */}
      <header className="relative flex shrink-0 items-center gap-3 rounded-xl border border-[#1E2A3C] bg-[#0B121D] px-5 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
        <TechCorners size={18} />
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-[#3B82F6]/40 bg-[#152238] text-[#4A9EFF]">
          <Wand2 className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="truncate text-[15px] font-semibold text-[#E5E9F0]">이미지 편집</h2>
          <p className="truncate font-mono text-[11px] tracking-wide text-[#6B7688]">
            검색 성능을 위한 현장 이미지 보정
          </p>
        </div>
      </header>

      {/* 본문 — 좌측 캔버스(가변폭) + 우측 도구 도크(고정폭) */}
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
            onSave={handleSave}
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
    </div>
  )
}
