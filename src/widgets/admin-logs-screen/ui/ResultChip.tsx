import type { ActivityResult } from "@/entities/admin"
import { StatePill } from "@/shared/ui/kit"

// 결과 알약(R6 — 로망 목록 표 결의 StatePill). 성공은 회색 사실 알약, 색은 실제 문제(실패 빨강 · 권한 없음 주황)에만.
// 색만 쓰지 않고 글자를 함께 둔다.
const TONE: Record<ActivityResult, { label: string; className?: string }> = {
  SUCCESS: { label: "성공" },
  FAIL: { label: "실패", className: "bg-danger-bg text-danger-fg" },
  DENIED: { label: "권한 없음", className: "bg-warn-bg text-warn" },
}

export function ResultChip({ result }: { result: ActivityResult }) {
  const tone = TONE[result]
  return (
    <StatePill tone="fact" className={tone.className}>
      {tone.label}
    </StatePill>
  )
}
