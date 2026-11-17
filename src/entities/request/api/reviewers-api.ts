import { useQuery } from "@tanstack/react-query"

import { apiGet } from "@/shared/api"
import { convertKeysToCamelCase } from "@/shared/lib"

/**
 * 교차 검증자 후보 — 서버 H1 `GET /requests/{rqest_id}/reviewers`(B 단계 설계서 §4-8).
 * CROSS_REVIEW 권한이 있는 사용 중 계정 중 요청자 본인 · 그 의뢰 판정자를 서버가 뺀다. 판정 확정 권한(EXAM_DECIDE)이 있어야 부를 수 있다.
 */

/** 검증자 후보 한 사람 */
export interface ReviewerDto {
  /** 로그인 ID — H2 `reviewerId` 로 보낸다 */
  userId: string
  /** 이름 */
  userNm: string
  /** 소속 관서 이름(없으면 null) */
  orgNm: string | null
}

export const reviewerKeys = {
  list: (rqestId: number) => ["request", rqestId, "reviewers"] as const,
}

/** GET /requests/{rqest_id}/reviewers */
export async function fetchReviewers(rqestId: number): Promise<ReviewerDto[]> {
  return convertKeysToCamelCase<ReviewerDto[]>(await apiGet<unknown>(`/requests/${encodeURIComponent(rqestId)}/reviewers`))
}

/** 교차 검증자 후보. `enabled` 가 false(권한 없음 · 의뢰 번호 모름)면 부르지 않는다 */
export function useReviewers(rqestId: number | null, enabled: boolean) {
  return useQuery({
    queryKey: reviewerKeys.list(rqestId ?? 0),
    queryFn: () => fetchReviewers(rqestId as number),
    enabled: enabled && rqestId !== null,
    staleTime: 60_000,
  })
}
