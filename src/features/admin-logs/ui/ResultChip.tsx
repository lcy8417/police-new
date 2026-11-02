import { AlertTriangle, CheckCircle2, ShieldAlert, type LucideIcon } from "lucide-react"

import type { ActivityResult } from "@/entities/admin"
import { StatusChip, type StatusChipTone } from "@/shared/ui"

const RESULT_STYLE: Record<ActivityResult, { label: string; tone: StatusChipTone; icon: LucideIcon }> = {
  SUCCESS: { label: "성공", tone: "teal", icon: CheckCircle2 },
  FAIL: { label: "실패", tone: "red", icon: AlertTriangle },
  DENIED: { label: "권한 없음", tone: "amber", icon: ShieldAlert },
}

/** 기능 기록 결과 칩 — 성공 teal / 실패 red(경고 아이콘) / 권한 없음 amber. */
export function ResultChip({ result }: { result: ActivityResult }) {
  const style = RESULT_STYLE[result]
  return (
    <StatusChip tone={style.tone} icon={style.icon}>
      {style.label}
    </StatusChip>
  )
}
