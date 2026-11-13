/**
 * 관리자 API 쿼리 키(TanStack Query) — 사용자·권한 관리와 사용 기록 화면이 같은 키를 쓴다
 * (예: 사용 기록의 "사용자" 필터는 사용자 표와 같은 캐시를 읽는다).
 */
import type { EventFilters, SessionFilters } from "../model/types";

export const adminQueryKeys = {
  /** GET /admin/users */
  users: ["admin", "users"] as const,
  /** GET /admin/actions */
  actions: ["admin", "actions"] as const,
  /** GET /admin/roles */
  roles: ["admin", "roles"] as const,
  /** GET /admin/orgs */
  orgs: ["admin", "orgs"] as const,
  /** GET /admin/sessions — 페이지(`page`)는 무한 스크롤 쿼리가 관리하므로 키에 넣지 않는다. */
  sessions: (filters: Omit<SessionFilters, "page">) => ["admin", "sessions", filters] as const,
  /** GET /admin/sessions/{id}/events */
  sessionEvents: (sessionId: string) => ["admin", "sessions", sessionId, "events"] as const,
  /** GET /admin/events */
  events: (filters: Omit<EventFilters, "page">) => ["admin", "events", filters] as const,
};
