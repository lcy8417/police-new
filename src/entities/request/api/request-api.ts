import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query"

import { apiGet } from "@/shared/api"
import { convertKeysToCamelCase } from "@/shared/lib"

/**
 * 의뢰 목록 · 상세 — 서버 A1 `GET /requests`(키셋 쪽 나누기 · 서버 거르기) · A2 `GET /requests/{rqest_id}`
 * (B 단계 설계서 §4-1, sprint-notes [묶음2] A1 · A2 응답 모양). CRUD 계층이라 응답 snake_case → camelCase.
 * 전체 건수 · 칩 건수는 서버가 주지 않는다(키셋 — 17만 건). 「더 보기」 = `nextCursor`.
 */

/** 흐름 5칸 번호(0 접수 대기 · 1 1차 작업 · 2 검색·판정 · 3 교차 검증 · 4 감정서 · 5 완료, SCAS 과거 사건 null) */
export type FlowStage = 0 | 1 | 2 | 3 | 4 | 5

/** A1 한 행(의뢰 한 회차) */
export interface RequestListItem {
  rqestId: number
  /** 감정번호 — 문자열(앞자리 0 보존) */
  apprslReqestNo: string
  rqestRound: number
  /** APP · SCAS */
  dataSrcSe: string
  /** 의뢰 상태(REQUESTED · RECEIVED · IN_EXAM · CROSS_REVIEW · REPORT_DRAFT · SENT · ARCHIVED) */
  rqestSttus: string
  crimeNm: string | null
  rqestOrgId: number | null
  rqestOrgNm: string | null
  /** 등록 시각 KST ISO */
  frstRegistDt: string
  aprthngCnt: number
  scasCaseNo: string | null
  docNo: string | null
  /** 용의자 유무 Y · N(없으면 null) */
  suspectExstAt: string | null
  flowStage: FlowStage | null
  /** 첫 장 현장 그림(루트 기준) — 사진을 볼 수 없는 사람 · SCAS 과거 사건은 null */
  thumbUrl: string | null
  imageCnt: { shoe: number; tire: number }
  progress: { registered: number; searched: number; confirmed: number }
  results: { found: number; notFound: number; unable: number }
  /** 열린 교차 검증의 검증자 이름 */
  crossReviewerNm: string | null
}

/** A1 거르기(빈 값 = 조건 없음). 기간을 안 주면 서버 기본(최근 한 달) */
export interface RequestListFilters {
  /** 바로 찾기 — 감정번호 · 이미지 번호 · SCAS 사건번호 · 문서번호 앞부분, 사건명 부분 */
  q?: string
  /** 의뢰 상태 목록 */
  flow?: readonly string[]
  /** 판정 결과 found · notFound · unable · none */
  result?: readonly string[]
  /** 결과 확인 전 장이 있는 사건 */
  awaiting?: boolean
  /** 검색 안 한 장이 있는 사건 */
  unsearched?: boolean
  /** 내 배당만 */
  mine?: boolean
  /** 한 쪽 건수(기본 50, 최대 200) */
  limit?: number
  /** 감정물 번호 정확히(그 감정물의 의뢰 1행 — 옛 주소 넘겨주기, 기간 무시) */
  aprthng?: string
}

export interface RequestListPage {
  items: RequestListItem[]
  nextCursor: string | null
}

/** A2 감정물(현장 이미지 한 장) */
export interface RequestImage {
  aprthngNo: string
  apprslReqestNo: string | null
  /** 채취 일시 KST ISO(없으면 null) */
  pickDt: string | null
  pickPlace: string | null
  pickMthCode: string | null
  aprthngKndCode: string | null
  pickmanClssCode: string | null
  pickmanNm: string | null
  makrCode: string | null
  brandCode: string | null
  clCode: string | null
  swingSe: string | null
  heelExstAt: string | null
  vhcleClCode: string | null
  vhcleCode: string | null
  ftwrTireSe: string | null
  frstRegistDt: string | null
  frstRegisterId: string | null
  /** 사건 안 이미지 번호(감정물 번호 끝 숫자) */
  no: number
  kind: "shoe" | "tire"
  /** REGISTERED · SEARCHED · CANDIDATE_SELECTED · CONFIRMED */
  aprthngSttus: string
  /** 화면 장 상태(등록 · 검색됨 · 발견 · 불발견 · 감정불능) */
  imgSttus: string
  /** 현장 그림(루트 기준) — 볼 수 없는 사람 · 과거 사건은 null */
  thumbUrl: string | null
  /** 지금 작업 그림 파일(편집본이 있으면 마지막 편집본) — 옛 감정물은 null */
  workingFileId: number | null
  hasOriginal: boolean
  /** 감정물 판 번호(A8 기대값) */
  rowVersion: number
}

/** A2 흐름 한 칸 */
export interface RequestFlowStep {
  name: string
  state: "done" | "now" | "todo"
}

/** A2 의뢰 상세 */
export interface RequestDetail {
  rqestId: number
  dataSrcSe: string
  apprslReqestNo: string
  rqestRound: number
  rqestOrgId: number | null
  rqestOrgEtcNm: string | null
  occrrncOrgId: number | null
  processOrgId: number | null
  scasCaseNo: string | null
  docNo: string | null
  crimeSeCode: string | null
  crimeNm: string | null
  crimeBeginDt: string | null
  crimeEndDt: string | null
  crimeAdres: string | null
  crimePlaceCode: string | null
  crimeSmryCn: string | null
  victimNm: string | null
  victimBrthy: string | null
  suspectExstAt: string | null
  arrestSttusCode: string | null
  rqestChargerNm: string | null
  ftwrTireSe: string | null
  rm: string | null
  rqestSttus: string
  frstRegistDt: string | null
  frstRegisterId: string | null
  lastUpdtDt: string | null
  lastUpdusrId: string | null
  /** 의뢰 판 번호(A3 기대값) */
  rowVersion: number
  rqestOrgNm: string | null
  occrrncOrgNm: string | null
  processOrgNm: string | null
  flowStage: FlowStage | null
  /** 흐름 5칸 — 과거 사건 null */
  flow: RequestFlowStep[] | null
  images: RequestImage[]
  crossReview: {
    stepId: number
    sttus: "requested" | "done"
    resultCode: string | null
    reviewerId: string | null
    reviewerNm: string | null
    requestedBy: string | null
  } | null
  report: { versionSttus: string; versionNo: number } | null
  /** 필수 빈 칸 수(사건명 1 + 채취 방법 빈 장 수) */
  infoBlanks: number
}

/** 쿼리 키 — 모두 `["request", …]` 아래라 판정 · 접수 · 수정 뒤 `["request"]` 무효화 한 번으로 함께 다시 읽는다 */
export const requestKeys = {
  list: (filters: RequestListFilters) => ["request", "list", filters] as const,
  detail: (rqestId: number) => ["request", rqestId, "detail"] as const,
}

/** A1 주소 조립(빈 조건은 빼고) */
export function requestListPath(filters: RequestListFilters, cursor: string | null = null): string {
  const p = new URLSearchParams()
  const q = filters.q?.trim()
  if (q) p.set("q", q)
  if (filters.flow && filters.flow.length > 0) p.set("flow", filters.flow.join(","))
  if (filters.result && filters.result.length > 0) p.set("result", filters.result.join(","))
  if (filters.awaiting) p.set("awaiting", "1")
  if (filters.unsearched) p.set("unsearched", "1")
  if (filters.mine) p.set("mine", "1")
  if (filters.limit) p.set("limit", String(filters.limit))
  if (filters.aprthng) p.set("aprthng", filters.aprthng)
  if (cursor) p.set("cursor", cursor)
  const qs = p.toString()
  return qs ? `/requests?${qs}` : "/requests"
}

/** GET /requests — 한 쪽 */
export async function fetchRequestList(filters: RequestListFilters, cursor: string | null = null): Promise<RequestListPage> {
  return convertKeysToCamelCase<RequestListPage>(await apiGet<unknown>(requestListPath(filters, cursor)))
}

/** GET /requests/{rqest_id} */
export async function fetchRequestDetail(rqestId: number): Promise<RequestDetail> {
  return convertKeysToCamelCase<RequestDetail>(await apiGet<unknown>(`/requests/${encodeURIComponent(rqestId)}`))
}

/** 사건 목록(A1) — 쪽을 이어 받는다(「더 보기」 = fetchNextPage). 거르기가 바뀌는 동안 앞 결과를 그대로 보인다 */
export function useRequestList(filters: RequestListFilters, enabled = true) {
  return useInfiniteQuery({
    queryKey: requestKeys.list(filters),
    queryFn: ({ pageParam }) => fetchRequestList(filters, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    placeholderData: keepPreviousData,
    enabled,
  })
}

/** 의뢰 상세(A2). rqestId 를 모르면(아직 찾는 중) 부르지 않는다 */
export function useRequestDetail(rqestId: number | null) {
  return useQuery({
    queryKey: requestKeys.detail(rqestId ?? 0),
    queryFn: () => fetchRequestDetail(rqestId as number),
    enabled: rqestId !== null,
  })
}
