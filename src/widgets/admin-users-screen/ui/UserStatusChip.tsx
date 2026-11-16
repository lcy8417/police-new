import type { AdminUser } from "@/entities/admin"
import { StatePill, type StatePillTone } from "@/shared/ui/kit"

import { USER_STATUS_LABELS, userStatus, type UserStatus } from "@/features/admin-users"

// R6: 로망 목록 표 결의 작은 상태 알약(StatePill). 사용 = 회색 사실 알약, 잠금만 주황 글자(실제 문제), 중지 = 점선(해당 없음 모양).
// 색만으로 구분하지 않고 글자를 함께 둔다.
const TONE: Record<UserStatus, { tone: StatePillTone; className?: string }> = {
  ACTIVE: { tone: "fact" },
  LOCKED: { tone: "fact", className: "bg-warn-bg text-warn" },
  DISABLED: { tone: "notApplicable", className: "text-[10px] font-bold" },
}

/** 상태 알약 — 사용 · 잠금 · 중지 */
export function UserStatusChip({ user }: { user: Pick<AdminUser, "useAt" | "lockAt"> }) {
  const status = userStatus(user)
  const t = TONE[status]
  return (
    <StatePill tone={t.tone} className={t.className}>
      {USER_STATUS_LABELS[status]}
    </StatePill>
  )
}
