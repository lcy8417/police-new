import type { ActivityResult } from "@/entities/admin"
import { Chip } from "@/shared/ui/kit"

// 결과 칩 — 성공 초록 · 실패 빨강 · 권한 없음 호박(시안 S14 RES). 색만 쓰지 않고 글자를 함께 둔다.
// Chip 에 초록 · 빨강 변형이 없어 색만 토큰 클래스로 덮는다.
const TONE: Record<ActivityResult, { label: string; variant: "default" | "amber"; className?: string }> = {
  SUCCESS: { label: "성공", variant: "default", className: "border-ok-line bg-ok-bg text-ok-fg" },
  FAIL: { label: "실패", variant: "default", className: "border-danger-line bg-danger-bg text-danger-fg" },
  DENIED: { label: "권한 없음", variant: "amber" },
}

export function ResultChip({ result }: { result: ActivityResult }) {
  const tone = TONE[result]
  return (
    <Chip variant={tone.variant} className={tone.className}>
      {tone.label}
    </Chip>
  )
}
