import type { CrimeHistoryRow } from "@/entities/crime"
import type { ConfirmCaseSummary, ConfirmTarget } from "@/widgets/result-confirm"

// S07 검색결과 확인 진열용 가짜 값. 시안 S07 예시(감정번호 00001-25-0646 · 이미지 _1 · _2 · _3 · 검색번호 5723xx)에 맞춘다.

export const S07_ERROR_AT = "17:35"
export const S07_DEFAULT_FTWR = "00758"

/** 사건 요약 — 범죄명은 긴 값 */
export const CASE_SUMMARY: ConfirmCaseSummary = {
  apprslReqestNo: "00001-25-0646",
  crimeNm: "주거침입 절도 — 단독주택 1층 주방 창문으로 침입해 현금을 훔친 사건",
  rqestGrfcNm: "대구청",
}

/** 진열 블록의 고정 값(그림 URL 은 진열 페이지가 붙인다) */
export interface MockBlock {
  aprthngNo: string
  history: CrimeHistoryRow[]
  /** 확인대상(그림 제외). null 이면 확인대상 없음 */
  target: Omit<ConfirmTarget, "image"> | null
}

export function makeBlocks(firstTargetFtwr: string): MockBlock[] {
  return [
    {
      aprthngNo: "00001-25-0646_1",
      history: [
        { searchNo: 572355, frstRegistDt: "2025-07-23 09:42:14", ranking: 3, mtchgId: null },
        { searchNo: 572414, frstRegistDt: "2025-07-24 17:29:41", ranking: 1, mtchgId: null },
      ],
      target: { ftwrId: firstTargetFtwr, ranking: 1, similarity: 84.12 },
    },
    {
      aprthngNo: "00001-25-0646_2",
      history: [{ searchNo: 572356, frstRegistDt: "2025-07-23 09:51:02", ranking: 2, mtchgId: null }],
      target: { ftwrId: "02219", ranking: 2, similarity: 69.99 },
    },
    {
      aprthngNo: "00001-25-0646_3",
      history: [],
      target: null,
    },
  ]
}

/** 진열에서 새 이력 검색번호를 이어 붙일 시작 값 */
export const NEXT_SEARCH_NO = 572500
