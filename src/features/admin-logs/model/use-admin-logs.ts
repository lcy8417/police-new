/**
 * 사용 기록 화면 — 거르기 선택지 쿼리(TanStack Query). 목록 쪽 쿼리는 `use-log-pages.ts`.
 */
import { useQuery } from "@tanstack/react-query"

import { adminQueryKeys, fetchActions, fetchUsers } from "@/entities/admin"

/** GET /admin/users — "사용자" 필터 선택지(사용자·권한 화면과 같은 캐시). */
export function useLogUsersQuery() {
  return useQuery({ queryKey: adminQueryKeys.users, queryFn: fetchUsers })
}

/** GET /admin/actions — "기능" 필터 선택지(바뀌지 않는 이름표라 오래 캐시). */
export function useActionsQuery() {
  return useQuery({ queryKey: adminQueryKeys.actions, queryFn: fetchActions, staleTime: Infinity })
}
