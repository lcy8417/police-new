import type { ReactNode } from "react"

import type { AdminUser, RoleInfo } from "@/entities/admin"
import type { ScreenStatus } from "@/shared/lib/screen-status"
import { cn } from "@/shared/lib/utils"
import { BoardFrame, InlineError, ListHeadRow, ListNote, ListRow, StatePill } from "@/shared/ui/kit"
import { PaneHead } from "@/shared/ui/panel"

import {
  DUTY_COLUMNS,
  PERMISSION_COLUMNS,
  ROLE_COLUMNS,
  effectiveRow,
  roleCellOf,
  type EffectiveRow,
  type PermissionCell,
} from "../model/effective-permissions"
import type { AdminHistoryRow, ShoeDuty } from "../model/types"

// S13 시안 r3 신규 칸: 역할별 기본 권한(핀 3 · 6) · 사용자별 실제 권한(핀 14) · 관리자 변경 이력(핀 10).
// 칸은 시안의 9개(역할 기능 6 + 신발 DB 분업 3), 역할은 서버 역할 목록 + 관리자.

const MARK: Record<PermissionCell | "assignable", ReactNode> = {
  on: (
    <span className="text-brand" role="img" aria-label="켜짐">
      ●
    </span>
  ),
  view: (
    <span className="text-brand" role="img" aria-label="보기만">
      ◐
    </span>
  ),
  duty: (
    <span className="text-violet" role="img" aria-label="신발 DB 일 맡음">
      ◆
    </span>
  ),
  assignable: (
    <span className="text-violet" role="img" aria-label="사람마다 지정">
      ◇
    </span>
  ),
  off: (
    <span className="text-faint" role="img" aria-label="꺼짐">
      —
    </span>
  ),
}

function NewChip() {
  return <span className="text-[10px] font-bold text-ai">신규</span>
}

/** R6 판 — 칸 머리(PaneHead) + 흰 판(BoardFrame, 로망 목록 판 결) */
function PanelBox({ label, title, end, children }: { label: string; title: string; end?: ReactNode; children: ReactNode }) {
  return (
    <section data-plus role="region" aria-label={label} className="grid min-w-0 gap-[8px]">
      <PaneHead as="h2" title={title} end={end} />
      <BoardFrame className="mt-0">{children}</BoardFrame>
    </section>
  )
}

/** 읽는 법 한 줄(보조 11) */
const LEGEND = (
  <>
    <span className="text-brand">●</span> 켜짐 · <span className="text-brand">◐</span> 보기만 · <span className="text-violet">◇</span> 사람마다 지정 ·{" "}
    <span className="text-violet">◆</span> 신발 DB 일 맡음 · — 꺼짐
  </>
)

const TH = "h-8 border-b border-solid border-border bg-panel px-[10px] text-[10px] font-normal whitespace-nowrap text-muted-foreground"
const TD = "h-[40px] border-b border-solid border-border px-[10px]"

function FeatureNameCell({ name, code, isNew }: { name: string; code: string; isNew?: boolean }) {
  return (
    <td className={TD}>
      <span className="text-foreground">{name}</span> {isNew && <NewChip />}
      <div className="font-code text-[10px] leading-[1.2] text-dim">{code}</div>
    </td>
  )
}

/** 역할별 기본 권한(역할 프리셋) — 시안 PRESETS 표: 역할 기능 6줄 + 분업 구분 줄 + 분업 3줄 */
export function RolePresetTable({ roles, dutyRoleCodes }: { roles: RoleInfo[]; dutyRoleCodes: string[] }) {
  return (
    <PanelBox label="역할별 기본 권한" title="역할별 기본 권한" end={<span className="text-[11px] text-dim">{LEGEND}</span>}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[12.5px]">
          <thead>
            <tr>
              <th scope="col" className={cn(TH, "text-left")}>
                기능
              </th>
              {roles.map((r) => (
                <th key={r.roleCode} scope="col" className={cn(TH, "text-center")}>
                  {r.roleNm}
                </th>
              ))}
              <th scope="col" className={cn(TH, "text-center")}>
                관리자
              </th>
              <th scope="col" className={cn(TH, "text-left")}>
                메모
              </th>
            </tr>
          </thead>
          <tbody>
            {ROLE_COLUMNS.map((col) => (
              <tr key={col.key}>
                <FeatureNameCell name={col.name} code={col.on} isNew={col.isNew} />
                {roles.map((r) => (
                  <td key={r.roleCode} className={cn(TD, "text-center text-[13px]")}>
                    {MARK[roleCellOf(col, new Set(r.features))]}
                  </td>
                ))}
                <td className={cn(TD, "text-center text-[13px]")}>{MARK.on}</td>
                <td className={cn(TD, "text-[11px] leading-[1.35] whitespace-normal text-dim")}>{col.memo}</td>
              </tr>
            ))}
            <tr>
              <td colSpan={roles.length + 3} className="h-8 border-b border-solid border-border bg-brand-bg px-[10px] text-[11px] font-bold text-brand-3">
                신발 DB 분업 — 역할과 따로, 사람마다 지정
              </td>
            </tr>
            {DUTY_COLUMNS.map((col) => (
              <tr key={col.key}>
                <FeatureNameCell name={col.name} code={col.key} isNew={col.isNew} />
                {roles.map((r) => (
                  <td key={r.roleCode} className={cn(TD, "text-center text-[13px]")}>
                    {dutyRoleCodes.includes(r.roleCode) ? MARK.assignable : MARK.off}
                  </td>
                ))}
                <td className={cn(TD, "text-center text-[13px]")}>{MARK.on}</td>
                <td className={cn(TD, "text-[11px] leading-[1.35] whitespace-normal text-dim")}>{col.memo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PanelBox>
  )
}

// 줄: 사용자 112 · 역할 58 · 기능 9칸 · 비교 62(시안 PCOLS)
const COLS = "grid grid-cols-[112px_58px_repeat(9,minmax(0,1fr))_62px] gap-x-[2px]"
const FIRST_DUTY = ROLE_COLUMNS.length

function TailOf({ row }: { row: EffectiveRow }) {
  if (row.diff > 0)
    return (
      <StatePill tone="fact" className="bg-warn-bg text-warn">
        {row.diff}칸 다름
      </StatePill>
    )
  if (row.state === "stopped") return <span className="text-[10px] text-faint">중지 · 꺼짐</span>
  if (row.state === "locked") return <span className="text-[10px] text-warn">잠금</span>
  return <span className="text-[10px] text-faint">같음</span>
}

/** 사용자별 실제 권한 — 줄 = 사람, 칸 = 기능 9개. 프리셋과 다른 칸은 주황 */
export function EffectivePermissions({
  users,
  roles,
  duties,
  selectedUserId,
  notes,
}: {
  users: AdminUser[]
  roles: RoleInfo[]
  duties: Record<string, ShoeDuty[]>
  selectedUserId: string | null
  notes: { userId: string; text: string }[]
}) {
  const rows = users.map((u) => effectiveRow(u, roles, duties[u.userId] ?? []))
  const diffUsers = rows.filter((r) => r.diff > 0).length
  const roleName = (u: AdminUser) =>
    u.userSe === "ADMIN" ? "관리자" : u.roles.map((c) => roles.find((r) => r.roleCode === c)?.roleNm ?? c).join(" · ") || "—"
  return (
    <PanelBox
      label="사용자별 실제 권한"
      title="사용자별 실제 권한"
      end={
        <StatePill tone="fact" className={diffUsers > 0 ? "bg-warn-bg text-warn" : undefined}>
          프리셋과 다름 {diffUsers}명
        </StatePill>
      }
    >
      <div className="overflow-x-auto">
        <div className="min-w-[520px]">
          <div className={cn(COLS, "items-end border-b border-solid border-line-2 px-[14px] pt-[8px] pb-[6px] text-[10px] leading-[1.2] text-dim")}>
            <span>사용자</span>
            <span>역할</span>
            {PERMISSION_COLUMNS.map((col, i) => (
              <span
                key={col.key}
                title={col.name}
                className={cn("text-center", i === FIRST_DUTY && "border-l border-dashed border-line-3", col.kind === "duty" && "text-violet")}
              >
                {col.short[0]}
                <br />
                {col.short[1]}
              </span>
            ))}
            <span className="text-right">
              프리셋과
              <br />
              비교
            </span>
          </div>
          {rows.map((row) => {
            const sel = row.user.userId === selectedUserId
            return (
              <div
                key={row.user.userId}
                data-effective-row={row.user.userId}
                className={cn(
                  COLS,
                  "items-center border-b border-solid border-line-2 px-[14px] py-[3px]",
                  sel && "bg-brand/9",
                  row.state !== "active" && "opacity-60",
                )}
              >
                <span className={cn("truncate font-code text-[11px]", sel ? "text-foreground" : "text-brand")}>{row.user.userId}</span>
                <span className="truncate text-[11px] text-muted-foreground">{roleName(row.user)}</span>
                {row.cells.map((c, i) => (
                  <span
                    key={c.key}
                    data-override={c.override ? "" : undefined}
                    className={cn(
                      "grid h-[22px] place-items-center text-[12px]",
                      i === FIRST_DUTY && "border-l border-dashed border-line-3",
                      c.override && "rounded-[5px] bg-warn-bg outline outline-1 -outline-offset-2 outline-warn",
                    )}
                  >
                    {MARK[c.value]}
                  </span>
                ))}
                <span className="text-right">
                  <TailOf row={row} />
                </span>
              </div>
            )
          })}
        </div>
      </div>
      <div className="grid gap-[4px] px-[14px] pt-[8px] pb-[10px] text-[11px] leading-[1.45] text-dim">
        <span>
          {LEGEND} · <span className="text-warn">주황 칸</span> = 프리셋과 다름 · 흐린 줄 = 잠금·중지
        </span>
        {notes.map((n) => (
          <span key={n.userId}>
            <span className="font-code text-fg-2">{n.userId}</span> {n.text}
          </span>
        ))}
      </div>
    </PanelBox>
  )
}

/** 관리자 변경 이력(권한 오남용 방지) — R6: 로망 목록 표(ListHeadRow · ListRow) */
const HISTORY_COLS = ["w-[112px] shrink-0", "w-[150px] shrink-0", "flex-[1_1_140px]", "flex-[1_1_140px]"]
export function AdminHistory({
  rows,
  status = "ready",
  errorAt,
  onRetry,
}: {
  rows: AdminHistoryRow[]
  /** 이력 조회 상태(실제 페이지 — 감사 기록 K2). 없으면 ready */
  status?: ScreenStatus
  errorAt?: string
  onRetry?: () => void
}) {
  const end = <span className="text-[11px] text-dim">권한 오남용 방지</span>
  if (status !== "ready" || rows.length === 0) {
    // 불러오는 중 · 실패 · 없음을 서로 다른 모양으로(실패를 「결과 없음」으로 덮지 않는다)
    return (
      <PanelBox label="관리자 변경 이력" title="관리자 변경 이력" end={end}>
        {status === "loading" ? (
          <ListNote role="status" className="text-center">
            불러오는 중…
          </ListNote>
        ) : status === "error" ? (
          <div className="flex justify-center px-4 py-6">
            <InlineError message="변경 이력을 확인하지 못했습니다" at={errorAt} onRetry={onRetry} />
          </div>
        ) : (
          <ListNote className="text-center">결과 없음</ListNote>
        )}
      </PanelBox>
    )
  }
  return (
    <PanelBox label="관리자 변경 이력" title="관리자 변경 이력" end={end}>
      <div className="overflow-x-auto">
        <div role="table" aria-label="관리자 변경 이력 표" className="min-w-[560px]">
          <ListHeadRow role="row" aria-hidden={undefined}>
            {["시각", "누가 → 대상", "변경", "사유"].map((h, i) => (
              <span key={h} role="columnheader" className={cn("min-w-0 truncate", HISTORY_COLS[i])}>
                {h}
              </span>
            ))}
          </ListHeadRow>
          {rows.map((h, i) => (
            <ListRow key={`${i}-${h.at}-${h.who}`} role="row" className="h-auto min-h-[36px] cursor-default py-[6px]">
              <span role="cell" className={cn("font-code text-[11px] tabular-nums text-muted-foreground", HISTORY_COLS[0])}>
                {h.at}
              </span>
              <span role="cell" className={cn("truncate font-code text-[11px]", HISTORY_COLS[1])}>
                {h.who}
              </span>
              <span role="cell" className={cn("min-w-0 leading-[1.35]", HISTORY_COLS[2], h.tone === "warn" && "text-warn", h.tone === "danger" && "text-danger")}>
                {h.change}
              </span>
              <span role="cell" className={cn("min-w-0 text-[11px] leading-[1.35] text-muted-foreground", HISTORY_COLS[3])}>
                {h.reason}
              </span>
            </ListRow>
          ))}
        </div>
      </div>
    </PanelBox>
  )
}
