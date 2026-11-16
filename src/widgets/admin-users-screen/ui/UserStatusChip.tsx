import type { AdminUser } from "@/entities/admin"
import { Chip } from "@/shared/ui/kit"

import { USER_STATUS_LABELS, userStatus, type UserStatus } from "../model/user-rules"

// Chip 에 「초록」 변형이 22 높이로는 없어 색만 토큰 클래스로 덮는다(사용 = 초록 — 시안은 청록을 AI 전용으로 둔다).
const TONE: Record<UserStatus, { variant: "default" | "amber"; className?: string }> = {
  ACTIVE: { variant: "default", className: "border-ok-line bg-ok-bg text-ok-fg" },
  LOCKED: { variant: "amber" },
  DISABLED: { variant: "default" },
}

/** 상태 칩 — 사용 · 잠금 · 중지. 색만으로 구분하지 않고 글자를 함께 둔다. */
export function UserStatusChip({ user }: { user: Pick<AdminUser, "useAt" | "lockAt"> }) {
  const status = userStatus(user)
  const tone = TONE[status]
  return (
    <Chip variant={tone.variant} className={tone.className}>
      {USER_STATUS_LABELS[status]}
    </Chip>
  )
}
