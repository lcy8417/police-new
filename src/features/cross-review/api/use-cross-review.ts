import { useMutation, useQueryClient } from "@tanstack/react-query"

import { apiSend } from "@/shared/api"
import { convertKeysToCamelCase } from "@/shared/lib"

/**
 * 교차 검증 요청(H2 `POST /requests/{rqest_id}/cross-review`) · 회수(H5 `POST /review-steps/{step_id}/withdraw`) —
 * B 단계 설계서 §4-8. 검증자 의견(H4) · 검증함(H3) 화면은 이번 범위 밖(잠금 §4) — 요청자 · 관리자가 회수로 언제든 되돌린다.
 * 실패(409 확정 안 된 장 · 이미 요청됨 · 이미 결정됨, 400 자기 판정자, 403 요청자 아님)는 `ApiError.detail` 그대로.
 */

export interface RequestCrossReviewInput {
  rqestId: number
  /** 검증자 ID(H1 후보의 `userId`) */
  reviewerId: string
}

export interface RequestCrossReviewResult {
  stepId: number
  rqestSttus: "CROSS_REVIEW"
}

export interface WithdrawCrossReviewInput {
  stepId: number
  /** 회수 사유 — 관리자가 남의 요청을 회수할 때 필수(요청자 본인은 생략 가능) */
  reasonCn?: string | null
}

export interface WithdrawCrossReviewResult {
  resultCode: "WITHDRAWN"
  rqestSttus: "IN_EXAM"
}

/** POST /requests/{rqest_id}/cross-review */
export async function requestCrossReview(input: RequestCrossReviewInput): Promise<RequestCrossReviewResult> {
  const res = await apiSend(`/requests/${encodeURIComponent(input.rqestId)}/cross-review`, "POST", {
    reviewerId: input.reviewerId,
  })
  return convertKeysToCamelCase<RequestCrossReviewResult>(await res.json())
}

/** POST /review-steps/{step_id}/withdraw */
export async function withdrawCrossReview(input: WithdrawCrossReviewInput): Promise<WithdrawCrossReviewResult> {
  const res = await apiSend(`/review-steps/${encodeURIComponent(input.stepId)}/withdraw`, "POST", {
    reasonCn: input.reasonCn ?? null,
  })
  return convertKeysToCamelCase<WithdrawCrossReviewResult>(await res.json())
}

/** 교차 검증 요청 뮤테이션 — 끝나면 의뢰 쿼리(결과 확인 · 목록 · 상세)를 다시 읽는다 */
export function useRequestCrossReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: requestCrossReview,
    meta: { inlineError: true },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["request"] }),
  })
}

/** 교차 검증 회수 뮤테이션 — 끝나면 의뢰 쿼리를 다시 읽는다 */
export function useWithdrawCrossReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: withdrawCrossReview,
    meta: { inlineError: true },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["request"] }),
  })
}
