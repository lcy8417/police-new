import { Footprints, Radar } from "lucide-react"

import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/lib/utils"

import type { RevealPhase } from "../model/use-match-reveal"

export interface MatchRevealOverlayProps {
  phase: RevealPhase
  totalCount: number
  revealedCount: number
  onSkip: () => void
}

/**
 * SPEC-MATCH-TOP10-001 v0.6.0 CHANGE 4(REQ-MATCH-015): 매칭 결과가 도착한 뒤 재생하는
 * 시각화 애니메이션 — 겹침 → 분리 → 슬라이딩 윈도우 스윕(연출) → 대응점 순차 출현.
 *
 * [HARD] 순수 표현 계층: 이 컴포넌트는 `use-match-reveal`이 계산한 `phase`/
 * `revealedCount`만 소비한다 — 매칭 payload를 읽지도, 백엔드를 호출하지도 않는다.
 * "슬라이딩 윈도우 분석 중" 문구는 **연출**이며 실제 매칭 알고리즘(mutual-NN+RANSAC)의
 * 내부 동작을 나타내지 않는다(REQ-MATCH-015a).
 *
 * [HARD] 비차단(REQ-MATCH-015b): 이 오버레이는 `MatchTop10Grid` **위에 겹쳐 그려질
 * 뿐**이며 그 아래 그리드는 항상 마운트되어 있다 — [건너뛰기]를 누르면 즉시
 * `phase="done"`으로 전환되어 결과에 도달한다.
 */
export function MatchRevealOverlay({
  phase,
  totalCount,
  revealedCount,
  onSkip,
}: MatchRevealOverlayProps) {
  const separated = phase !== "overlap"
  const sweeping = phase === "sweeping"
  const revealing = phase === "revealing"

  const statusText = revealing
    ? `대응점 탐색 중 ${revealedCount}/${totalCount}`
    : sweeping
      ? "슬라이딩 윈도우 분석 중"
      : "정렬 비교 준비"

  return (
    <div
      data-testid="match-reveal-overlay"
      data-phase={phase}
      className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-6 rounded-2xl border border-[#1E2A3C] bg-[#05080D]/92 backdrop-blur-md"
    >
      <div className="pointer-events-none flex items-center justify-center">
        <span
          className={cn(
            "flex items-center gap-1.5 rounded-full border border-[#2DD4BF]/50 bg-[#0F2420] px-3 py-1.5 font-mono text-[11px] text-[#2DD4BF] shadow-[0_0_14px_rgba(45,212,191,0.35)] transition-transform duration-500",
            separated ? "-translate-x-10" : "translate-x-0"
          )}
        >
          <Footprints className="size-3.5" aria-hidden="true" />
          족적
        </span>
        <span
          className={cn(
            "flex items-center gap-1.5 rounded-full border border-[#4A9EFF]/50 bg-[#152238] px-3 py-1.5 font-mono text-[11px] text-[#4A9EFF] shadow-[0_0_14px_rgba(37,99,235,0.35)] transition-transform duration-500",
            separated ? "translate-x-10" : "translate-x-0"
          )}
        >
          신발
          <Radar className="size-3.5" aria-hidden="true" />
        </span>
      </div>

      {/* 슬라이딩 윈도우 스윕 — 연출일 뿐, 실제 알고리즘(mutual-NN+RANSAC)을 나타내지 않는다. */}
      <div className="pointer-events-none relative h-1.5 w-56 overflow-hidden rounded-full bg-[#0F1826]">
        <span
          className={cn(
            "absolute inset-y-0 w-10 rounded-full bg-gradient-to-r from-transparent via-[#4A9EFF] to-transparent transition-all",
            sweeping || revealing ? "left-[calc(100%-2.5rem)] duration-700" : "left-0 duration-0"
          )}
        />
      </div>

      <span className="pointer-events-none font-mono text-[11px] tracking-[0.14em] text-[#8A93A6] uppercase">
        {statusText}
      </span>

      <Button
        type="button"
        size="sm"
        onClick={onSkip}
        className="pointer-events-auto border border-[#1E2A3C] bg-[#0F1826] text-[#C7CEDB] hover:border-[#3B82F6]/50 hover:bg-[#141F30] hover:text-white"
      >
        건너뛰기
      </Button>
    </div>
  )
}
