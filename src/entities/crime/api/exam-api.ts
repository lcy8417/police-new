import { useQuery } from "@tanstack/react-query"

import { apiGet } from "@/shared/api"
import { convertKeysToCamelCase } from "@/shared/lib"

/**
 * 판정 판본 이력 — 서버 G3 `GET /crime/{aprthng_no}/examinations`(B 단계 설계서 §4-7).
 * 덮어쓰기 없이 판본이 쌓인다(확정 → 다시 판정 = 이전 SUPERSEDED + 새 회차). CRUD 계층이라 camelCase 변환.
 */

/** 판본에 묶인 확인대상(뺀 것 포함) */
export interface ExamCandidate {
  searchNo: number
  /** 신발 ID — 문자열 */
  ftwrId: string
  excluded: boolean
}

/** 판정 판본 한 줄 */
export interface ExamVersion {
  examId: number
  examRound: number
  /** SCAS 결과 코드(FT016001 발견 · FT016002 불발견 · FT016003 감정불능) — 작성 중이면 null */
  resultCode: string | null
  /** 화면 값(found · notFound · unable) — 작성 중이면 null */
  result: "found" | "notFound" | "unable" | null
  opinionCn: string | null
  /** DRAFT · CONFIRMED · SUPERSEDED */
  examSttus: "DRAFT" | "CONFIRMED" | "SUPERSEDED"
  decidedBy: string | null
  decidedByNm: string | null
  /** 판정 시각 KST ISO — 작성 중이면 null */
  decidedDt: string | null
  candidates: ExamCandidate[]
}

export const examKeys = {
  history: (aprthngNo: string) => ["crime", aprthngNo, "examinations"] as const,
}

/** GET /crime/{no}/examinations */
export async function fetchExamHistory(aprthngNo: string): Promise<ExamVersion[]> {
  return convertKeysToCamelCase<ExamVersion[]>(
    await apiGet<unknown>(`/crime/${encodeURIComponent(aprthngNo)}/examinations`)
  )
}

/** 판정 판본 이력(회차순) */
export function useExamHistory(aprthngNo: string, enabled = true) {
  return useQuery({
    queryKey: examKeys.history(aprthngNo),
    queryFn: () => fetchExamHistory(aprthngNo),
    enabled: enabled && aprthngNo !== "",
  })
}
