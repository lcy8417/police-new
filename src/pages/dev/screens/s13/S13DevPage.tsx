import { useState } from "react"
import { toast } from "sonner"

import type { AdminUser } from "@/entities/admin"
import { passwordRuleError } from "@/entities/session"
import { USER_FORM_MESSAGES, USER_ID_PATTERN } from "@/features/admin-users"
import { AdminUsersScreen, type UserDialogState, type UserDraft } from "@/widgets/admin-users-screen"

import { DEV_CASES, DEV_SCREENS, DevScreenFrame, useDevCase, useDevViewer } from "../frame"
import { MOCK_CURRENT_USER_ID, MOCK_FEATURES, MOCK_ORGS, MOCK_ROLES, MOCK_USERS } from "./mock-cases"

const info = DEV_SCREENS.find((s) => s.id === "s13")!

const draftOf = (u: AdminUser): UserDraft => ({ userNm: u.userNm, userSe: u.userSe, orgId: u.orgId, features: u.features, roles: u.roles })

// S13 사용자 관리 진열 페이지: 사용자 목록 · 선택 · 편집 값 · 열린 창을 여기서 들고(제어형) 눌러 보면 바뀐다.
export function S13DevPage() {
  const activeCase = useDevCase(DEV_CASES, "ready")
  const viewer = useDevViewer()
  const [users, setUsers] = useState<AdminUser[]>(MOCK_USERS)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(MOCK_USERS[0].userId)
  const [edits, setEdits] = useState<Record<string, Partial<UserDraft>>>({})
  const [dialog, setDialog] = useState<UserDialogState>({ kind: "none" })
  const [retries, setRetries] = useState(0)

  const selected = users.find((u) => u.userId === selectedUserId) ?? null
  const draft = selected ? { ...draftOf(selected), ...edits[selected.userId] } : null

  const patchUser = (userId: string, patch: Partial<AdminUser>) =>
    setUsers((prev) => prev.map((u) => (u.userId === userId ? { ...u, ...patch } : u)))
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
  const rows = status === "empty" ? [] : users

  return (
    <DevScreenFrame screen={info.screen} title={info.title} cases={DEV_CASES}>
      <AdminUsersScreen
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
          if (!selected || !draft) return
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
