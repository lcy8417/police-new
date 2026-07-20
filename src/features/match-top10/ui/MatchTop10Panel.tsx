import { useState } from "react"
import { Radar } from "lucide-react"

import { Button } from "@/shared/ui/button"

import { useMatchTop10 } from "../model/use-match-top10"
import { useMatchReveal } from "../model/use-match-reveal"
import { MatchTop10Grid } from "./MatchTop10Grid"
import { MatchRevealOverlay } from "./MatchRevealOverlay"

export interface MatchTop10PanelProps {
  crimeNumber: string
  modelNumber: string
  /** ALIGNMENT_NOT_SET 게이트에서 "정렬 설정하러 가기"를 눌렀을 때 호출(선택 —
   * 호출자가 정렬 UI로의 실제 화면 전환을 책임진다). */
  onGoToAlignment?: () => void
}

/**
 * SPEC-MATCH-TOP10-001 필수 표면(REQ-MATCH-006) — top-10 대응 카드 그리드를
 * 트리거 버튼과 함께 감싼 자기완결 패널. GPU 추론 비용이 크므로(P95 <=5s) 화면
 * 진입만으로 자동 발사하지 않고, 사용자가 명시적으로 "매칭 시작"을 눌러야 조회가
 * 시작된다(레거시 `similarity`/`similarity_grid` 흐름과 완전히 독립적인 additive
 * 표면 — 기존 흐름은 무변경, REQ-MATCH-007a).
 *
 * v0.6.0 CHANGE 4(REQ-MATCH-015): 결과가 도착하면 `MatchRevealOverlay`가 그
 * 위에 겹쳐 그려져 겹침→분리→스윕→순차 출현 연출을 재생한다. 카드 그리드는
 * 오버레이와 무관하게 **항상 마운트**되어 있으므로(순수 표현 계층, payload
 * 불변) 스킵·모션 감소·오버레이 종료 어느 경로로도 결과에 도달할 수 있다.
 */
export function MatchTop10Panel({ crimeNumber, modelNumber, onGoToAlignment }: MatchTop10PanelProps) {
  const [started, setStarted] = useState(false)
  const { matches, isLoading, gateCode, isGenericError, refetch } = useMatchTop10({
    crimeNumber,
    modelNumber,
    enabled: started,
  })

  const revealEnabled = started && !isLoading && !gateCode && !isGenericError && matches.length > 0
  const reveal = useMatchReveal({ matchCount: matches.length, enabled: revealEnabled })

  if (!started) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-[#1E2A3C] bg-[#0B121D] p-6 text-center">
        <p className="text-[12px] text-[#8A93A6]">
          현장↔신발 top-10 대응점을 96px 고정 박스로 표출합니다.
        </p>
        <Button
          type="button"
          size="sm"
          onClick={() => setStarted(true)}
          className="border border-[#3B82F6]/50 bg-[#152238] text-[#4A9EFF] hover:bg-[#182b45]"
        >
          <Radar className="size-4" aria-hidden="true" />
          Top-10 매칭 시작
        </Button>
      </div>
    )
  }

  return (
    <div className="relative min-h-[280px]">
      <MatchTop10Grid
        crimeNumber={crimeNumber}
        modelNumber={modelNumber}
        matches={matches}
        isLoading={isLoading}
        gateCode={gateCode}
        isGenericError={isGenericError}
        onRetry={refetch}
        onGoToAlignment={onGoToAlignment}
      />
      {revealEnabled && reveal.isAnimating && (
        <MatchRevealOverlay
          phase={reveal.phase}
          totalCount={matches.length}
          revealedCount={reveal.revealedCount}
          onSkip={reveal.skip}
        />
      )}
    </div>
  )
}
