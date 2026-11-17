import { useMutation, useQueryClient } from "@tanstack/react-query"

import { apiSend } from "@/shared/api"
import { convertKeysToCamelCase } from "@/shared/lib"

/**
 * 판정 저장(G2 `PUT /crime/{aprthng_no}/examination`) — 누르면 바로 확정(B 단계 설계서 §4-7).
 * 기대값 둘(`expectedExamId` · `rowVersion`)은 결과 확인(G1) 줄의 `examId` · `rowVersion` 그대로 — 판정이 없으면 둘 다 null.
 * 다르면 409 「다른 사람이 먼저 고쳤습니다」 → 결과 확인을 다시 읽어 지금 값을 보인다(성공 · 실패 모두 다시 읽음).
 * 발견은 확인대상이 있어야 한다(400). 교차 검증 이후 · 접수 전은 409.
 */

export type JudgementValue = "found" | "notFound" | "unable"

export interface SaveJudgementInput {
  /** 감정물 번호 전체 */
  aprthngNo: string
  result: JudgementValue
  /** 판정 메모(안 보내면 null) */
  opinionCn?: string | null
  /** 지금 판정 번호 — 판정이 없으면 null */
  expectedExamId: number | null
  /** 지금 판정 판 번호 — 판정이 없으면 null */
  rowVersion: number | null
}

export interface SaveJudgementResult {
  examId: number
  examRound: number
  examSttus: "CONFIRMED"
  /** 화면 장 상태(발견 · 불발견 · 감정불능) */
  imgSttus: string
  rowVersion: number
  /** 저장 뒤 의뢰 상태(첫 판정이면 IN_EXAM) */
  rqestSttus: string
}

/** PUT /crime/{no}/examination */
export async function saveJudgement(input: SaveJudgementInput): Promise<SaveJudgementResult> {
  const res = await apiSend(`/crime/${encodeURIComponent(input.aprthngNo)}/examination`, "PUT", {
    result: input.result,
    opinionCn: input.opinionCn ?? null,
    expectedExamId: input.expectedExamId,
    rowVersion: input.rowVersion,
  })
  return convertKeysToCamelCase<SaveJudgementResult>(await res.json())
}

/** 판정 저장 뮤테이션. 끝나면 의뢰(결과 확인 · 목록 · 상세)와 그 감정물(확인대상 · 판본 이력) 쿼리를 다시 읽는다 */
export function useSaveJudgement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: saveJudgement,
    meta: { inlineError: true },
    onSettled: (_data, _err, input) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["request"] }),
        queryClient.invalidateQueries({ queryKey: ["crime", input.aprthngNo] }),
      ]),
  })
}
