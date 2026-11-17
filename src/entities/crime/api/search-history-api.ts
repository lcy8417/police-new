import { useQuery } from "@tanstack/react-query"

import { apiGet } from "@/shared/api"
import { convertKeysToCamelCase } from "@/shared/lib"
import type { PatternZone } from "@/entities/pattern"

import type { ServerCardStatus, ServerPatternCount, ServerWeightLevel } from "./pattern-api"

/**
 * 검색 이력 · 결과 쪽 — 서버 D2 `GET /crime/{aprthng_no}` · D3 `GET /crime/history/{search_no}` ·
 * D4 `GET /crime/history/{search_no}/results`(B 단계 설계서 2026-11-17 §3-4 · §4-4). CRUD 계층(snake → camel).
 * 검색 조건 `cond`(= 서버 cond_cn)는 서버가 시안 이름(camel) 그대로 저장한다 — 변환해도 키가 같다.
 */

/** 검색에 들어간 문양 한 칸(그때의 필수 · 단계 · 직접 · 카드 상태 · 확신도 · 개수) */
export interface CondPattern {
  name: string
  essential: boolean
  weight: ServerWeightLevel
  manual: boolean
  status?: ServerCardStatus
  confidence?: number
  count?: ServerPatternCount
}

/** 그때 화면의 확인 전 AI 제안 */
export interface CondPending {
  name: string
  confidence?: number
  weight?: ServerWeightLevel
  count?: ServerPatternCount
  doubtful?: boolean
}

/** 검색 조건 전체(서버 cond_cn, ver 1) */
export interface SearchCond {
  ver: number
  source: "original" | "edited"
  zones: Record<PatternZone, CondPattern[]>
  pending: Partial<Record<PatternZone, CondPending[]>>
  soleText: string
  /** 매칭 조건(화면 MatchConditionValues) + method(검색 방식) */
  conditions: Record<string, string>
  /** 서버가 실제로 쓴 가중치 수치 */
  weightsApplied: Partial<Record<PatternZone, Record<string, number>>>
  ruleVer: string
  blend: number
}

/** 이력 줄의 상위 신발 */
export interface SearchTopHit {
  ftwrId: string
  /** 이미지 유사도 0~100 */
  score: number | null
  /** 문양 점수 0~1(null = 점수 없음 — 0점과 다름) */
  patternScore: number | null
}

/** D2 이력 한 줄(옛 키 + B 단계 칸) */
export interface SearchHistoryEntry {
  searchNo: number
  /** `YYYY-MM-DD HH:MM:SS`(KST) */
  frstRegistDt: string | null
  ranking: number
  mtchgId: string | null
  /** 필수 거르기 통과 수(옛 이력 null) */
  resultCount: number | null
  source: "original" | "edited" | null
  method: string | null
  essentialSummary: { essential: number; total: number }
  /** 상위 5(순위 기록 없는 옛 이력은 []) */
  top: SearchTopHit[]
  /** 새 화면 기록인가(cond 있음) */
  hasCond: boolean
  cond: SearchCond | null
}

/** 본 위치(요청자) */
export interface SearchSeen {
  seenUpTo: number
  /** KST ISO */
  seenDt: string | null
}

/** D3 이력 1건 */
export interface SearchRunDetail {
  editImage: string | null
  mtchgId: string | null
  top: [string, number][]
  mid: [string, number][]
  bottom: [string, number][]
  outline: [string, number][]
  cond: SearchCond | null
  candidateTotal: number | null
  model: string | null
  refIndexVer: string | null
  inputFileId: number | null
  aprthngNo: string
  seen: SearchSeen | null
}

/** D4 결과 한 줄 */
export interface SearchResultRow {
  rankNo: number
  /** 신발 ID — 문자열(앞자리 0 보존) */
  ftwrId: string
  /** 이미지 유사도 0~100 */
  similarity: number
  /** 문양 점수 0~1 · null(점수 없음) */
  patternScore: number | null
  /** β > 0일 때만 최종 점수 0~100 */
  finalScore: number | null
  brandCode: string | null
  top: string[]
  mid: string[]
  bottom: string[]
  outline: string[]
}

/** D4 한 쪽 */
export interface SearchResultsPage {
  items: SearchResultRow[]
  /** 그 검색의 결과 수(옛 이력 null) */
  total: number | null
  /** 저장된 순위 수(≤ 200) */
  stored: number
  /** 201위 이후를 지금 기준으로 다시 계산한 줄이 있나 */
  recomputed: boolean
  /** 다시 계산할 때 모델 · 후보 목록이 그때와 다른가 */
  basisChanged: boolean
  /** 순위 기록 없는 옛 이력 */
  legacy: boolean
  seen: SearchSeen | null
}

export const searchHistoryKeys = {
  list: (aprthngNo: string) => ["crime", aprthngNo, "searches"] as const,
  run: (searchNo: number) => ["crimeSearchRun", searchNo] as const,
  results: (searchNo: number, page: number, size: number) => ["crimeSearchRun", searchNo, "results", page, size] as const,
}

/** D4 쪽 크기 기본(서버 기본과 같음) */
export const SEARCH_RESULTS_PAGE_SIZE = 50

/** GET /crime/{aprthng_no} — 검색 이력(오래된 것 먼저) */
export async function fetchSearchHistory(aprthngNo: string): Promise<SearchHistoryEntry[]> {
  return convertKeysToCamelCase<SearchHistoryEntry[]>(await apiGet<unknown>(`/crime/${encodeURIComponent(aprthngNo)}`))
}

/** GET /crime/history/{search_no} */
export async function fetchSearchRun(searchNo: number): Promise<SearchRunDetail> {
  return convertKeysToCamelCase<SearchRunDetail>(await apiGet<unknown>(`/crime/history/${encodeURIComponent(searchNo)}`))
}

/** GET /crime/history/{search_no}/results?page&size */
export async function fetchSearchResultsPage(
  searchNo: number,
  page: number,
  size: number = SEARCH_RESULTS_PAGE_SIZE,
): Promise<SearchResultsPage> {
  const q = new URLSearchParams({ page: String(page), size: String(size) }).toString()
  return convertKeysToCamelCase<SearchResultsPage>(
    await apiGet<unknown>(`/crime/history/${encodeURIComponent(searchNo)}/results?${q}`),
  )
}

/** 검색 이력(D2). 감정물 번호가 비면 부르지 않는다 */
export function useSearchHistory(aprthngNo: string) {
  return useQuery({
    queryKey: searchHistoryKeys.list(aprthngNo),
    queryFn: () => fetchSearchHistory(aprthngNo),
    enabled: aprthngNo !== "",
  })
}

/** 검색 이력 1건(D3) — 「다시 불러오기」 · 지난 검색 문양. searchNo 가 null 이면 부르지 않는다 */
export function useSearchRun(searchNo: number | null) {
  return useQuery({
    queryKey: searchHistoryKeys.run(searchNo ?? 0),
    queryFn: () => fetchSearchRun(searchNo as number),
    enabled: searchNo !== null,
  })
}
