import { AlertTriangle, Loader2, Radar, RefreshCw, SearchX, Wand2 } from "lucide-react"

import { Button } from "@/shared/ui/button"
import type { MatchCorrespondence, MatchGateCode } from "@/entities/match"

import { MatchCorrespondenceViewer } from "./MatchCorrespondenceViewer"

/**
 * 4종 게이트 코드별 안내 문구(REQ-MATCH-009/009b-1/009c/009d) — 원인이 다르므로 문구도
 * 다르다. v0.6.0: `OUTLINE_NOT_GENERATED`(차단) 대신 `OUTLINE_GENERATION_FAILED`
 * (자동 계산 자체가 실패한 경우에만) — 되살리지 말 것(spec.md §F 역전 기록).
 */
const GATE_MESSAGES: Record<MatchGateCode, string> = {
  ALIGNMENT_NOT_SET: "정렬(ROI+방향)이 설정되지 않았습니다. 먼저 정렬을 저장해 주세요.",
  OUTLINE_GENERATION_FAILED:
    "현장 윤곽 자동 계산에 실패했습니다. 윤곽 재계산 후 다시 시도해 주세요.",
  SHOE_BINARY_NOT_AVAILABLE: "이 신발의 이진 이미지가 없어 매칭할 수 없습니다.",
  COORDINATE_SPACE_MISMATCH:
    "좌표 공간이 일치하지 않습니다(윤곽·현장 이미지 해상도 또는 정렬 좌표 범위). 관리자에게 문의해 주세요.",
}

export interface MatchTop10GridProps {
  crimeNumber: string
  modelNumber: string
  matches: MatchCorrespondence[]
  isLoading: boolean
  gateCode: MatchGateCode | null
  isGenericError: boolean
  onRetry: () => void
  /** ALIGNMENT_NOT_SET 게이트 안내에서 정렬 UI로 이동을 요청할 때 호출(선택). */
  onGoToAlignment?: () => void
}

/**
 * top-10 대응 뷰어(REQ-MATCH-006, 유일한 필수 표출 표면). [CORRECTION] 프런트
 * 전용 레이아웃 재설계 — 기존 `RetrievalResultsGrid` 카드 그리드 대신, 레거시
 * `MatchViewer`("유사부위 대응")의 A(대응 지도) 구성을 확장한
 * `MatchCorrespondenceViewer`(족적↔신발 나란한 비교 + 양쪽 박스 오버레이 + 우측
 * 세부사항 패널)를 쓴다. 게이트/일반 오류 상태는 무변경(아래), 로딩·빈 상태는
 * 이 컴포넌트가 그대로 소유한다(rank 내림차순 유지, REQ-MATCH-008).
 */
export function MatchTop10Grid({
  crimeNumber,
  modelNumber,
  matches,
  isLoading,
  gateCode,
  isGenericError,
  onRetry,
  onGoToAlignment,
}: MatchTop10GridProps) {
  if (gateCode) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 rounded-2xl border border-[#1E2A3C] bg-[#0B121D] p-8 text-center">
        <AlertTriangle className="size-10 text-[#F59E0B]" aria-hidden="true" />
        <p className="max-w-sm text-[13px] leading-relaxed text-[#C7CEDB]">
          {GATE_MESSAGES[gateCode]}
        </p>
        <div className="flex items-center gap-2">
          {gateCode === "ALIGNMENT_NOT_SET" && onGoToAlignment && (
            <Button
              type="button"
              size="sm"
              onClick={onGoToAlignment}
              className="border border-[#3B82F6]/50 bg-[#152238] text-[#4A9EFF] hover:bg-[#182b45]"
            >
              <Wand2 className="size-4" aria-hidden="true" />
              정렬 설정하러 가기
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            onClick={onRetry}
            className="border border-[#1E2A3C] bg-[#0F1826] text-[#C7CEDB] hover:border-[#3B82F6]/50 hover:bg-[#141F30] hover:text-white"
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            다시 시도
          </Button>
        </div>
      </div>
    )
  }

  if (isGenericError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 rounded-2xl border border-[#1E2A3C] bg-[#0B121D] p-8 text-center">
        <AlertTriangle className="size-10 text-[#F87171]" aria-hidden="true" />
        <p className="text-[13px] text-[#C7CEDB]">매칭 요청 중 오류가 발생했습니다.</p>
        <Button
          type="button"
          size="sm"
          onClick={onRetry}
          className="border border-[#1E2A3C] bg-[#0F1826] text-[#C7CEDB] hover:border-[#3B82F6]/50 hover:bg-[#141F30] hover:text-white"
        >
          <RefreshCw className="size-4" aria-hidden="true" />
          다시 시도
        </Button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-2xl border border-[#1E2A3C] bg-[#0B121D] text-[#5B6B85]">
        <Loader2 className="size-7 animate-spin text-[#4A9EFF]" aria-hidden="true" />
        <span className="text-[12px] font-medium">top-10 대응 분석 중…</span>
      </div>
    )
  }

  if (matches.length === 0) {
    return (
      <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-2xl border border-[#1E2A3C] bg-[#0B121D] p-8 text-center text-[#5B6B85]">
        <SearchX className="size-10" aria-hidden="true" />
        <span className="text-[13px] font-semibold text-[#8A93A6]">대응 결과가 없습니다</span>
        <Button
          type="button"
          size="sm"
          onClick={onRetry}
          className="border border-[#1E2A3C] bg-[#0F1826] text-[#C7CEDB] hover:border-[#3B82F6]/50 hover:bg-[#141F30] hover:text-white"
        >
          <Radar className="size-4" aria-hidden="true" />
          다시 시도
        </Button>
      </div>
    )
  }

  return (
    <MatchCorrespondenceViewer crimeNumber={crimeNumber} modelNumber={modelNumber} matches={matches} />
  )
}
