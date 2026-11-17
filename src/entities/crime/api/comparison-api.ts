import { useQuery } from "@tanstack/react-query"

import { apiGet } from "@/shared/api"
import { convertKeysToCamelCase } from "@/shared/lib"

/**
 * 정밀 대조 지난 기록 — 서버 F2 `GET /crime/{aprthng_no}/comparisons?ftwr_id=`(B 단계 설계서 2026-11-17 §4-6). CRUD 계층(snake → camel).
 * 대조 1회(F1 `record=true`) = 1줄. 지금 모델에는 종합 점수가 없어 대응점 수 · 점수 목록만 남는다.
 */

export interface ComparisonRecord {
  cmprId: number
  /** 신발 ID — 문자열(앞자리 0 보존) */
  ftwrId: string
  /** 대응점 수 */
  matchCnt: number | null
  /** 남긴 값 그대로({matchCnt, scores}) */
  metrics: { matchCnt?: number; scores?: number[] }
  /** KST ISO */
  occurredDt: string
  /** 한 사람 이름(계정이 없으면 ID) */
  actorNm: string | null
}

export const comparisonKeys = {
  list: (aprthngNo: string, ftwrId: string | null) => ["crime", aprthngNo, "comparisons", ftwrId ?? ""] as const,
}

/** GET /crime/{aprthng_no}/comparisons(최근 먼저) */
export async function fetchComparisons(aprthngNo: string, ftwrId: string | null = null): Promise<ComparisonRecord[]> {
  const q = ftwrId ? `?${new URLSearchParams({ ftwr_id: ftwrId }).toString()}` : ""
  return convertKeysToCamelCase<ComparisonRecord[]>(
    await apiGet<unknown>(`/crime/${encodeURIComponent(aprthngNo)}/comparisons${q}`),
  )
}

/** 대조 기록 조회(F2). 감정물 번호가 비면 부르지 않는다 */
export function useComparisons(aprthngNo: string, ftwrId: string | null = null) {
  return useQuery({
    queryKey: comparisonKeys.list(aprthngNo, ftwrId),
    queryFn: () => fetchComparisons(aprthngNo, ftwrId),
    enabled: aprthngNo !== "",
  })
}
