import { useMutation, useQueryClient } from "@tanstack/react-query"

import { targetKeys, targetsPath, type TargetList } from "@/entities/crime/api/targets-api"
import { apiSend } from "@/shared/api"
import { convertKeysToCamelCase } from "@/shared/lib"

/**
 * 확인대상 ★ 더하기(E3 `POST /crime/{no}/targets`) · 빼기(E4 `DELETE …/targets/{search_no}/{ftwr_id}`) — B 단계 설계서 §4-5.
 * 확정 판정이 있는 감정물이면 서버가 「다시 판정」(이전 판본 대체 + 새 회차)을 한다 → 결과 확인(G1) · 사건 목록도 다시 읽는다.
 * 실패(409 교차 검증 중 · 접수 전, 400 다른 감정물의 검색 · 없는 신발)는 `ApiError.detail` 그대로 — 부르는 쪽이 알림으로.
 */

export interface ToggleTargetInput {
  /** 검색 번호 */
  searchNo: number
  /** 신발 ID — 문자열(앞자리 0 보존) */
  ftwrId: string
  /** 고른 곳(검색 결과 ★ · 정밀 대조) — 더할 때만 쓴다 */
  from: "search" | "compare"
  /** true = 지금 확인대상이라 뺀다(E4), false = 더한다(E3) */
  remove: boolean
}

/** E3 · E4 한 번 → 바뀐 뒤 확인대상 목록(E2 모양) */
export async function toggleTarget(aprthngNo: string, input: ToggleTargetInput): Promise<TargetList> {
  const res = input.remove
    ? await apiSend(
        `${targetsPath(aprthngNo)}/${encodeURIComponent(input.searchNo)}/${encodeURIComponent(input.ftwrId)}`,
        "DELETE"
      )
    : await apiSend(targetsPath(aprthngNo), "POST", { searchNo: input.searchNo, ftwrId: input.ftwrId, from: input.from })
  return convertKeysToCamelCase<TargetList>(await res.json())
}

/** ★ 누름 뮤테이션 — 성공하면 목록을 응답으로 바로 바꾸고, 끝나면(성공 · 실패) 확인대상 · 결과 확인 · 의뢰 쿼리를 다시 읽는다 */
export function useToggleTarget(aprthngNo: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ToggleTargetInput) => toggleTarget(aprthngNo, input),
    meta: { inlineError: true },
    onSuccess: (list) => queryClient.setQueryData(targetKeys.list(aprthngNo), list),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: targetKeys.list(aprthngNo) }),
        queryClient.invalidateQueries({ queryKey: ["request"] }),
      ]),
  })
}
