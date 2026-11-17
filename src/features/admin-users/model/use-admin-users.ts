/**
 * 관리자 사용자·권한 관리 — 서버 상태 훅(TanStack Query). 모든 변경은 성공하면 사용자 목록을
 * 무효화해 표를 다시 읽는다. 실패 문구는 화면이 폼·패널 안에 직접 보여 주므로
 * (`meta.inlineError`) 전역 실패 토스트는 띄우지 않는다.
 *
 * 자기 자신을 고친 경우 세션 갱신(`/auth/me` 재확인)은 이 슬라이스가 하지 않는다 — FSD상
 * `features/auth`를 import할 수 없으므로 `onUserChanged`로 페이지에 알리고, 페이지가 판단한다.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  adminQueryKeys,
  createUser,
  fetchFeatures,
  fetchOrgs,
  fetchRoles,
  fetchUsers,
  replaceUserFeatures,
  replaceUserRoles,
  resetPassword,
  unlockUser,
  updateUser,
  type CreateUserInput,
  type RoleCode,
  type UpdateUserInput,
} from "@/entities/admin"
import type { FeatureCode } from "@/entities/session"

export interface AdminUserMutationOptions {
  /** 변경이 성공한 사용자 ID — 페이지가 "나 자신이면 세션 재확인"을 판단한다. */
  onUserChanged?: (userId: string) => void
}

/** GET /admin/users — 사용자 표. */
export function useUsersQuery() {
  return useQuery({ queryKey: adminQueryKeys.users, queryFn: fetchUsers })
}

/** GET /admin/roles — 역할 선택지(이름 · 순서는 서버가 정본). 자주 바뀌지 않아 5분 동안 다시 읽지 않는다. */
export function useRolesQuery() {
  return useQuery({ queryKey: adminQueryKeys.roles, queryFn: fetchRoles, staleTime: 5 * 60_000 })
}

/** GET /admin/orgs — 관서 목록(사용 중지 포함). */
export function useOrgsQuery() {
  return useQuery({ queryKey: adminQueryKeys.orgs, queryFn: fetchOrgs, staleTime: 5 * 60_000 })
}

/** GET /admin/features — 기능 권한 목록(서버 `app.feature` 순서 · 이름 그대로). 바뀌지 않아 오래 캐시. */
export function useFeaturesQuery() {
  return useQuery({ queryKey: adminQueryKeys.features, queryFn: fetchFeatures, staleTime: Infinity })
}

/** 성공 후 공통 처리: 목록 · 감사 기록(관리자 변경 이력 K2) 무효화 + 변경 알림. */
function useAfterChange(options: AdminUserMutationOptions) {
  const queryClient = useQueryClient()
  return async (userId: string) => {
    options.onUserChanged?.(userId)
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.users }),
      queryClient.invalidateQueries({ queryKey: ["admin", "audit-events"] }),
    ])
  }
}

/** POST /admin/users — 사용자 추가. */
export function useCreateUser(options: AdminUserMutationOptions = {}) {
  const afterChange = useAfterChange(options)
  return useMutation({
    mutationFn: (input: CreateUserInput) => createUser(input),
    onSuccess: (_data, input) => afterChange(input.userId),
    meta: { success: "사용자를 추가했습니다", inlineError: true },
  })
}

/** PUT /admin/users/{id} — 이름·구분·사용 여부. */
export function useUpdateUser(options: AdminUserMutationOptions = {}) {
  const afterChange = useAfterChange(options)
  return useMutation({
    mutationFn: ({ userId, input }: { userId: string; input: UpdateUserInput }) =>
      updateUser(userId, input),
    onSuccess: (_data, { userId }) => afterChange(userId),
    meta: { success: "사용자 정보를 저장했습니다", inlineError: true },
  })
}

/** PUT /admin/users/{id}/features — 기능 권한 전체 교체. */
export function useReplaceFeatures(options: AdminUserMutationOptions = {}) {
  const afterChange = useAfterChange(options)
  return useMutation({
    mutationFn: ({ userId, features }: { userId: string; features: FeatureCode[] }) =>
      replaceUserFeatures(userId, features),
    onSuccess: (_data, { userId }) => afterChange(userId),
    meta: { success: "기능 권한을 저장했습니다", inlineError: true },
  })
}

/** PUT /admin/users/{id}/roles — 역할 전체 교체(실효 권한은 다음 요청부터 역할 권한이 합쳐진다). */
export function useReplaceRoles(options: AdminUserMutationOptions = {}) {
  const afterChange = useAfterChange(options)
  return useMutation({
    mutationFn: ({ userId, roles }: { userId: string; roles: RoleCode[] }) =>
      replaceUserRoles(userId, roles),
    onSuccess: (_data, { userId }) => afterChange(userId),
    meta: { success: "역할을 저장했습니다", inlineError: true },
  })
}

/** POST /admin/users/{id}/password-reset — 임시 비밀번호, 그 사용자의 열린 로그인은 모두 종료. */
export function useResetPassword(options: AdminUserMutationOptions = {}) {
  const afterChange = useAfterChange(options)
  return useMutation({
    mutationFn: ({ userId, tempPassword }: { userId: string; tempPassword: string }) =>
      resetPassword(userId, tempPassword),
    onSuccess: (_data, { userId }) => afterChange(userId),
    meta: { success: "임시 비밀번호로 초기화했습니다", inlineError: true },
  })
}

/** POST /admin/users/{id}/unlock — 잠금 해제. */
export function useUnlockUser(options: AdminUserMutationOptions = {}) {
  const afterChange = useAfterChange(options)
  return useMutation({
    mutationFn: (userId: string) => unlockUser(userId),
    onSuccess: (_data, userId) => afterChange(userId),
    meta: { success: "잠금을 해제했습니다", inlineError: true },
  })
}
