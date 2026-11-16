import { UserPlus } from "lucide-react"

import type { AdminUser } from "@/entities/admin"
import { formatKstDateTime } from "@/shared/lib"
import { Button, Chip, DataGrid, InlineError, type DataGridColumn } from "@/shared/ui/kit"
import { ButtonBar, Crumb, PageHead, Panel } from "@/shared/ui/panel"

import type { AdminUsersScreenProps } from "../model/types"
import { UserDetail } from "./UserDetail"
import { UserDialogs } from "./UserDialogs"
import { UserStatusChip } from "./UserStatusChip"

/**
 * S13 사용자 관리: 왼쪽 사용자 표 + 오른쪽 상세. 서버 호출 · 전역 상태 없이 props 만 그린다.
 * 시안의 운영 상태 타일 · 역할 프리셋 표 · 실제 권한 표 · 관리자 변경 이력 · 신발 DB 분업은 담지 않는다(spec §5-2).
 */
export function AdminUsersScreen(props: AdminUsersScreenProps) {
  const { status, isAdmin, users, roles, onRetry, errorAt } = props

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
    return (
      <div className="overflow-x-auto">
        <DataGrid
          columns={columns}
          rows={status === "empty" ? [] : users}
          rowKey={(u) => u.userId}
          selectedKey={props.selectedUserId ?? undefined}
          onRowClick={(u) => props.onSelectUser(u.userId)}
        />
      </div>
    )
  })()

  return (
    <div aria-busy={status === "loading"} className="min-w-0 p-[16px]">
      <Crumb items={["족적", "관리", "사용자 관리"]} />
      <PageHead
        title="사용자 관리"
        description="계정마다 역할과 기능 권한을 정하고, 비밀번호 초기화 · 잠금 해제 · 사용 중지를 합니다."
      />
      <div className="grid items-start gap-[12px] xl:grid-cols-[minmax(0,640px)_minmax(0,1fr)]">
        <section aria-label="사용자 목록" className="min-w-0">
          <Panel
            corners
            title="사용자"
            actions={
              <>
                <span className="font-code text-[11px] text-brand">{status === "ready" ? `${users.length}명` : ""}</span>
                <ButtonBar>
                  <Button size="sm" variant="pri" disabled={status === "loading"} onClick={() => props.onDialogChange({ kind: "create", draft: { userId: "", userNm: "", userSe: "USER", initialPassword: "" }, error: null })}>
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
          />
        ) : status === "ready" ? (
          <Panel corners className="grid place-items-center px-[16px] py-[48px]">
            <p className="m-0 text-[12.5px] text-dim">왼쪽 표에서 사용자를 고르세요</p>
          </Panel>
        ) : null}
      </div>
      <UserDialogs dialog={props.dialog} onChange={props.onDialogChange} onSubmit={props.onDialogSubmit} />
    </div>
  )
}
