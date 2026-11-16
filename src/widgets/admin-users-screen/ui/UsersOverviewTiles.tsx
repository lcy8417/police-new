import { cn } from "@/shared/lib/utils"
import { StatePill } from "@/shared/ui/kit"

import type { AdminUsersOverview } from "../model/types"

// S13 계정 운영 상태(시안 핀 12 · 13). R6: 큰 KPI 타일 5장 대신 뚜껑 아래 한 줄 — 이름 · 굵은 수, 까닭은 마우스 설명(title)과
// 화면 낭독용 숨은 글자로 둔다. 「신발 승인 담당 부족」만 실제 문제라 빨간 알약(StatePill problem).

function Fact({ label, count, unit = "명", sub, className }: { label: string; count: number; unit?: string; sub: string; className?: string }) {
  return (
    <span title={sub} className={cn("inline-flex items-baseline gap-[4px] whitespace-nowrap", className)}>
      <span>{label}</span>
      <b className="font-code text-[12.5px] font-bold text-foreground tabular-nums">{count}</b>
      <span>{unit}</span>
      <span className="sr-only">{sub}</span>
    </span>
  )
}

const SEP = <span aria-hidden="true" className="h-[12px] w-px shrink-0 bg-line-3" />

export function UsersOverviewTiles({ overview }: { overview: AdminUsersOverview }) {
  const { roleShares, locked, passwordExpired, idle, approverShortage } = overview
  return (
    <div
      data-plus
      role="region"
      aria-label="계정 운영 상태"
      className="flex min-h-9 flex-wrap items-center gap-x-[12px] gap-y-[4px] border-0 border-b border-solid border-border bg-strip px-3.5 py-[6px] text-[11px] text-muted-foreground"
    >
      <span className="inline-flex items-baseline gap-[8px] whitespace-nowrap">
        <span className="text-fg-2">{`역할 분포 · 전체 계정 ${overview.total}명`}</span>
        {roleShares.map((s) => (
          <span key={s.label}>
            {s.label} <b className="font-code tabular-nums text-fg-2">{s.count}</b>
          </span>
        ))}
      </span>
      {SEP}
      <Fact label="잠긴 계정" count={locked.count} sub={locked.sub} className={locked.count > 0 ? "text-warn" : undefined} />
      <Fact label="비밀번호 90일 지남" count={passwordExpired.count} sub={passwordExpired.sub} />
      <Fact label="30일 넘게 미접속" count={idle.count} sub={idle.sub} />
      <span data-warning="approver-shortage" title={approverShortage.sub} className="ml-auto inline-flex">
        <StatePill tone="problem">
          신발 승인 담당 부족 {approverShortage.count}명 / 미승인 {approverShortage.pending}건
          <span className="sr-only">{approverShortage.sub}</span>
        </StatePill>
      </span>
    </div>
  )
}
