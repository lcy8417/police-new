import { useQuery } from "@tanstack/react-query"

import { apiGet } from "@/shared/api"
import { convertKeysToCamelCase } from "@/shared/lib"

/**
 * 확인대상(★) — 서버 E2 `GET /crime/{aprthng_no}/targets`(B 단계 설계서 §3-5 · §4-5).
 * 후보 식별 = 검색 번호 + 신발 ID(잠금 §2-1). 뺀 것도 기록으로 남아 `excluded: true` 로 온다.
 * CRUD 계층이라 응답 snake_case → camelCase.
 */

/** 확인대상 한 줄 */
export interface TargetItem {
  /** 고른 검색 번호 */
  searchNo: number
  /** 신발 ID — 문자열(앞자리 0 보존) */
  ftwrId: string
  /** 그 검색의 순위(순위 기록이 없으면 null) */
  rankNo: number | null
  /** 이미지 유사도 0~100(순위 기록이 없으면 null) */
  similarity: number | null
  /** 문양 점수 0~1(검색 문양이 없었으면 null) */
  patternScore: number | null
  /** 뺀 기록(빼기 = 지우지 않고 표시만) */
  excluded: boolean
  /** 고른 곳 — 검색 결과 ★ · 정밀 대조(모르면 null) */
  from: "search" | "compare" | null
}

/** E2 · E3 · E4 응답 */
export interface TargetList {
  /** 확인대상이 묶인 지금 판정 번호 — 판정이 없으면 null */
  examId: number | null
  /** 지금 판정 상태 — 없으면 null */
  examSttus: "DRAFT" | "CONFIRMED" | null
  /** 지금 판정 판 번호(G2 기대값과 같은 값) — 없으면 null */
  rowVersion: number | null
  /** 고른 순서 */
  items: TargetItem[]
}

/** 확인대상 쿼리 키 — 감정물 상세 키(`crimeKeys.detail`) 아래 */
export const targetKeys = {
  list: (aprthngNo: string) => ["crime", aprthngNo, "targets"] as const,
}

export const targetsPath = (aprthngNo: string) => `/crime/${encodeURIComponent(aprthngNo)}/targets`

/** GET /crime/{no}/targets */
export async function fetchTargets(aprthngNo: string): Promise<TargetList> {
  return convertKeysToCamelCase<TargetList>(await apiGet<unknown>(targetsPath(aprthngNo)))
}

/** 확인대상 목록. `enabled` 가 false(권한 없음 · 감정물 모름)면 부르지 않는다 */
export function useTargets(aprthngNo: string, enabled = true) {
  return useQuery({
    queryKey: targetKeys.list(aprthngNo),
    queryFn: () => fetchTargets(aprthngNo),
    enabled: enabled && aprthngNo !== "",
  })
}
