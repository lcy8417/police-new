import { useState } from "react"
import { toast } from "sonner"

import type { AdminUser } from "@/entities/admin"
import { passwordRuleError } from "@/entities/session"
import { USER_FORM_MESSAGES, USER_ID_PATTERN } from "@/features/admin-users"
import {
  AdminUsersScreen,
  EMPTY_USER_FILTER,
  USER_COLUMNS,
  filterUsers,
  userFilterGroups,
  type ShoeDuty,
  type UserDialogState,
  type UserDraft,
  type UserFilterValue,
  type UsersFilterProps,
} from "@/widgets/admin-users-screen"

import {
  devScreen,
  DevScreenFrame,
  isStringListRecord,
  SCREEN_CASES,
  subsetOf,
  useDevCase,
  useDevPlus,
  useDevViewer,
  useRememberedState,
} from "../frame"
import {
  MOCK_ADMIN_HISTORY,
  MOCK_CURRENT_USER_ID,
  MOCK_DUTIES,
  MOCK_DUTY_ROLE_CODES,
  MOCK_FEATURES,
  MOCK_LOGIN_META,
  MOCK_ORGS,
  MOCK_OVERVIEW,
  MOCK_PERMISSION_NOTES,
  MOCK_PRESET_HINT,
  MOCK_ROLES,
  MOCK_USERS,
} from "./mock-cases"

const info = devScreen("s13")
/** 서버 거절 문구(api-communication §1-1 — 400) 그대로 */
const LAST_ADMIN_MESSAGE = "관리자는 최소 1명 있어야 합니다"
const COLUMN_KEYS: string[] = USER_COLUMNS.map((c) => c.key)
const isColumnKeys = subsetOf(COLUMN_KEYS)

const draftOf = (u: AdminUser): UserDraft => ({ userNm: u.userNm, userSe: u.userSe, orgId: u.orgId, features: u.features, roles: u.roles })

// S13 사용자 관리 진열 페이지: 사용자 목록 · 선택 · 편집 값 · 열린 창을 여기서 들고(제어형) 눌러 보면 바뀐다.
export function S13DevPage() {
  const activeCase = useDevCase(SCREEN_CASES.s13,"ready")
  const viewer = useDevViewer()
  const plus = useDevPlus()
  const [duties, setDuties] = useState<Record<string, ShoeDuty[]>>(MOCK_DUTIES)
  // r3 보기 설정(설계서 §14-6): 거르기 칩 · 보이는 열은 이 브라우저에 기억. 검색어는 이번 화면에서만
  const [query, setQuery] = useState(EMPTY_USER_FILTER.query)
  const [groups, setGroups] = useRememberedState<Record<string, string[]>>("s13", "filters", EMPTY_USER_FILTER.groups, isStringListRecord)
  const filter: UserFilterValue = { query, groups }
  const [visibleColumns, setVisibleColumns] = useRememberedState<string[]>("s13", "columns", COLUMN_KEYS, isColumnKeys)
  const [users, setUsers] = useState<AdminUser[]>(MOCK_USERS)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(MOCK_USERS[0].userId)
  const [edits, setEdits] = useState<Record<string, Partial<UserDraft>>>({})
  const [dialog, setDialog] = useState<UserDialogState>({ kind: "none" })
  const [retries, setRetries] = useState(0)

  const selected = users.find((u) => u.userId === selectedUserId) ?? null
  const draft = selected ? { ...draftOf(selected), ...edits[selected.userId] } : null

  const patchUser = (userId: string, patch: Partial<AdminUser>) =>
    setUsers((prev) => prev.map((u) => (u.userId === userId ? { ...u, ...patch } : u)))
  // 이 사람 말고 쓰는 중인 관리자가 없나(서버 「관리자는 최소 1명」 규칙을 화면에서 먼저)
  const isLastActiveAdmin = (userId: string) => !users.some((u) => u.userId !== userId && u.userSe === "ADMIN" && u.useAt === "Y")
  const clearEdit = (userId: string, keys: (keyof UserDraft)[]) =>
    setEdits((prev) => {
      const rest = { ...prev[userId] }
      keys.forEach((k) => delete rest[k])
      return { ...prev, [userId]: rest }
    })

  const handleDialogSubmit = () => {
    if (dialog.kind === "create") {
      const { userId, userNm, userSe, initialPassword, features } = dialog.draft
      if (!USER_ID_PATTERN.test(userId)) return setDialog({ ...dialog, error: USER_FORM_MESSAGES.userId })
      if (!userNm.trim()) return setDialog({ ...dialog, error: USER_FORM_MESSAGES.userNm })
      const ruleError = passwordRuleError(initialPassword)
      if (ruleError) return setDialog({ ...dialog, error: ruleError })
      if (users.some((u) => u.userId === userId)) return setDialog({ ...dialog, error: "이미 등록된 아이디입니다" })
      const created: AdminUser = { userId, userNm: userNm.trim(), userSe, useAt: "Y", lockAt: "N", features: userSe === "ADMIN" ? [] : features, lastLoginDt: null, roles: [], orgId: MOCK_ORGS[0].orgId, orgNm: MOCK_ORGS[0].orgNm }
      setUsers((prev) => [...prev, created])
      setSelectedUserId(userId)
      setDialog({ kind: "none" })
      toast.success(`${userId} 사용자를 추가했습니다`)
    } else if (dialog.kind === "reset") {
      const ruleError = passwordRuleError(dialog.tempPassword)
      if (ruleError) return setDialog({ ...dialog, error: ruleError })
      toast.success(`${dialog.userId} 비밀번호를 초기화했습니다(진열용)`)
      setDialog({ kind: "none" })
    }
  }

  const status = activeCase
  // r3: 아이디·이름 검색 + 역할 · 신발 DB · 상태 거르기(신규 아님 — plus 와 무관). 신발 DB 묶음만 신규 개념이라 plus 일 때
  const activeFilter = plus ? filter : { ...filter, groups: { ...filter.groups, duty: [] } }
  const rows = status === "empty" ? [] : filterUsers(users, duties, activeFilter)
  const filterProps: UsersFilterProps = {
    query: filter.query,
    onQueryChange: setQuery,
    groups: userFilterGroups(users, MOCK_ROLES, duties, activeFilter, plus),
    onGroupChange: (key, values) => setGroups((g) => ({ ...g, [key]: values })),
    onClear: () => {
      setQuery(EMPTY_USER_FILTER.query)
      setGroups(EMPTY_USER_FILTER.groups)
    },
    total: status === "empty" ? 0 : users.length,
  }

  return (
    <DevScreenFrame screen={info.screen} title={info.title} cases={info.cases}>
      <AdminUsersScreen
        showPlus={plus}
        duties={duties}
        onToggleDuty={(userId, duty, on) => {
          setDuties((prev) => {
            const cur = prev[userId] ?? []
            return { ...prev, [userId]: on ? [...cur.filter((d) => d !== duty), duty] : cur.filter((d) => d !== duty) }
          })
          toast(`신발 DB 분업을 ${on ? "켰습니다" : "껐습니다"}(진열용 — 서버 저장 없음)`)
        }}
        dutyRoleCodes={MOCK_DUTY_ROLE_CODES}
        presetHint={MOCK_PRESET_HINT}
        filter={filterProps}
        visibleColumns={visibleColumns}
        onVisibleColumnsChange={setVisibleColumns}
        onOpenOrgFilter={() => toast("시안 — 기능 준비 중")}
        loginMeta={MOCK_LOGIN_META}
        overview={MOCK_OVERVIEW}
        adminHistory={MOCK_ADMIN_HISTORY}
        permissionNotes={MOCK_PERMISSION_NOTES}
        onExport={() => toast("시안 — 기능 준비 중")}
        status={status}
        errorAt="14:05"
        onRetry={() => {
          setRetries((n) => n + 1)
          toast(`다시 확인합니다(진열용 ${retries + 1}회)`)
        }}
        isAdmin={viewer.isAdmin}
        users={rows}
        featureList={MOCK_FEATURES}
        roles={MOCK_ROLES}
        orgs={MOCK_ORGS}
        currentUserId={MOCK_CURRENT_USER_ID}
        selectedUserId={selectedUserId}
        onSelectUser={setSelectedUserId}
        draft={draft}
        onDraftChange={(patch) => selected && setEdits((prev) => ({ ...prev, [selected.userId]: { ...prev[selected.userId], ...patch } }))}
        onSaveInfo={() => {
          // 이름이 비면 저장하지 않는다(상세 칸이 「이름을 입력하세요」를 보인다)
          if (!selected || !draft || draft.userNm.trim() === "") return
          // 마지막 활성 관리자는 일반 사용자로 내릴 수 없다(서버 400 문구 그대로 — 3회차 검수)
          if (selected.userSe === "ADMIN" && draft.userSe !== "ADMIN" && isLastActiveAdmin(selected.userId)) {
            toast.error(LAST_ADMIN_MESSAGE)
            return
          }
          const org = MOCK_ORGS.find((o) => o.orgId === draft.orgId)
          patchUser(selected.userId, { userNm: draft.userNm.trim(), userSe: draft.userSe, orgId: draft.orgId, orgNm: org?.orgNm ?? selected.orgNm })
          clearEdit(selected.userId, ["userNm", "userSe", "orgId"])
          toast.success("정보를 저장했습니다")
        }}
        onSaveRoles={() => {
          if (!selected || !draft) return
          patchUser(selected.userId, { roles: draft.roles })
          clearEdit(selected.userId, ["roles"])
          toast.success("역할을 저장했습니다")
        }}
        onSaveFeatures={() => {
          if (!selected || !draft) return
          patchUser(selected.userId, { features: draft.features })
          clearEdit(selected.userId, ["features"])
          toast.success("권한을 저장했습니다")
        }}
        onUnlock={(userId) => {
          patchUser(userId, { lockAt: "N" })
          toast.success(`${userId} 잠금을 풀었습니다`)
        }}
        onSetUseAt={(userId, useAt) => {
          // 마지막 활성 관리자는 사용 중지할 수 없다(3회차 검수)
          if (useAt === "N" && users.find((u) => u.userId === userId)?.userSe === "ADMIN" && isLastActiveAdmin(userId)) {
            toast.error(LAST_ADMIN_MESSAGE)
            return
          }
          patchUser(userId, { useAt })
          toast.success(useAt === "N" ? `${userId} 사용을 중지했습니다` : `${userId} 다시 사용합니다`)
        }}
        dialog={dialog}
        onDialogChange={setDialog}
        onDialogSubmit={handleDialogSubmit}
      />
    </DevScreenFrame>
  )
}
