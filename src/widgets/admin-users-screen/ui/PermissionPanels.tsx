import type { CSSProperties } from "react"

import type { AdminUser, FeatureInfo, RoleInfo } from "@/entities/admin"
import { FEATURES, type FeatureCode } from "@/entities/session"
import { cn } from "@/shared/lib/utils"
import { Chip, DataGrid, type DataGridColumn } from "@/shared/ui/kit"
import { Panel } from "@/shared/ui/panel"

import { effectiveRow, type EffectiveRow } from "../model/effective-permissions"
import type { AdminHistoryRow } from "../model/types"

// S13 시안 r3 신규 칸 3개: 역할별 기본 권한(핀 3) · 사용자별 실제 권한(핀 14) · 관리자 변경 이력(핀 10).
// 기능 칸은 서버 기능 목록 12종 그대로(spec §6-1 — S13 은 서버 목록), 역할은 서버 역할 목록 + 관리자.

/** 좁은 칸 머리용 두 줄 이름(시안 「사건<br>등록」 꼴). 모르는 코드는 서버 이름 그대로 */
const SHORT: Partial<Record<FeatureCode, [string, string?]>> = {
  [FEATURES.CRIME_REGISTER]: ["사건", "등록"],
  [FEATURES.CRIME_SEARCH]: ["사건", "조회"],
  [FEATURES.SHOE_VIEW]: ["신발", "조회"],
  [FEATURES.SHOE_EDIT]: ["신발", "등록"],
  [FEATURES.CASE_STATUS_VIEW]: ["진행", "조회"],
  [FEATURES.REPORT_VIEW]: ["감정서", "조회"],
  [FEATURES.EXAM_DECIDE]: ["판정", "확정"],
  [FEATURES.CROSS_REVIEW]: ["교차", "검증"],
  [FEATURES.REPORT_WRITE]: ["감정서", "작성"],
  [FEATURES.REPORT_APPROVE]: ["결재"],
  [FEATURES.REPORT_SEND]: ["발송"],
  [FEATURES.SHOE_COLLECT_REVIEW]: ["수집", "검수"],
}

function ShortName({ f }: { f: FeatureInfo }) {
  const s = SHORT[f.featureCode]
  if (!s) return <>{f.featureNm}</>
  return (
    <>
      {s[0]}
      {s[1] && (
        <>
          <br />
          {s[1]}
        </>
      )}
    </>
  )
}

const ON = (
  <span className="text-brand" role="img" aria-label="켜짐">
    ●
  </span>
)
const OFF = (
  <span className="text-faint" role="img" aria-label="꺼짐">
    —
  </span>
)

/** 역할별 기본 권한(역할 프리셋) */
export function RolePresetTable({ roles, featureList }: { roles: RoleInfo[]; featureList: FeatureInfo[] }) {
  type Row = FeatureInfo
  const columns: DataGridColumn<Row>[] = [
    {
      key: "feature",
      header: "기능",
      render: (f) => (
        <span className="grid leading-[1.25]">
          <span className="text-foreground">{f.featureNm}</span>
          <span className="font-code text-[10.5px] text-dim">{f.featureCode}</span>
        </span>
      ),
    },
    ...roles.map((r) => ({
      key: r.roleCode,
      header: r.roleNm,
      render: (f: Row) => <span className="block text-center text-[14px]">{r.features.includes(f.featureCode) ? ON : OFF}</span>,
    })),
    { key: "admin", header: "관리자", render: () => <span className="block text-center text-[14px]">{ON}</span> },
  ]
  return (
    <Panel data-plus role="region" aria-label="역할별 기본 권한" label="PRESETS" actions={<h2 className="border-none text-[13px] font-semibold">역할별 기본 권한</h2>}>
      <p className="m-0 px-[14px] pt-[8px] text-[11.5px] text-dim">
        읽는 법: <span className="text-brand">●</span> 켜짐 · — 꺼짐. 역할을 주면 이 줄의 기능이 함께 켜지고, 사람마다 기능을 더 켤 수 있습니다.
      </p>
      <div className="overflow-x-auto">
        <DataGrid columns={columns} rows={featureList} rowKey={(f) => f.featureCode} />
      </div>
    </Panel>
  )
}

const COLS = "grid grid-cols-[104px_58px_repeat(var(--n),minmax(0,1fr))_62px] gap-x-[2px]"

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

/** 사용자별 실제 권한 — 줄 = 사람, 칸 = 기능. 프리셋과 다른 칸은 주황 */
export function EffectivePermissions({
  users,
  roles,
  featureList,
  selectedUserId,
  notes,
}: {
  users: AdminUser[]
  roles: RoleInfo[]
  featureList: FeatureInfo[]
  selectedUserId: string | null
  notes: { userId: string; text: string }[]
}) {
  const codes = featureList.map((f) => f.featureCode)
  const rows = users.map((u) => effectiveRow(u, roles, codes))
  const diffUsers = rows.filter((r) => r.diff > 0).length
  const roleName = (u: AdminUser) =>
    u.userSe === "ADMIN" ? "관리자" : u.roles.map((c) => roles.find((r) => r.roleCode === c)?.roleNm ?? c).join(" · ") || "—"
  // 기능 칸 수(서버 목록 길이)는 실행 중에 정해지는 배치 값이라 변수로 넘긴다
  const gridVar = { "--n": featureList.length } as CSSProperties
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
        <div className="min-w-[560px]">
          <div
            className={cn(COLS, "items-end border-b border-solid border-line-2 px-[14px] pt-[8px] pb-[6px] text-[10px] leading-[1.2] text-dim")}
            style={gridVar}
          >
            <span>사용자</span>
            <span>역할</span>
            {featureList.map((f) => (
              <span key={f.featureCode} title={f.featureNm} className="text-center">
                <ShortName f={f} />
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
                style={gridVar}
              >
                <span className={cn("truncate font-code text-[11.5px]", sel ? "text-foreground" : "text-brand")}>{row.user.userId}</span>
                <span className="truncate text-[11px] text-muted-foreground">{roleName(row.user)}</span>
                {row.cells.map((c) => (
                  <span
                    key={c.code}
                    data-override={c.override ? "" : undefined}
                    className={cn(
                      "grid h-[22px] place-items-center text-[12px]",
                      c.override && "rounded-[5px] bg-warn-bg outline outline-1 -outline-offset-2 outline-warn",
                    )}
                  >
                    {c.value === "on" ? ON : OFF}
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
          읽는 법: 줄 = 사람, 칸 = 기능. <span className="text-brand">●</span> 켜짐 · — 꺼짐.{" "}
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
