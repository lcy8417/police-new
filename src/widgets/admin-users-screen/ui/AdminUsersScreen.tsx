import * as React from "react"
import { Download, Plus } from "lucide-react"

import type { AdminUser } from "@/entities/admin"
import { formatKstDateTime } from "@/shared/lib"
import { cn } from "@/shared/lib/utils"
import {
  BoardFrame,
  BoardLid,
  ColumnPicker,
  InlineError,
  LidChip,
  LidChipGroup,
  LidResetLink,
  LidSearch,
  LidSeparator,
  ListHeadRow,
  ListNameCell,
  ListNote,
  ListRow,
  WorkbenchButton,
  type FilterGroup,
} from "@/shared/ui/kit"

import { DUTY_COLUMNS, dutiesOf } from "../model/effective-permissions"
import type { AdminUsersScreenProps } from "../model/types"
import { USER_COLUMNS } from "../model/user-filter"
import { AdminHistory, EffectivePermissions, RolePresetTable } from "./PermissionPanels"
import { UserDetail } from "./UserDetail"
import { UserDialogs } from "./UserDialogs"
import { UsersOverviewTiles } from "./UsersOverviewTiles"
import { UserStatusChip } from "./UserStatusChip"

/**
 * S13 사용자 관리: 거르기 뚜껑 + 왼쪽 사용자 표 + 오른쪽 상세. 서버 호출 · 전역 상태 없이 props 만 그린다.
 * R6(앱 틀 남색 위 막대와 같은 결): 관리자 안내 띠 · 쪽 제목 · 큰 운영 타일 · 아래 안내 띠를 빼고,
 * 운영 상태는 뚜껑 아래 한 줄로, 표는 사건관리 목록과 같은 로망 목록 표(ListHeadRow · ListRow), 단추는 WorkbenchButton.
 * r2(+α, `showPlus`): 엑셀 · 운영 상태 · 거르기 칸 · 구분 아래 신발 DB 담당(◇) · 소속 관서 고르기 · 역할별 기본 권한 ·
 * 사용자별 실제 권한 · 관리자 변경 이력 · 상세의 역할 프리셋 · 신발 DB 분업 · 「그 뒤 실패 n회」.
 * 신발 DB 분업 중 문양 입력 · 신발 승인은 서버 코드가 아직 없어 쓰는 쪽이 `duties` 로 넘긴다(신발 등록 = 서버 SHOE_EDIT).
 */

/** 칸 폭(flex) — 머리 줄과 줄이 같이 쓴다. 열 고르기로 빠진 칸은 그 칸만 빠지고 나머지가 늘어난다 */
const COL_CLASS: Record<string, string> = {
  userId: "w-[92px] shrink-0",
  userNm: "flex-[1_1_104px]",
  role: "flex-[1.3_1_120px]",
  org: "flex-[1.1_1_104px]",
  status: "w-[52px] shrink-0 justify-center text-center",
  last: "w-[108px] shrink-0 justify-end text-right",
}

/** 거르기 칩 묶음 하나 — 여러 개 고르기(묶음 안은 「또는」) */
function LidGroup({ group, onChange }: { group: FilterGroup; onChange: (key: string, values: string[]) => void }) {
  const toggle = (v: string) => onChange(group.key, group.value.includes(v) ? group.value.filter((x) => x !== v) : [...group.value, v])
  return (
    <LidChipGroup role="group" aria-label={group.label}>
      {group.options.map((o) => (
        <LidChip key={o.value} active={group.value.includes(o.value)} count={o.count} zero={o.count === 0} onClick={() => toggle(o.value)}>
          {o.label}
        </LidChip>
      ))}
    </LidChipGroup>
  )
}

export function AdminUsersScreen(props: AdminUsersScreenProps) {
  const { status, isAdmin, users, roles, onRetry, errorAt, showPlus = true } = props

  if (!isAdmin) {
    return (
      <div className="p-[16px]">
        <BoardFrame className="mt-0">
          <ListNote role="status" className="text-center">
            관리자만 볼 수 있습니다
          </ListNote>
        </BoardFrame>
      </div>
    )
  }

  const roleName = (code: string) => roles.find((r) => r.roleCode === code)?.roleNm ?? code
  const duties = props.duties ?? {}
  const dutyName = (code: string) => DUTY_COLUMNS.find((c) => c.key === code)?.name ?? code
  const cells: Record<string, { header: string; render: (u: AdminUser) => React.ReactNode }> = {
    userId: { header: "아이디", render: (u) => <span className="truncate font-code text-[12px] text-brand-3">{u.userId}</span> },
    userNm: { header: "이름", render: (u) => <ListNameCell name={u.userNm} className="min-w-0 shrink" /> },
    role: {
      header: "구분(역할)",
      render: (u) => (
        <span className="flex min-w-0 flex-wrap items-center gap-x-[6px] gap-y-[2px] text-[11px] text-muted-foreground">
          <b className={cn("font-bold", u.userSe === "ADMIN" ? "text-brand-3" : "text-fg-2")}>{u.userSe === "ADMIN" ? "관리자" : "사용자"}</b>
          {u.roles.length > 0 && <span className="truncate">{u.roles.map(roleName).join(" · ")}</span>}
          {showPlus &&
            dutiesOf(u, duties[u.userId] ?? []).map((d) => (
              <span key={d} data-plus className="text-violet">
                ◇ {dutyName(d)}
              </span>
            ))}
        </span>
      ),
    },
    // 긴 관서 이름은 두 줄까지 줄바꿈(줄 높이 44 안), 넘치면 … — 전체는 마우스 설명
    org: {
      header: "소속 관서",
      render: (u) => (
        <span title={u.orgNm} className="line-clamp-2 text-[11px] leading-[1.35] whitespace-normal text-muted-foreground">
          {u.orgNm}
        </span>
      ),
    },
    status: { header: "상태", render: (u) => <UserStatusChip user={u} /> },
    last: {
      header: "마지막 로그인",
      render: (u) => <span className="font-code text-[11px] tabular-nums text-muted-foreground">{u.lastLoginDt ? formatKstDateTime(u.lastLoginDt) : "기록 없음"}</span>,
    },
  }

  const visibleKeys = new Set(props.visibleColumns ?? USER_COLUMNS.map((c) => c.key))
  const shownKeys = USER_COLUMNS.map((c) => c.key).filter((k) => k === "userId" || visibleKeys.has(k))
  const filter = props.filter
  const filterActive = filter ? filter.query.trim() !== "" || filter.groups.some((g) => g.value.length > 0) : false
  const ready = status === "ready"
  const selected = users.find((u) => u.userId === props.selectedUserId) ?? null

  const list = (() => {
    if (status === "loading") {
      return (
        <ListNote role="status" className="text-center">
          불러오는 중…
        </ListNote>
      )
    }
    if (status === "error") {
      // 조회 실패는 「결과 없음」으로 덮지 않는다
      return (
        <div className="flex justify-center px-4 py-6">
          <InlineError message="사용자 목록을 확인하지 못했습니다" at={errorAt} onRetry={onRetry} />
        </div>
      )
    }
    if (ready && filter && filterActive && users.length === 0) {
      // 거른 결과 0건 — 조회 실패(InlineError) · 데이터 없음(결과 없음)과 다른 모양
      return (
        <ListNote
          role="status"
          className="justify-center"
          action={
            <WorkbenchButton size="sm" variant="ghost" onClick={filter.onClear}>
              조건 지우기
            </WorkbenchButton>
          }
        >
          조건에 맞는 항목 없음
        </ListNote>
      )
    }
    if (status === "empty" || users.length === 0) return <ListNote className="text-center">결과 없음</ListNote>
    return (
      <div className="overflow-x-auto">
        <div role="table" aria-label="사용자 표" className="min-w-[620px]">
          <ListHeadRow role="row" aria-hidden={undefined}>
            {shownKeys.map((k) => (
              <span key={k} role="columnheader" className={cn("min-w-0 truncate", COL_CLASS[k])}>
                {cells[k].header}
              </span>
            ))}
          </ListHeadRow>
          {users.map((u) => {
            const sel = u.userId === props.selectedUserId
            return (
              <ListRow
                key={u.userId}
                role="row"
                selected={sel}
                aria-selected={sel || undefined}
                interactive
                tabIndex={0}
                onClick={() => props.onSelectUser(u.userId)}
                onKeyDown={(e) => {
                  if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault()
                    props.onSelectUser(u.userId)
                  }
                }}
                className="h-[44px]"
              >
                {shownKeys.map((k) => (
                  <span key={k} role="cell" className={cn("flex min-w-0 items-center", COL_CLASS[k])}>
                    {cells[k].render(u)}
                  </span>
                ))}
              </ListRow>
            )
          })}
        </div>
      </div>
    )
  })()

  const openCreate = () =>
    props.onDialogChange({ kind: "create", draft: { userId: "", userNm: "", userSe: "USER", initialPassword: "", features: [] }, error: null })

  return (
    <div aria-busy={status === "loading"} className="grid min-w-0 gap-[14px] p-[16px]">
      <BoardFrame className="mt-0">
        {/* 거르기 한 줄: 찾기 │ 역할 │ 신발 DB │ 상태 │ 조건 지우기 ……… 건수 · 엑셀 · + 사용자 추가 */}
        <BoardLid role="search" aria-label="사용자 거르기">
          {filter ? (
            <>
              <LidSearch
                onClear={() => filter.onQueryChange("")}
                inputProps={{
                  "aria-label": "검색어",
                  placeholder: "아이디 · 이름",
                  value: filter.query,
                  onChange: (e) => filter.onQueryChange(e.target.value),
                }}
                className="flex-[0_1_200px]"
              />
              {filter.groups.map((g) => (
                <React.Fragment key={g.key}>
                  <LidSeparator />
                  <LidGroup group={g} onChange={filter.onGroupChange} />
                </React.Fragment>
              ))}
              {filterActive ? (
                <LidResetLink onClick={filter.onClear}>
                  <span aria-hidden="true">✕ </span>조건 지우기
                </LidResetLink>
              ) : null}
            </>
          ) : null}
          <span className="ml-auto inline-flex items-center gap-[8px]">
            {ready ? (
              <span className="font-code text-[11px] font-normal text-paper/70 tabular-nums">
                {filter ? `${users.length} / 전체 ${filter.total}` : `${users.length}명`}
              </span>
            ) : null}
            {showPlus ? (
              <span data-plus className="inline-flex">
                <WorkbenchButton variant="ghost" icon={Download} onClick={props.onExport} className="text-paper/85 hover:bg-paper/16 hover:text-paper">
                  엑셀
                </WorkbenchButton>
              </span>
            ) : null}
            {/* 진한 뚜껑(brand-3) 위라 primary(같은 brand-3 채움)는 묻힌다 — 밝은 soft 로(사건관리 「+ 등록」과 같음) */}
            <WorkbenchButton icon={Plus} disabled={status === "loading"} onClick={openCreate}>
              사용자 추가
            </WorkbenchButton>
          </span>
        </BoardLid>
        {showPlus && ready && props.overview && <UsersOverviewTiles overview={props.overview} />}

        <div className="grid min-w-0 items-start xl:grid-cols-[minmax(0,1fr)_minmax(0,520px)]">
          <section aria-label="사용자 목록" className="min-w-0">
            {/* 표 위 작은 줄: 소속 관서 고르기 · 열 고르기 */}
            <div className="flex h-9 items-center gap-[6px] border-0 border-b border-solid border-border px-3.5">
              <b className="text-[12.5px] font-bold text-foreground">사용자</b>
              <span className="font-code text-[11px] text-muted-foreground tabular-nums">{ready ? `${users.length}명` : ""}</span>
              <span className="ml-auto inline-flex items-center gap-[4px]">
                {showPlus && (
                  <span data-plus className="inline-flex">
                    <WorkbenchButton size="sm" variant="ghost" onClick={props.onOpenOrgFilter}>
                      소속 관서 · 전체
                      <span aria-hidden="true" className="text-dim">
                        ▾
                      </span>
                    </WorkbenchButton>
                  </span>
                )}
                <ColumnPicker
                  columns={USER_COLUMNS}
                  visible={props.visibleColumns ?? USER_COLUMNS.map((c) => c.key)}
                  onChange={(keys) => props.onVisibleColumnsChange?.(keys)}
                />
              </span>
            </div>
            {list}
          </section>

          <div className="min-w-0 border-0 border-solid border-border max-xl:border-t xl:border-l">
            {ready && selected && props.draft ? (
              <UserDetail
                key={selected.userId}
                user={selected}
                draft={props.draft}
                featureList={props.featureList}
                roles={roles}
                orgs={props.orgs}
                isSelf={selected.userId === props.currentUserId}
                onDraftChange={props.onDraftChange}
                onSaveInfo={props.onSaveInfo}
                onSaveRoles={props.onSaveRoles}
                onSaveFeatures={props.onSaveFeatures}
                onUnlock={() => props.onUnlock(selected.userId)}
                onResetPassword={() => props.onDialogChange({ kind: "reset", userId: selected.userId, tempPassword: "", error: null })}
                onSetUseAt={(useAt) => props.onSetUseAt(selected.userId, useAt)}
                showPlus={showPlus}
                assignedDuties={duties[selected.userId] ?? []}
                onToggleDuty={(duty, on) => props.onToggleDuty?.(selected.userId, duty, on)}
                loginMeta={props.loginMeta?.[selected.userId]}
                presetHint={props.presetHint}
              />
            ) : ready ? (
              <ListNote className="text-center">왼쪽 표에서 사용자를 고르세요</ListNote>
            ) : null}
          </div>
        </div>
      </BoardFrame>

      {showPlus && ready && (
        <div data-plus className="grid min-w-0 items-start gap-[14px] xl:grid-cols-2">
          <div className="grid min-w-0 gap-[14px]">
            <RolePresetTable roles={roles} dutyRoleCodes={props.dutyRoleCodes ?? []} />
            {props.adminHistory && props.adminHistory.length > 0 && <AdminHistory rows={props.adminHistory} />}
          </div>
          <EffectivePermissions users={users} roles={roles} duties={duties} selectedUserId={props.selectedUserId} notes={props.permissionNotes ?? []} />
        </div>
      )}
      <UserDialogs dialog={props.dialog} onChange={props.onDialogChange} onSubmit={props.onDialogSubmit} />
    </div>
  )
}
