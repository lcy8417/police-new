import { useMutation, useQueryClient } from "@tanstack/react-query"

import { searchHistoryKeys, type CondPattern, type CondPending } from "@/entities/crime"
import type { PatternZone } from "@/entities/pattern"
import { apiSend, backendFetch, toApiError } from "@/shared/api"

/**
 * 신발 검색 실행 · 기록 — 서버 D1 `POST /crime/{aprthng_no}/search` 확장(B 단계 설계서 2026-11-17 §4-4 · §5).
 * 이미지 처리 계층(무변환 — 응답 snake 그대로). 본문 `top…outline` = 필수(거르기, 이름 배열 — 옛 규약 그대로),
 * 새 `query`(검색 문양 + 카드 상태, 가중치는 **단계 문자열**) · `pending`(확인 전 제안 — R5 셈) · `soleText` · `conditions` · `source`
 * · `record: true` · `inputFileId`(기록 때 필수 — 그때 검색한 파일). 응답 `search_no`(기록일 때) · `weights_applied` · `weights_mismatch`.
 * 가중치 숫자는 서버가 정한다(화면 규칙 단계와 다르면 `weights_mismatch` — 서버 값으로 검색).
 *
 * 본 위치 저장 E1 `PUT /crime/history/{search_no}/seen`(CRUD 계층 — 사람마다, 값은 커지기만)도 여기.
 */

export interface RunSearchBody {
  /** 검색 이미지 — data URL 또는 감정물 번호(서버가 저장 장면 그림을 찾음) */
  image: string
  top: string[]
  mid: string[]
  bottom: string[]
  outline: string[]
  query: Record<PatternZone, CondPattern[]>
  pending?: Partial<Record<PatternZone, CondPending[]>>
  soleText?: string
  conditions?: Record<string, string>
  source: "original" | "edited"
  record: boolean
  /** record 일 때 필수 */
  inputFileId?: number
}

/** 응답 결과 한 줄(무변환 — snake) */
export interface RunSearchItem {
  ftwr_id: string
  similarity: number
  pattern_score: number | null
  final_score: number | null
  brand_code: string | null
  top: string[]
  mid: string[]
  bottom: string[]
  outline: string[]
}

export interface RunSearchResponse {
  result: RunSearchItem[]
  total: number
  weights_applied: Partial<Record<PatternZone, Record<string, number>>> | null
  weights_mismatch: boolean
  rule_ver: string
  blend: number
  search_no?: number
}

export async function runSearch(aprthngNo: string, body: RunSearchBody, page = 0): Promise<RunSearchResponse> {
  const response = await backendFetch(`/crime/${encodeURIComponent(aprthngNo)}/search?page=${page}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!response.ok) throw await toApiError(response)
  return (await response.json()) as RunSearchResponse
}

/** 「검색」(기록) 뮤테이션 — 성공하면 검색 이력(D2)을 다시 읽는다. 실패 문구는 부르는 쪽이 알림으로 */
export function useRunSearch(aprthngNo: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: RunSearchBody) => runSearch(aprthngNo, body),
    meta: { inlineError: true },
    onSuccess: () => {
      // 첫 검색 기록은 의뢰를 「검색·판정」으로 · 감정물을 「검색됨」으로 옮긴다 — 의뢰 쿼리도 다시 읽게(기다리지 않음)
      void queryClient.invalidateQueries({ queryKey: ["request"] })
      return queryClient.invalidateQueries({ queryKey: searchHistoryKeys.list(aprthngNo) })
    },
  })
}

export interface SeenResult {
  seenUpTo: number
  seenDt: string | null
}

/** E1 본 위치 올리기(서버가 더 큰 값만 받는다 — 작은 값이면 지금 값을 돌려줌) */
export async function saveSeen(searchNo: number, seenUpTo: number): Promise<SeenResult> {
  const response = await apiSend(`/crime/history/${encodeURIComponent(searchNo)}/seen`, "PUT", { seenUpTo })
  const data = (await response.json()) as { seen_up_to: number; seen_dt: string | null }
  return { seenUpTo: data.seen_up_to, seenDt: data.seen_dt }
}

/** 본 위치 저장 뮤테이션(조용히 — 실패해도 보기는 그대로, 다음 저장 때 다시 올린다) */
export function useSaveSeen() {
  return useMutation({
    mutationFn: ({ searchNo, seenUpTo }: { searchNo: number; seenUpTo: number }) => saveSeen(searchNo, seenUpTo),
    meta: { inlineError: true },
  })
}
