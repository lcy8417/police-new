/**
 * 사용 · 감사 기록 화면(S14 위젯) — 쪽 넘김 쿼리. 서버는 50개씩(0부터) 주고 전체 개수는 주지 않는다.
 * 화면 쪽 크기 100 은 서버 쪽 두 개를 이어 붙인다(앞 쪽이 50개 미만이면 뒤 쪽은 부르지 않음).
 * 기록은 계속 쌓이므로 다시 들어올 때마다 새로 읽는다(`staleTime: 0`).
 */
import { useQueries, useQuery } from "@tanstack/react-query"

import {
  adminQueryKeys,
  fetchAuditEvents,
  fetchEvents,
  fetchSessionEvents,
  fetchSessions,
  type AdminEvent,
  type AuditEventFilters,
  type EventFilters,
  type SessionFilters,
} from "@/entities/admin"

import { LOG_PAGE_SIZE } from "./log-filters"

/** 화면 쪽(1부터) · 쪽 크기 → 서버 쪽들을 읽어 이어 붙인다. */
export async function fetchLogPage<T>(fetchServerPage: (serverPage: number) => Promise<T[]>, page: number, pageSize: number): Promise<T[]> {
  const per = Math.max(1, Math.round(pageSize / LOG_PAGE_SIZE))
  const first = (page - 1) * per
  const out: T[] = []
  for (let i = 0; i < per; i++) {
    const rows = await fetchServerPage(first + i)
    out.push(...rows)
    if (rows.length < LOG_PAGE_SIZE) break
  }
  return out
}

/** GET /admin/sessions — 화면 한 쪽. */
export function useSessionsPageQuery(filters: Omit<SessionFilters, "page">, page: number, pageSize: number, enabled = true) {
  return useQuery({
    queryKey: [...adminQueryKeys.sessions(filters), "screen-page", page, pageSize] as const,
    queryFn: () => fetchLogPage((p) => fetchSessions({ ...filters, page: p }), page, pageSize),
    staleTime: 0,
    enabled,
  })
}

/** GET /admin/events — 화면 한 쪽(대상 번호 K1 포함). */
export function useEventsPageQuery(filters: Omit<EventFilters, "page">, page: number, pageSize: number, enabled = true) {
  return useQuery({
    queryKey: [...adminQueryKeys.events(filters), "screen-page", page, pageSize] as const,
    queryFn: () => fetchLogPage((p) => fetchEvents({ ...filters, page: p }), page, pageSize),
    staleTime: 0,
    enabled,
  })
}

/** GET /admin/audit-events — 화면 한 쪽(관리자 행위 탭). */
export function useAuditPageQuery(filters: Omit<AuditEventFilters, "page">, page: number, pageSize: number, enabled = true) {
  return useQuery({
    queryKey: [...adminQueryKeys.auditEvents(filters), "screen-page", page, pageSize] as const,
    queryFn: () => fetchLogPage((p) => fetchAuditEvents({ ...filters, page: p }), page, pageSize),
    staleTime: 0,
    enabled,
  })
}

/** 한 로그인의 기능 타임라인 상태 */
export interface TimelineState {
  status: "loading" | "error" | "empty" | "ready"
  events: AdminEvent[]
  refetch: () => void
}

/** GET /admin/sessions/{id}/events — 펼친 로그인마다(펼친 것만 부른다). */
export function useSessionTimelines(sessionIds: string[]): Record<string, TimelineState> {
  const results = useQueries({
    queries: sessionIds.map((id) => ({
      queryKey: adminQueryKeys.sessionEvents(id),
      queryFn: () => fetchSessionEvents(id),
      staleTime: 0,
    })),
  })
  const out: Record<string, TimelineState> = {}
  sessionIds.forEach((id, i) => {
    const q = results[i]
    const events = q.data ?? []
    out[id] = {
      status: q.isPending ? "loading" : q.isError ? "error" : events.length === 0 ? "empty" : "ready",
      events,
      refetch: () => void q.refetch(),
    }
  })
  return out
}
