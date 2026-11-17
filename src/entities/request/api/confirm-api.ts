import { useQuery } from "@tanstack/react-query"

import { apiGet } from "@/shared/api"
import { convertKeysToCamelCase } from "@/shared/lib"

/**
 * 결과 확인 탭 한 화면 — 서버 G1 `GET /requests/{rqest_id}/confirm`(B 단계 설계서 §4-7).
 * 화면 주소는 감정번호(`?open=<감정번호>`)라 A1 `GET /requests?no=<감정번호>`(최신 회차 1행)로 `rqest_id`를 먼저 얻는다.
 * CRUD 계층이라 응답 snake_case → camelCase. 판정 저장(G2)의 기대값은 줄의 `examId` · `rowVersion`(없으면 둘 다 null).
 */

/** 판정 결과(서버 `FT016001~3` ↔ 화면 값 — 잠금 §2-2) */
export type ConfirmJudgement = "found" | "notFound" | "unable"

/** 줄의 대표 확인대상 신발(지금 판정에 묶인 첫 활성 확인대상) */
export interface ConfirmShoeDto {
  /** 신발 ID — 문자열(앞자리 0 보존) */
  ftwrId: string
  /** 그 확인대상을 고른 검색 번호 */
  searchNo: number
  /** 이미지 유사도 0~100 — 순위 기록이 없으면 null(0점과 구분) */
  score: number | null
  /** 문양 점수 0~1 — 검색 문양이 없었으면 null */
  patternScore: number | null
  /** 검색 순위(1부터) — 순위 기록이 없으면 null */
  ranking: number | null
  /** 판정이 확정됐나(작성 중 판정의 확인대상이면 false) */
  confirmed: boolean
}

/** 결과 확인 한 줄(감정물 한 장) */
export interface ConfirmRowDto {
  /** 사건 안 이미지 번호(감정물 번호 끝 숫자) */
  no: number
  /** 감정물 번호 전체 */
  aprthngNo: string
  /** 신발 · 타이어 */
  kind: "shoe" | "tire"
  /** 현장 사진 정적 경로(루트 기준) — 볼 수 없는 사람이면 null */
  thumbUrl: string | null
  /** 감정물 상태(REGISTERED · SEARCHED · CANDIDATE_SELECTED · CONFIRMED) */
  aprthngSttus: string
  /** 마지막 검색 번호 — 검색 안 했으면 null */
  searchNo: number | null
  /** 확정 판정 결과 — 판정 전이면 null */
  judgement: ConfirmJudgement | null
  /** 판정 메모 */
  opinionCn: string | null
  /** 지금 판정 번호(작성 중 · 확정) — 판정이 없으면 null. G2 `expectedExamId` */
  examId: number | null
  /** 지금 판정 회차 */
  examRound: number | null
  /** 지금 판정 상태(DRAFT · CONFIRMED) — 없으면 null */
  examSttus: "DRAFT" | "CONFIRMED" | null
  /** 지금 판정 판 번호 — G2 `rowVersion`(판정이 없으면 null) */
  rowVersion: number | null
  /** 대표 확인대상 신발 — 없으면 null */
  shoe: ConfirmShoeDto | null
  /** 대표 말고 더 고른 확인대상 수 */
  moreTargets: number
  /** 다시 판정해야 하는 까닭(지금 서버는 주지 않음 — null) */
  note: string | null
}

/** 교차 검증 요약(마지막 검증 단계) */
export interface ConfirmCrossReviewDto {
  stepId: number
  /** requested = 열림(검증 중) · done = 결과 기록됨 */
  sttus: "requested" | "done"
  /** AGREE · DISAGREE · WITHDRAWN — 열려 있으면 null */
  resultCode: "AGREE" | "DISAGREE" | "WITHDRAWN" | null
  reviewerId: string | null
  reviewerNm: string | null
  /** 요청자 ID(회수 단추 — 요청자 본인 · 관리자) */
  requestedBy: string | null
}

/** G1 응답 */
export interface ConfirmView {
  rqestId: number
  /** 의뢰 상태(REQUESTED · RECEIVED · IN_EXAM · CROSS_REVIEW · REPORT_DRAFT · SENT · ARCHIVED) */
  rqestSttus: string
  /** 흐름 5칸 번호(0~5, 과거 사건 null) */
  flowStage: number | null
  rows: ConfirmRowDto[]
  /** 마지막 교차 검증 — 요청한 적 없으면 null */
  crossReview: ConfirmCrossReviewDto | null
  /** 판정을 바꿀 수 없는 까닭(접수 전 · 교차 검증 중 · 감정서 단계 …) — 바꿀 수 있으면 null */
  lockedReason: string | null
}

/** A1 `no=` 한 행에서 쓰는 칸 */
interface RequestRowLite {
  rqestId: number
  apprslReqestNo: string
}

/** 쿼리 키 — 의뢰 번호 단위(`["request", rqestId, …]`)로 두어 판정 · 확인대상 · 교차 검증 뒤 함께 무효화한다 */
export const confirmKeys = {
  idByNo: (apprslReqestNo: string) => ["request", "by-no", apprslReqestNo] as const,
  confirm: (rqestId: number) => ["request", rqestId, "confirm"] as const,
}

/** 감정번호 → 최신 회차 의뢰 번호(A1 `no=`). 없거나 볼 수 없으면 null */
export async function fetchRequestIdByNo(apprslReqestNo: string): Promise<number | null> {
  const body = await apiGet<unknown>(`/requests?no=${encodeURIComponent(apprslReqestNo)}`)
  const { items } = convertKeysToCamelCase<{ items: RequestRowLite[] }>(body)
  return items.length > 0 ? items[0].rqestId : null
}

/** GET /requests/{rqest_id}/confirm */
export async function fetchConfirmView(rqestId: number): Promise<ConfirmView> {
  return convertKeysToCamelCase<ConfirmView>(await apiGet<unknown>(`/requests/${encodeURIComponent(rqestId)}/confirm`))
}

/** 감정번호로 의뢰 번호 찾기(사건 창 탭이 쓰는 키) */
export function useRequestIdByNo(apprslReqestNo: string) {
  return useQuery({
    queryKey: confirmKeys.idByNo(apprslReqestNo),
    queryFn: () => fetchRequestIdByNo(apprslReqestNo),
    enabled: apprslReqestNo !== "",
    staleTime: 60_000,
  })
}

/** 결과 확인 한 화면(G1). rqestId 가 없으면(아직 찾는 중) 부르지 않는다 */
export function useConfirmView(rqestId: number | null) {
  return useQuery({
    queryKey: confirmKeys.confirm(rqestId ?? 0),
    queryFn: () => fetchConfirmView(rqestId as number),
    enabled: rqestId !== null,
  })
}
