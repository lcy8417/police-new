import { useCallback, useMemo, useState } from "react"
import { toast } from "sonner"

import {
  ADMIN_EVENT_SE,
  auditShortTime,
  describeAuditEvent,
  useAuditEventsQuery,
  type AdminUser,
  type AuditEvent,
} from "@/entities/admin"
import { FEATURE_LABELS, FEATURES, passwordRuleError, type FeatureCode } from "@/entities/session"
import {
  USER_FORM_MESSAGES,
  USER_ID_PATTERN,
  adminErrorMessage,
  useCreateUser,
  useFeaturesQuery,
  useOrgsQuery,
  useReplaceFeatures,
  useReplaceRoles,
  useResetPassword,
  useRolesQuery,
  useUnlockUser,
  useUpdateUser,
  useUsersQuery,
} from "@/features/admin-users"
import { refreshSession, useSessionStore } from "@/features/auth"
import {
  AdminUsersScreen,
  EMPTY_USER_FILTER,
  filterUsers,
  userFilterGroups,
  type AdminHistoryRow,
  type AdminUsersPlusPart,
  type ShoeDuty,
  type UserDialogState,
  type UserDraft,
  type UsersFilterProps,
} from "@/widgets/admin-users-screen"
import { usePageHeader } from "@/widgets/app-shell"
import { formatKstDateTime } from "@/shared/lib"
import type { ScreenStatus } from "@/shared/lib/screen-status"

/**
 * 실제 페이지에서 켜는 신규(+α) 요소 — 서버 값이 있는 것만(이식 계획): 관리자 변경 이력(감사 K2 관리 4종).
 * 운영 타일(비밀번호 경과 · 승인 대기 집계 없음) · 엑셀 · 관서 고르기 단추 · 역할 프리셋 표(시안 「신규」 표시) · 상세의 분업 칸은 끈다 —
 * 분업(문양 입력 · 신발 승인)은 서버 기능 권한(0017)이라 「기능 권한」 스위치로 켜고 「권한 저장」으로 저장한다(분업 = 기능 하나로 합침).
 */
const PLUS_PARTS: AdminUsersPlusPart[] = ["history"]

const draftOf = (u: AdminUser): UserDraft => ({ userNm: u.userNm, userSe: u.userSe, orgId: u.orgId, features: u.features, roles: u.roles })

/** 분업(문양 입력 · 신발 승인) = 개인 기능 권한(서버 0017) — 위젯의 분업 값은 기능 권한에서 읽는다. */
const DUTY_FEATURES: ShoeDuty[] = [FEATURES.SHOE_PATTERN, FEATURES.SHOE_APPROVE]
const dutiesFromFeatures = (users: AdminUser[]): Record<string, ShoeDuty[]> =>
  Object.fromEntries(users.map((u) => [u.userId, DUTY_FEATURES.filter((d) => u.features.includes(d))]))

const hhmm = (ms: number) => (ms ? formatKstDateTime(new Date(ms).toISOString()).slice(11, 16) : undefined)

/**
 * 관리자 화면 `/manage/users` — S13 사용자 관리 위젯(`AdminUsersScreen`)에 실제 값을 꽂는다.
 * 사용자 · 역할 · 관서 · 기능 목록(기존 `/admin/*`), 저장은 기존 관리자 API, 관리자 변경 이력 = 감사 기록 K2.
 * 서버 거절 문구(예 400 「관리자는 최소 1명 있어야 합니다」)는 그대로 알림으로, 창 안 오류는 창 안 줄로.
 * 본인 계정을 고친 경우에만 세션을 다시 확인한다(`refreshSession` — 이름 · 권한이 메뉴에 반영).
 */
export function ManageUsersPage() {
  const me = useSessionStore((s) => s.user)
  const myUserId = me?.userId ?? null

  const usersQuery = useUsersQuery()
  const rolesQuery = useRolesQuery()
  const orgsQuery = useOrgsQuery()
  const featuresQuery = useFeaturesQuery()
  const historyQuery = useAuditEventsQuery({ eventSe: ADMIN_EVENT_SE, page: 0 })

  const [query, setQuery] = useState(EMPTY_USER_FILTER.query)
  const [groups, setGroups] = useState<Record<string, string[]>>(EMPTY_USER_FILTER.groups)
  const [visibleColumns, setVisibleColumns] = useState<string[] | undefined>(undefined)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [edits, setEdits] = useState<Record<string, Partial<UserDraft>>>({})
  const [dialog, setDialog] = useState<UserDialogState>({ kind: "none" })

  const handleUserChanged = useCallback(
    (userId: string) => {
      if (userId === myUserId) void refreshSession()
    },
    [myUserId]
  )
  const changeOptions = { onUserChanged: handleUserChanged }
  const updateUser = useUpdateUser(changeOptions)
  const replaceRoles = useReplaceRoles(changeOptions)
  const replaceFeatures = useReplaceFeatures(changeOptions)
  const unlockUser = useUnlockUser(changeOptions)
  const createUser = useCreateUser(changeOptions)
  const resetPassword = useResetPassword(changeOptions)

  const users = useMemo(() => usersQuery.data ?? [], [usersQuery.data])
  const roles = useMemo(() => rolesQuery.data ?? [], [rolesQuery.data])
  const duties = useMemo(() => dutiesFromFeatures(users), [users])
  const filter = { query, groups }
  const rows = filterUsers(users, duties, filter)
  const filterProps: UsersFilterProps = {
    query,
    onQueryChange: setQuery,
    groups: userFilterGroups(users, roles, duties, filter, false),
    onGroupChange: (key, values) => setGroups((g) => ({ ...g, [key]: values })),
    onClear: () => {
      setQuery(EMPTY_USER_FILTER.query)
      setGroups(EMPTY_USER_FILTER.groups)
    },
    total: users.length,
  }

  // 목록 상태: 사용자 · 역할 · 관서 · 기능 목록이 다 있어야 상세를 그릴 수 있다(하나라도 실패 = 실패)
  const lists = [usersQuery, rolesQuery, orgsQuery, featuresQuery]
  const failed = lists.find((q) => q.isError)
  const status: ScreenStatus = failed ? "error" : lists.some((q) => q.isPending) ? "loading" : users.length === 0 ? "empty" : "ready"

  const selected = users.find((u) => u.userId === selectedUserId) ?? null
  const draft = selected ? { ...draftOf(selected), ...edits[selected.userId] } : null
  const clearEdit = (userId: string, keys: (keyof UserDraft)[]) =>
    setEdits((prev) => {
      const rest = { ...prev[userId] }
      keys.forEach((k) => delete rest[k])
      return { ...prev, [userId]: rest }
    })
  const failToast = (error: unknown) => toast.error(adminErrorMessage(error) ?? "저장하지 못했습니다")

  const labels = {
    roleName: (code: string) => roles.find((r) => r.roleCode === code)?.roleNm ?? code,
    featureName: (code: string) => FEATURE_LABELS[code as FeatureCode] ?? code,
  }
  const toHistoryRow = (e: AuditEvent): AdminHistoryRow => ({
    at: auditShortTime(e.occurredDt),
    who: `${e.actorId} → ${e.targetId}`,
    change: describeAuditEvent(e, labels),
    reason: e.reasonCn ?? "—",
  })
  const historyStatus: ScreenStatus = historyQuery.isError
    ? "error"
    : historyQuery.isPending
      ? "loading"
      : (historyQuery.data?.length ?? 0) === 0
        ? "empty"
        : "ready"

  const handleDialogSubmit = () => {
    if (dialog.kind === "create") {
      const { userId, userNm, userSe, initialPassword, features } = dialog.draft
      if (!USER_ID_PATTERN.test(userId)) return setDialog({ ...dialog, error: USER_FORM_MESSAGES.userId })
      if (!userNm.trim()) return setDialog({ ...dialog, error: USER_FORM_MESSAGES.userNm })
      const ruleError = passwordRuleError(initialPassword)
      if (ruleError) return setDialog({ ...dialog, error: ruleError })
      createUser.mutate(
        { userId, userNm: userNm.trim(), userSe, initialPassword, features: userSe === "ADMIN" ? [] : features },
        {
          onSuccess: () => {
            setSelectedUserId(userId)
            setDialog({ kind: "none" })
          },
          onError: (error) => setDialog({ ...dialog, error: adminErrorMessage(error) }),
        }
      )
    } else if (dialog.kind === "reset") {
      const ruleError = passwordRuleError(dialog.tempPassword)
      if (ruleError) return setDialog({ ...dialog, error: ruleError })
      resetPassword.mutate(
        { userId: dialog.userId, tempPassword: dialog.tempPassword },
        {
          onSuccess: () => setDialog({ kind: "none" }),
          onError: (error) => setDialog({ ...dialog, error: adminErrorMessage(error) }),
        }
      )
    }
  }

  const headerTitle = useMemo(
    () => (
      <div className="flex flex-col justify-center gap-1">
        <span className="text-[28px] leading-none font-bold text-white">사용자·권한 관리</span>
        <span className="text-[13px] leading-none font-normal text-[#8A93A6]">
          계정을 추가하고, 사용자마다 역할 · 기능 권한 · 신발 DB 일을 정합니다.
        </span>
      </div>
    ),
    []
  )
  usePageHeader({ title: headerTitle })

  return (
    <div className="h-[calc(100vh-110px)] w-full overflow-auto bg-background">
      <AdminUsersScreen
        showPlus={false}
        plusParts={PLUS_PARTS}
        duties={duties}
        filter={filterProps}
        visibleColumns={visibleColumns}
        onVisibleColumnsChange={setVisibleColumns}
        adminHistory={(historyQuery.data ?? []).map(toHistoryRow)}
        adminHistoryStatus={historyStatus}
        adminHistoryErrorAt={hhmm(historyQuery.errorUpdatedAt)}
        onRetryAdminHistory={() => void historyQuery.refetch()}
        status={status}
        errorAt={hhmm(failed?.errorUpdatedAt ?? 0)}
        onRetry={() => lists.forEach((q) => q.isError && void q.refetch())}
        isAdmin={me?.userSe === "ADMIN"}
        users={rows}
        featureList={featuresQuery.data ?? []}
        roles={roles}
        orgs={orgsQuery.data ?? []}
        currentUserId={myUserId}
        selectedUserId={selectedUserId}
        onSelectUser={setSelectedUserId}
        draft={draft}
        onDraftChange={(patch) => selected && setEdits((prev) => ({ ...prev, [selected.userId]: { ...prev[selected.userId], ...patch } }))}
        onSaveInfo={() => {
          if (!selected || !draft || draft.userNm.trim() === "") return
          updateUser.mutate(
            {
              userId: selected.userId,
              input: { userNm: draft.userNm.trim(), userSe: draft.userSe, useAt: selected.useAt, orgId: draft.orgId },
            },
            { onSuccess: () => clearEdit(selected.userId, ["userNm", "userSe", "orgId"]), onError: failToast }
          )
        }}
        onSaveRoles={() => {
          if (!selected || !draft) return
          replaceRoles.mutate(
            { userId: selected.userId, roles: draft.roles },
            { onSuccess: () => clearEdit(selected.userId, ["roles"]), onError: failToast }
          )
        }}
        onSaveFeatures={() => {
          if (!selected || !draft) return
          replaceFeatures.mutate(
            { userId: selected.userId, features: draft.features },
            { onSuccess: () => clearEdit(selected.userId, ["features"]), onError: failToast }
          )
        }}
        onUnlock={(userId) => unlockUser.mutate(userId, { onError: failToast })}
        onSetUseAt={(userId, useAt) => {
          const user = users.find((u) => u.userId === userId)
          if (!user) return
          updateUser.mutate({ userId, input: { userNm: user.userNm, userSe: user.userSe, useAt } }, { onError: failToast })
        }}
        dialog={dialog}
        onDialogChange={setDialog}
        onDialogSubmit={handleDialogSubmit}
      />
    </div>
  )
}
