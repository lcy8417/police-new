import { UserPlus } from "lucide-react"

import type { AdminUser } from "@/entities/admin"
import { formatKstDateTime } from "@/shared/lib"
import { Button, Chip, ColumnPicker, DataGrid, FilterBar, InlineError, type DataGridColumn } from "@/shared/ui/kit"
import { ButtonBar, Crumb, PageHead, Panel } from "@/shared/ui/panel"

import { DUTY_COLUMNS, dutiesOf } from "../model/effective-permissions"
import type { AdminUsersScreenProps } from "../model/types"
import { USER_COLUMNS } from "../model/user-filter"
import { AdminHistory, EffectivePermissions, RolePresetTable } from "./PermissionPanels"
import { UserDetail } from "./UserDetail"
import { UserDialogs } from "./UserDialogs"
import { UsersOverviewTiles } from "./UsersOverviewTiles"
import { UserStatusChip } from "./UserStatusChip"

/**
 * S13 사용자 관리: 왼쪽 사용자 표 + 오른쪽 상세. 서버 호출 · 전역 상태 없이 props 만 그린다.
 * r2(시안 r3 +α, `showPlus`): 관리자 전용 안내 · 엑셀 · 운영 상태 타일 · 「신발 승인 담당 부족」 경고 · 필터 칸 ·
 * 구분 아래 신발 DB 담당(◇) · 소속 관서 고르기 · 역할별 기본 권한 · 사용자별 실제 권한(9칸) · 관리자 변경 이력 ·
 * 상세의 역할 프리셋 · 신발 DB 분업 · 「그 뒤 실패 n회」 · 역할 안내 줄.
 * 신발 DB 분업 중 문양 입력 · 신발 승인은 서버 코드가 아직 없어 쓰는 쪽이 `duties` 로 넘긴다(신발 등록 = 서버 SHOE_EDIT).
 */
export function AdminUsersScreen(props: AdminUsersScreenProps) {
  const { status, isAdmin, users, roles, onRetry, errorAt, showPlus = true } = props

  if (!isAdmin) {
    return (
      <div className="p-[16px]">
        <Panel corners className="grid place-items-center px-[16px] py-[48px]">
          <p role="status" className="m-0 text-[13px] text-muted-foreground">
            관리자만 볼 수 있습니다
          </p>
        </Panel>
      </div>
    )
  }

  const roleName = (code: string) => roles.find((r) => r.roleCode === code)?.roleNm ?? code
  const duties = props.duties ?? {}
  const dutyName = (code: string) => DUTY_COLUMNS.find((c) => c.key === code)?.name ?? code
  const columns: DataGridColumn<AdminUser>[] = [
    { key: "userId", header: "아이디", render: (u) => <span className="font-code text-brand">{u.userId}</span> },
    { key: "userNm", header: "이름", wrap: true, render: (u) => <span className="break-all">{u.userNm}</span> },
    {
      key: "role",
      header: "구분(역할)",
      wrap: true,
      render: (u) => (
        <span className="flex flex-wrap items-center gap-[4px]">
          <Chip variant={u.userSe === "ADMIN" ? "blue" : "default"}>{u.userSe === "ADMIN" ? "관리자" : "사용자"}</Chip>
          {u.roles.length > 0 && <span className="text-[11.5px] text-muted-foreground">{u.roles.map(roleName).join(" · ")}</span>}
          {showPlus &&
            dutiesOf(u, duties[u.userId] ?? []).map((d) => (
              <span key={d} data-plus className="basis-full">
                <Chip variant="h18" className="border-violet-line text-violet">
                  ◇ {dutyName(d)}
                </Chip>
              </span>
            ))}
        </span>
      ),
    },
    { key: "org", header: "소속 관서", wrap: true, render: (u) => <span className="text-[12px] text-muted-foreground">{u.orgNm}</span> },
    { key: "status", header: "상태", render: (u) => <UserStatusChip user={u} /> },
    {
      key: "last",
      header: "마지막 로그인",
      render: (u) => <span className="font-code text-[12px] tabular-nums text-muted-foreground">{u.lastLoginDt ? formatKstDateTime(u.lastLoginDt) : "기록 없음"}</span>,
    },
  ]

  const visibleKeys = new Set(props.visibleColumns ?? USER_COLUMNS.map((c) => c.key))
  const shownColumns = columns.filter((c) => c.key === "userId" || visibleKeys.has(c.key))
  const filter = props.filter
  const filterActive = filter ? filter.query.trim() !== "" || filter.groups.some((g) => g.value.length > 0) : false

  const selected = users.find((u) => u.userId === props.selectedUserId) ?? null

  const list = (() => {
    if (status === "loading") {
      return <p className="m-0 px-[14px] py-[28px] text-center text-[12.5px] text-dim">불러오는 중…</p>
    }
    if (status === "error") {
      // 조회 실패는 「결과 없음」으로 덮지 않는다
      return (
        <div className="px-[14px] py-[28px] text-center">
          <InlineError message="사용자 목록을 확인하지 못했습니다" at={errorAt} onRetry={onRetry} />
        </div>
      )
    }
    if (status === "ready" && filter && filterActive && users.length === 0) {
      // 거른 결과 0건 — 조회 실패(InlineError) · 데이터 없음(결과 없음)과 다른 모양
      return (
        <div className="px-[14px] py-[28px] text-center">
          <p role="status" className="m-0 mb-[8px] text-[12.5px] text-dim">
            조건에 맞는 항목 없음
          </p>
          <Button size="sm" onClick={filter.onClear}>
            조건 지우기
          </Button>
        </div>
      )
    }
    return (
      <div className="overflow-x-auto">
        <DataGrid
          columns={shownColumns}
          rows={status === "empty" ? [] : users}
          rowKey={(u) => u.userId}
          selectedKey={props.selectedUserId ?? undefined}
          onRowClick={(u) => props.onSelectUser(u.userId)}
        />
      </div>
    )
  })()

  const ready = status === "ready"

  return (
    <div aria-busy={status === "loading"} className="min-w-0 p-[16px]">
      {showPlus && (
        <div
          data-plus
          className="mb-[12px] flex items-center gap-[8px] rounded-[10px] border border-solid border-warn/35 bg-warn-bg px-[12px] py-[9px] text-[12.5px] text-fg-2"
        >
          <b className="text-warn">관리자 전용 메뉴</b> — 다른 역할에게는 메뉴가 보이지 않습니다.
        </div>
      )}
      <Crumb items={["족적", "관리", "사용자 관리"]} />
      <PageHead
        title="사용자 관리"
        description="계정마다 역할과 기능 권한을 정하고, 비밀번호 초기화 · 잠금 해제 · 사용 중지를 합니다."
        actions={
          showPlus ? (
            <span data-plus>
              <Button onClick={props.onExport}>엑셀</Button>
            </span>
          ) : undefined
        }
      />
      {showPlus && ready && props.overview && <UsersOverviewTiles overview={props.overview} />}
      {filter && (
        <Panel aria-label="사용자 거르기" className="mb-[12px]">
          <div className="px-[14px] py-[10px]">
            <FilterBar
              query={filter.query}
              onQueryChange={filter.onQueryChange}
              filters={filter.groups}
              onFilterChange={filter.onGroupChange}
              onClear={filter.onClear}
              resultCount={ready ? users.length : undefined}
              total={ready ? filter.total : undefined}
              searchPlaceholder="아이디·이름"
            />
          </div>
        </Panel>
      )}
      <div className="grid items-start gap-[12px] xl:grid-cols-[minmax(0,640px)_minmax(0,1fr)]">
        <div className="grid min-w-0 gap-[12px]">
        <section aria-label="사용자 목록" className="min-w-0">
          <Panel
            corners
            title="사용자"
            actions={
              <>
                <span className="font-code text-[11px] text-brand">{status === "ready" ? `${users.length}명` : ""}</span>
                {showPlus && (
                  <span data-plus className="ml-auto">
                    <Button size="sm" onClick={props.onOpenOrgFilter} className="w-[170px] justify-between font-normal text-fg-2">
                      소속 관서 · 전체
                      <span aria-hidden="true" className="text-dim">
                        ▾
                      </span>
                    </Button>
                  </span>
                )}
                <ColumnPicker
                  columns={USER_COLUMNS}
                  visible={props.visibleColumns ?? USER_COLUMNS.map((c) => c.key)}
                  onChange={(keys) => props.onVisibleColumnsChange?.(keys)}
                />
                <ButtonBar>
                  <Button size="sm" variant="pri" disabled={status === "loading"} onClick={() => props.onDialogChange({ kind: "create", draft: { userId: "", userNm: "", userSe: "USER", initialPassword: "", features: [] }, error: null })}>
                    <UserPlus aria-hidden="true" className="size-[12px]" />
                    사용자 추가
                  </Button>
                </ButtonBar>
              </>
            }
          >
            {list}
          </Panel>
        </section>
        {showPlus && ready && (
          <>
            <RolePresetTable roles={roles} dutyRoleCodes={props.dutyRoleCodes ?? []} />
            <EffectivePermissions
              users={users}
              roles={roles}
              duties={duties}
              selectedUserId={props.selectedUserId}
              notes={props.permissionNotes ?? []}
            />
          </>
        )}
        </div>

        <div className="grid min-w-0 gap-[12px]">
        {status === "ready" && selected && props.draft ? (
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
        ) : status === "ready" ? (
          <Panel corners className="grid place-items-center px-[16px] py-[48px]">
            <p className="m-0 text-[12.5px] text-dim">왼쪽 표에서 사용자를 고르세요</p>
          </Panel>
        ) : null}
        {showPlus && ready && props.adminHistory && props.adminHistory.length > 0 && <AdminHistory rows={props.adminHistory} />}
        </div>
      </div>
      {showPlus && (
        <div
          data-plus
          className="mt-[12px] inline-flex flex-wrap items-center gap-[8px] rounded-[10px] border border-solid border-border bg-panel px-[12px] py-[8px] text-[12px] text-muted-foreground"
        >
          <Chip variant="blue">관리자</Chip> 모든 조작 <span aria-hidden="true">|</span> <Chip>그 밖의 역할</Chip> 메뉴 없음 · 화면 잠김{" "}
          <span aria-hidden="true">|</span> 본인 계정은 다른 관리자만 변경
        </div>
      )}
      <UserDialogs dialog={props.dialog} onChange={props.onDialogChange} onSubmit={props.onDialogSubmit} />
    </div>
  )
}
