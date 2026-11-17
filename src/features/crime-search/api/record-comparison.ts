import { useMutation, useQueryClient } from "@tanstack/react-query"

import { comparisonKeys } from "@/entities/crime"
import { backendFetch, toApiError } from "@/shared/api"

/**
 * 국소 대응점 계산 + 대조 기록 — 서버 F1 `POST /crime/{aprthng_no}/similarity?ftwr_id=&record=true`(B 단계 설계서 2026-11-17 §4-6).
 * 이미지 처리 계층(무변환). 응답 = 옛 `{ query, ref, matches }` 그대로 + `cmpr_id`(기록 번호). 캐시가 맞아도 기록은 남는다.
 * 성공하면 지난 대조 기록(F2)을 다시 읽는다.
 */

export interface RecordComparisonResult {
  matches: { score?: number; [key: string]: unknown }[]
  cmpr_id: number
  [key: string]: unknown
}

export async function recordComparison(aprthngNo: string, ftwrId: string): Promise<RecordComparisonResult> {
  const q = new URLSearchParams({ ftwr_id: ftwrId, record: "true" }).toString()
  const response = await backendFetch(`/crime/${encodeURIComponent(aprthngNo)}/similarity?${q}`, { method: "POST" })
  if (!response.ok) throw await toApiError(response)
  return (await response.json()) as RecordComparisonResult
}

export function useRecordComparison(aprthngNo: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ftwrId: string) => recordComparison(aprthngNo, ftwrId),
    meta: { inlineError: true },
    // 신발별 · 전체 목록 키가 모두 이 앞부분을 공유한다
    onSuccess: () => queryClient.invalidateQueries({ queryKey: comparisonKeys.list(aprthngNo, null).slice(0, 3) }),
  })
}
