import { StatTile } from "@/shared/ui/ai"

import type { AdminUsersOverview, RoleShareTone } from "../model/types"

// S13 계정 운영 상태 타일(시안 핀 12) + 「신발 승인 담당 부족」 경고(시안 핀 13). 값은 props 그대로 그린다.
const SHARE_BG: Record<RoleShareTone, string> = {
  mute: "bg-muted-foreground",
  brand: "bg-brand",
  violet: "bg-violet",
  fg2: "bg-fg-2",
}

export function UsersOverviewTiles({ overview }: { overview: AdminUsersOverview }) {
  const { roleShares, locked, passwordExpired, idle, approverShortage } = overview
  const shareTotal = Math.max(1, roleShares.reduce((n, s) => n + s.count, 0))
  return (
    <div
      data-plus
      role="region"
      aria-label="계정 운영 상태"
      className="mb-[12px] grid grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))_minmax(0,1.35fr)] gap-[10px]"
    >
      <StatTile label={`역할 분포 · 전체 계정 ${overview.total}명`}>
        <span aria-hidden="true" className="mt-[4px] flex h-[10px] gap-[2px] overflow-hidden rounded-[5px]">
          {roleShares.map((s) => (
            <i key={s.label} className={`shrink ${SHARE_BG[s.tone]}`} style={{ width: `${(s.count / shareTotal) * 100}%` }} />
          ))}
        </span>
        <span className="flex flex-wrap gap-x-[12px] gap-y-[4px] text-[11px] text-muted-foreground">
          {roleShares.map((s) => (
            <span key={s.label} className="inline-flex items-center gap-[4px]">
              <i aria-hidden="true" className={`size-[8px] rounded-[2px] ${SHARE_BG[s.tone]}`} />
              {s.label} <b className="tabular-nums text-foreground">{s.count}</b>
            </span>
          ))}
        </span>
      </StatTile>
      <StatTile tone="warn" label="잠긴 계정" value={locked.count} unit="명" sub={locked.sub} />
      <StatTile glow="warn" label="비밀번호 90일 지남" value={passwordExpired.count} unit="명" sub={passwordExpired.sub} />
      <StatTile label="30일 넘게 미접속" value={idle.count} unit="명" sub={idle.sub} />
      <StatTile
        tone="danger"
        data-warning="approver-shortage"
        label="신발 승인 담당 부족"
        value={
          <>
            {approverShortage.count}
            <small className="font-ui text-[11px] font-medium text-dim"> 명</small>{" "}
            <small className="font-ui text-[11px] font-medium text-muted-foreground">/ 미승인 {approverShortage.pending}건</small>
          </>
        }
        sub={approverShortage.sub}
      />
    </div>
  )
}
