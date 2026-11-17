/**
 * 감사 기록 읽기 쿼리(TanStack Query) — K2 감사 기록 · K3 사슬 검증. 사용 기록 화면 · 사용자 관리 화면이 같이 쓴다.
 * 기록은 계속 쌓이므로 화면에 다시 들어올 때마다 새로 읽는다(`staleTime: 0`).
 */
import { useQuery } from "@tanstack/react-query";

import type { AuditEventFilters } from "../model/types";
import { fetchAuditEvents, verifyAuditChain } from "./admin-api";
import { adminQueryKeys } from "./admin-keys";

/** GET /admin/audit-events — 한 쪽(50개, 최신순). `enabled`: 그 탭 · 칸을 볼 때만. */
export function useAuditEventsQuery(filters: AuditEventFilters, enabled = true) {
  return useQuery({
    queryKey: adminQueryKeys.auditEvents(filters),
    queryFn: () => fetchAuditEvents(filters),
    staleTime: 0,
    enabled,
  });
}

/** GET /admin/audit-events/verify — 감사 사슬 전체 검증(읽기만). */
export function useAuditVerifyQuery(enabled = true) {
  return useQuery({
    queryKey: adminQueryKeys.auditVerify,
    queryFn: () => verifyAuditChain(),
    staleTime: 0,
    enabled,
  });
}
