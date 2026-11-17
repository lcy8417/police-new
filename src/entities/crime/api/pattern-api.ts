import { useQuery } from "@tanstack/react-query"

import { apiGet } from "@/shared/api"
import { convertKeysToCamelCase } from "@/shared/lib"
import type { PatternZone } from "@/entities/pattern"

/**
 * 감정물 문양(튜플 + 카드 덧붙임) — 서버 C1 `GET /crime/{aprthng_no}/patterns`(B 단계 설계서 2026-11-17 §3-3 · §4-3).
 * CRUD 계층이라 응답 snake_case → camelCase(문양 이름 키 `n32_04`는 `_` 뒤가 숫자라 그대로 남는다).
 * 튜플은 서버 그대로 **이름**(`[이름, 필수 0/1]`) — 화면 경로는 쓰는 쪽이 `insertPatternPath`로 붙인다(docs/pattern-data-model.md §2).
 */

/** 카드 상태(AI 확인 · 확인 전 제안 · 수동) */
export type ServerCardStatus = "ai" | "suggested" | "manual"
/** 가중치 단계 */
export type ServerWeightLevel = "low" | "normal" | "high"
/** SCAS 개수 칸 */
export type ServerPatternCount = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10이상"

/** 문양 카드 덧붙임 한 칸(화면 값 — 서버가 DB 값을 바꿔 준다) */
export interface ServerCardMeta {
  status: ServerCardStatus
  /** AI 확신도 0~1(수동이면 null) */
  confidence: number | null
  /** 「AI 제안?」 */
  doubtful: boolean
  /** 사람이 고정한 단계(null = 규칙 값) */
  weight: ServerWeightLevel | null
  /** 「직접」 — weight 가 사람 값인가 */
  manual: boolean
  /** 개수(null = 입력 안 함) */
  count: ServerPatternCount | null
  /** 부위 안 카드 순서 */
  sortOrdr: number
  /** 이 카드를 낸 AI 실행 번호(없으면 null) */
  aiRunId: number | null
}

/** 사건 문양 튜플 `[이름, 필수 0/1]` */
export type NamedPatternTuple = readonly [name: string, essential: 0 | 1]

/** C1 응답 */
export interface CrimePatterns {
  top: NamedPatternTuple[]
  mid: NamedPatternTuple[]
  bottom: NamedPatternTuple[]
  outline: NamedPatternTuple[]
  /** 부위 → 문양 이름 → 카드 덧붙임(제안 카드는 튜플에 없고 여기에만 있다) */
  meta: Record<PatternZone, Record<string, ServerCardMeta>>
  /** 밑창 문자열(없으면 null) */
  soleText: string | null
  /** AI 통합 추출 원본(없으면 null) */
  extractedRaw: { code: string; score: number }[] | null
  /** 감정물 판 번호 — C2 저장 때 기대 버전으로 보낸다(앱 부가행이 없는 옛 감정물은 null) */
  rowVersion: number | null
}

export const patternKeys = {
  detail: (aprthngNo: string) => ["crime", aprthngNo, "patterns"] as const,
}

const patternsPath = (aprthngNo: string) => `/crime/${encodeURIComponent(aprthngNo)}/patterns`

/** GET /crime/{aprthng_no}/patterns */
export async function fetchCrimePatterns(aprthngNo: string): Promise<CrimePatterns> {
  return convertKeysToCamelCase<CrimePatterns>(await apiGet<unknown>(patternsPath(aprthngNo)))
}

/** 문양 조회(C1). 감정물 번호가 비면 부르지 않는다. 다른 사람이 고친 값을 놓치지 않게 탭을 열 때마다 다시 읽는다 */
export function useCrimePatterns(aprthngNo: string) {
  return useQuery({
    queryKey: patternKeys.detail(aprthngNo),
    queryFn: () => fetchCrimePatterns(aprthngNo),
    enabled: aprthngNo !== "",
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  })
}
