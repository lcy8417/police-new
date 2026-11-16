import type { ReactNode } from "react"

import type { AdminUser, RoleInfo } from "@/entities/admin"
import { cn } from "@/shared/lib/utils"
import { Chip, DataGrid, type DataGridColumn } from "@/shared/ui/kit"
import { Panel } from "@/shared/ui/panel"

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
  return <Chip className="h-[17px] border-ai-line bg-ai-bg px-[5px] text-[10px] text-ai">신규</Chip>
}

const TH = "h-[34px] border-b border-solid border-border bg-strip px-[10px] text-[11.5px] font-semibold whitespace-nowrap text-muted-foreground"
const TD = "h-[44px] border-b border-solid border-line-2 px-[10px]"

function FeatureNameCell({ name, code, isNew }: { name: string; code: string; isNew?: boolean }) {
  return (
    <td className={TD}>
      <span className="text-foreground">{name}</span> {isNew && <NewChip />}
      <div className="font-code text-[10.5px] leading-[1.2] text-dim">{code}</div>
    </td>
  )
}

/** 역할별 기본 권한(역할 프리셋) — 시안 PRESETS 표: 역할 기능 6줄 + 분업 구분 줄 + 분업 3줄 */
export function RolePresetTable({ roles, dutyRoleCodes }: { roles: RoleInfo[]; dutyRoleCodes: string[] }) {
  return (
    <Panel data-plus role="region" aria-label="역할별 기본 권한" label="PRESETS" actions={<h2 className="border-none text-[13px] font-semibold">역할별 기본 권한</h2>}>
      <p className="m-0 px-[14px] pt-[8px] text-[11.5px] text-dim">
        읽는 법: <span className="text-brand">●</span> 켜짐 · <span className="text-brand">◐</span> 보기만 · <span className="text-violet">◇</span> 사람마다 지정 · — 꺼짐.
        역할을 고르면 이 줄대로 스위치가 맞춰지고, 그 뒤 한 칸씩 고칠 수 있습니다.
      </p>
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
                  <td key={r.roleCode} className={cn(TD, "text-center text-[14px]")}>
                    {MARK[roleCellOf(col, new Set(r.features))]}
                  </td>
                ))}
                <td className={cn(TD, "text-center text-[14px]")}>{MARK.on}</td>
                <td className={cn(TD, "text-[11px] leading-[1.35] whitespace-normal text-dim")}>{col.memo}</td>
              </tr>
            ))}
            <tr>
              <td colSpan={roles.length + 3} className="h-[28px] bg-strip px-[10px] text-[11.5px] text-violet">
                신발 DB 분업 — 역할과 따로, 사람마다 지정
              </td>
            </tr>
            {DUTY_COLUMNS.map((col) => (
              <tr key={col.key}>
                <FeatureNameCell name={col.name} code={col.key} isNew={col.isNew} />
                {roles.map((r) => (
                  <td key={r.roleCode} className={cn(TD, "text-center text-[14px]")}>
                    {dutyRoleCodes.includes(r.roleCode) ? MARK.assignable : MARK.off}
                  </td>
                ))}
                <td className={cn(TD, "text-center text-[14px]")}>{MARK.on}</td>
                <td className={cn(TD, "text-[11px] leading-[1.35] whitespace-normal text-dim")}>{col.memo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

// 줄: 사용자 112 · 역할 58 · 기능 9칸 · 비교 62(시안 PCOLS)
const COLS = "grid grid-cols-[112px_58px_repeat(9,minmax(0,1fr))_62px] gap-x-[2px]"
const FIRST_DUTY = ROLE_COLUMNS.length

function TailOf({ row }: { row: EffectiveRow }) {
  if (row.diff > 0)
    return (
      <Chip variant="amber-h18" className="px-[5px] text-[10px]">
        {row.diff}칸 다름
      </Chip>
    )
  if (row.state === "stopped") return <span className="text-[10.5px] text-faint">중지 · 꺼짐</span>
  if (row.state === "locked") return <span className="text-[10.5px] text-warn">잠금</span>
  return <span className="text-[10.5px] text-faint">같음</span>
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
    <Panel
      data-plus
      role="region"
      aria-label="사용자별 실제 권한"
      label="EFFECTIVE"
      actions={
        <>
          <h2 className="border-none text-[13px] font-semibold">사용자별 실제 권한</h2>
          <Chip variant="amber" className="ml-auto h-[20px] text-[11px]">
            프리셋과 다름 {diffUsers}명
          </Chip>
        </>
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
                <span className={cn("truncate font-code text-[11.5px]", sel ? "text-foreground" : "text-brand")}>{row.user.userId}</span>
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
      <div className="grid gap-[4px] px-[14px] pt-[8px] pb-[12px] text-[11px] leading-[1.45] text-dim">
        <span>
          읽는 법: 줄 = 사람, 칸 = 기능. <span className="text-brand">●</span> 켜짐 · <span className="text-brand">◐</span> 보기만 ·{" "}
          <span className="text-violet">◆</span> 신발 DB 일 맡음 · — 꺼짐.{" "}
          <span className="rounded-[3px] px-[3px] text-warn outline outline-1 outline-warn">주황 칸</span> = 역할 프리셋과 다르게 손댄 칸. 흐린 줄 = 잠금·중지.
        </span>
        {notes.map((n) => (
          <span key={n.userId}>
            <span className="font-code text-fg-2">{n.userId}</span> {n.text}
          </span>
        ))}
      </div>
    </Panel>
  )
}

/** 관리자 변경 이력(권한 오남용 방지) */
export function AdminHistory({ rows }: { rows: AdminHistoryRow[] }) {
  const columns: DataGridColumn<AdminHistoryRow>[] = [
    { key: "at", header: "시각", render: (h) => <span className="font-code text-[12px] tabular-nums text-muted-foreground">{h.at}</span> },
    { key: "who", header: "누가 → 대상", render: (h) => <span className="font-code text-[11.5px]">{h.who}</span> },
    {
      key: "change",
      header: "변경",
      wrap: true,
      render: (h) => <span className={cn("leading-[1.35]", h.tone === "warn" && "text-warn", h.tone === "danger" && "text-danger")}>{h.change}</span>,
    },
    { key: "reason", header: "사유", wrap: true, render: (h) => <span className="text-[12px] leading-[1.35] text-muted-foreground">{h.reason}</span> },
  ]
  return (
    <Panel
      data-plus
      role="region"
      aria-label="관리자 변경 이력"
      label="ADMIN LOG"
      actions={
        <>
          <h2 className="border-none text-[13px] font-semibold">관리자 변경 이력</h2>
          <span className="ml-auto text-[12px] text-dim">권한 오남용 방지</span>
        </>
      }
    >
      <div className="overflow-x-auto">
        <DataGrid columns={columns} rows={rows} rowKey={(h) => `${h.at}-${h.who}`} />
      </div>
    </Panel>
  )
}
