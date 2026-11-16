import type { CrimeHistoryRow } from "@/entities/crime"
import type { ConfirmCaseSummary, ConfirmInsight, ConfirmTarget, Judgement } from "@/widgets/result-confirm"

import type { ZoneTriple } from "../mock-assets/fake-art"

// S07 검색결과 확인 진열용 가짜 값. 시안 S07 예시(감정번호 00001-25-0646 · 이미지 _1 · _2 · _3 · 검색번호 5723xx)에 맞춘다.

export const S07_ERROR_AT = "17:35"
export const S07_DEFAULT_FTWR = "00758"

/** 사건 요약 — r2: 시안 값 그대로(범죄명 「주거침입」) */
export const CASE_SUMMARY: ConfirmCaseSummary = {
  apprslReqestNo: "00001-25-0646",
  crimeNm: "주거침입",
  rqestGrfcNm: "대구청",
}

/** 진열 블록의 고정 값(그림 URL 은 진열 페이지가 붙인다) */
export interface MockBlock {
  aprthngNo: string
  history: CrimeHistoryRow[]
  /** 확인대상(그림 제외). null 이면 확인대상 없음 */
  target: Omit<ConfirmTarget, "image"> | null
}

/** r2: 시안 BLOCKS — _1 은 확인대상이 있고 아직 확인 중, _2 · _3 은 확인대상 없이 이미 결과확인완료 */
export function makeBlocks(firstTargetFtwr: string): MockBlock[] {
  return [
    {
      aprthngNo: "00001-25-0646_1",
      history: [
        { searchNo: 572355, frstRegistDt: "2025-07-23 09:42:14", ranking: 3, mtchgId: null },
        { searchNo: 572414, frstRegistDt: "2025-07-24 17:29:41", ranking: 1, mtchgId: null },
        { searchNo: 572420, frstRegistDt: "2025-07-24 17:40:05", ranking: 2, mtchgId: null },
      ],
      target: { ftwrId: firstTargetFtwr, ranking: 1, similarity: 84.12 },
    },
    {
      aprthngNo: "00001-25-0646_2",
      history: [{ searchNo: 572356, frstRegistDt: "2025-07-23 09:51:02", ranking: 2, mtchgId: null }],
      target: null,
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

// ── r2 +α(시안 r3) 가짜 값 ─────────────────────────────────────────────

/** 이미 결과확인완료된 블록(시안 _2 불발견 · _3 감정불능) */
export const INITIAL_COMPLETED: Readonly<Record<string, Judgement>> = {
  "00001-25-0646_2": "notFound",
  "00001-25-0646_3": "unable",
}

/** 다른 후보 밑창 무늬(그림은 진열 페이지가 만든다) */
export const OTHER_ZONES: Readonly<Record<string, ZoneTriple>> = {
  "301122": ["wave", "grid", "blocks"],
  "288410": ["herring", "grid", "lines"],
}

export const REVIEWERS = [
  // 사용자 관리 · 사용 기록 · 사건 목록과 같은 직급(김○○ 경위 — 2회차 검수 가짜 값 통일)
  { value: "kim", label: "김○○ 경위 · 감정관" },
  { value: "jung", label: "정○○ 경위 · 감정관" },
] as const

export function makeConfirmInsight(shoeImage: (ftwrId: string) => string): ConfirmInsight {
  return {
    headNote: "사건관리 목록 「확인」에서 열림 · 이미지마다 따로 확인합니다",
    caseExtra: {
      crimePlace: "단독주택",
      docNo: "SCAS수사부-2944",
      suspect: "유",
      start: "2025-07-19 02:10",
      end: "2025-07-19 04:30",
      address: "대구 수성구 ○○동 [주소 가림]",
      summary: "피의자가 주방 창문으로 침입하여 현금을 훔쳐 달아난 사건. 주방 바닥·현관에서 족적 3점 채취.",
    },
    blocks: {
      "00001-25-0646_1": {
        aiRecommend: "found",
        historyExtra: {
          572355: { method: "현장문양검색", status: "확인대상선정", resultCount: "1/2355" },
          572414: { method: "현장문양검색", status: "검색", resultCount: "0/869" },
          572420: { method: "하이브리드검색", ai: true, status: "확인대상선정", resultCount: "2/500" },
        },
        targetFrom: "572355 · 572420",
        targetCompare: 87,
        others: [
          { ftwrId: "301122", image: shoeImage("301122"), from: "572420", aiRerank: "AI ↑ 14→2위" },
          { ftwrId: "288410", image: shoeImage("288410"), from: "572420", aiRerank: "AI ↑ 31→5위", excluded: true },
        ],
        reasons: [],
      },
      "00001-25-0646_2": {
        aiRecommend: "notFound",
        historyExtra: { 572356: { method: "현장문양검색", status: "결과확인완료", resultCount: "0/1204" } },
        others: [],
        reasons: [
          { tone: "bad", text: "후보 1,204건 중 가장 비슷한 것도 41.3% — 기준 50% 미만" },
          { tone: "bad", text: "상위 10건 모두 상 부위 문양(점 배열)이 다름" },
        ],
      },
      "00001-25-0646_3": {
        aiRecommend: "unable",
        historyExtra: {},
        emptyNote: "검색 이력 없음 — 족적이 약 30%만 남아 검색하지 않음",
        others: [],
        reasons: [
          { tone: "warn", text: "족적이 약 30%만 남음 — 상·하 부위가 보이지 않음" },
          { tone: "warn", text: "문양이 읽힌 부위 1/3(중) — 검색 조건으로 부족" },
        ],
        remainArea: 30,
      },
    },
    reviewers: REVIEWERS,
  }
}
