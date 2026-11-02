/**
 * 사용 기록 화면 — 서버 상태 훅(TanStack Query). 목록은 50개 단위 "더 보기"(무한 쿼리):
 * 서버가 전체 개수를 주지 않으므로, 받은 페이지가 50개 미만이거나 비어 있으면 끝으로 본다.
 * 기록은 계속 쌓이므로 화면에 다시 들어올 때마다 새로 읽는다(`staleTime: 0`).
 */
import { useInfiniteQuery, useQuery } from "@tanstack/react-query"

import {
  adminQueryKeys,
  fetchActions,
  fetchEvents,
  fetchSessionEvents,
  fetchSessions,
  fetchUsers,
  type EventFilters,
  type SessionFilters,
} from "@/entities/admin"

import { LOG_PAGE_SIZE } from "./log-filters"

/** 다음 페이지 번호 — 마지막 페이지(50개 미만)면 `undefined`. */
function nextPage(lastPage: unknown[], allPages: unknown[][]): number | undefined {
  return lastPage.length < LOG_PAGE_SIZE ? undefined : allPages.length
}

/** GET /admin/sessions — 로그인 기록(최신순). */
export function useSessionsQuery(filters: Omit<SessionFilters, "page">) {
  return useInfiniteQuery({
    queryKey: adminQueryKeys.sessions(filters),
    queryFn: ({ pageParam }) => fetchSessions({ ...filters, page: pageParam }),
    initialPageParam: 0,
    getNextPageParam: nextPage,
    staleTime: 0,
  })
}

/** GET /admin/events — 기능 기록(최신순). `enabled`: 기능 기록 탭을 열었을 때만 부른다. */
export function useEventsQuery(filters: Omit<EventFilters, "page">, enabled = true) {
  return useInfiniteQuery({
    queryKey: adminQueryKeys.events(filters),
    queryFn: ({ pageParam }) => fetchEvents({ ...filters, page: pageParam }),
    initialPageParam: 0,
    getNextPageParam: nextPage,
    staleTime: 0,
    enabled,
  })
}

/** GET /admin/sessions/{id}/events — 한 로그인의 기능 기록(시간순). 펼친 행만 부른다. */
export function useSessionEventsQuery(sessionId: string) {
  return useQuery({
    queryKey: adminQueryKeys.sessionEvents(sessionId),
    queryFn: () => fetchSessionEvents(sessionId),
    staleTime: 0,
  })
}

/** GET /admin/users — "사용자" 필터 선택지(사용자·권한 화면과 같은 캐시). */
export function useLogUsersQuery() {
  return useQuery({ queryKey: adminQueryKeys.users, queryFn: fetchUsers })
}

/** GET /admin/actions — "기능" 필터 선택지(바뀌지 않는 이름표라 오래 캐시). */
export function useActionsQuery() {
  return useQuery({ queryKey: adminQueryKeys.actions, queryFn: fetchActions, staleTime: Infinity })
}
