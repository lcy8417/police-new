import { useMutation, useQueryClient } from "@tanstack/react-query"

import { apiSend } from "@/shared/api"
import { convertKeysToCamelCase } from "@/shared/lib"

/**
 * 접수(A4 `POST /requests/{rqest_id}/receive`) — 접수 대기(REQUESTED) → 1차 작업(RECEIVED), 접수자 = 주 감정관 배당
 * (B 단계 설계서 §4-1 · §9-1 ②). 판정 확정 권한(EXAM_DECIDE)이 있어야 한다. 접수 대기가 아니면 409.
 * 목록 행 · 사건 창의 「접수」 단추가 이 훅을 부른다(목록 화면 연결은 묶음 ⓪ · 통합).
 */

export interface ReceiveResult {
  rqestSttus: "RECEIVED"
  /** 의뢰 판 번호(사건 정보 수정 A3 의 기대값) */
  rowVersion: number
}

/** POST /requests/{rqest_id}/receive */
export async function receiveRequest(rqestId: number): Promise<ReceiveResult> {
  const res = await apiSend(`/requests/${encodeURIComponent(rqestId)}/receive`, "POST")
  return convertKeysToCamelCase<ReceiveResult>(await res.json())
}

/** 접수 뮤테이션 — 끝나면 의뢰 쿼리(목록 · 상세 · 결과 확인)를 다시 읽는다 */
export function useReceiveRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: receiveRequest,
    meta: { inlineError: true },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["request"] }),
  })
}
