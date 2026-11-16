import type { Crime, CrimeHistoryRow } from "@/entities/crime"
import type { FeatureCode } from "@/entities/session"
import type { ScreenStatus } from "@/shared/lib/screen-status"

/**
 * 판정 — 지금 앱의 두 값(발견 = 매칭 신발 ID 를 실어 이력 저장, 불발견 = 매칭 없이 저장)과
 * 시안의 감정불능(unable — 지금 기능에 없어 `showPlus` 일 때만 라디오에 나온다, 저장 땐 매칭 없음)
 */
export type Judgement = "found" | "notFound" | "unable"

/** 블록의 확인대상 신발(검색 결과에서 고른 한 켤레) */
export interface ConfirmTarget {
  /** 신발 ID — 문자열(앞자리 0 보존) */
  ftwrId: string
  /** 신발 이미지 URL */
  image: string
  /** 검색 결과 순위(1부터) — 발견 저장 때 ranking 으로 실려 간다 */
  ranking: number
  /** 유사도 — imageSearch 응답 그대로 퍼센트 0~100(문자열일 수도 있음) */
  similarity: number | string
}

/** 이미지(감정물) 한 장의 블록 — 판정은 이미지마다 따로 저장한다(지금 저장 단위 = 감정물 × 신발) */
export interface ConfirmImageBlock {
  /** 감정물(이미지) 번호, 예 00001-25-0646_1 */
  aprthngNo: string
  /** 현장 족적 이미지 URL */
  sceneImage: string
  /** 그 감정물의 검색 이력(GET /crime/:aprthngNo 응답 그대로) */
  history: readonly CrimeHistoryRow[]
  /** 확인대상 신발. 없으면 null(판정 못 함) */
  target: ConfirmTarget | null
}

/** 사건 요약표에 쓰는 사건 필드(지금 데이터에 있는 것만) */
export type ConfirmCaseSummary = Pick<Crime, "apprslReqestNo" | "crimeNm" | "rqestGrfcNm">

/** 판정 저장 요청 한 건 */
export interface SaveJudgementInput {
  /** 감정물(이미지) 번호 — 저장 경로 POST /crime/{aprthng_no} */
  aprthngNo: string
  /** 확인대상 신발 ID(발견이면 mtchgId 로 실려 간다) */
  ftwrId: string
  /** 확인대상의 검색 순위(이력 `ranking` 으로 저장 — 판정 R17) */
  ranking: number
  /** 판정 */
  result: Judgement
}

/** +α 이력표 한 줄에 더할 SCAS 칸(지금 이력 데이터에 없음) — 검색번호로 찾는다 */
export interface HistoryExtra {
  /** 검색방법(예 「현장문양검색」 · 「하이브리드검색」) */
  method: string
  /** AI 리랭킹이 도운 검색(검색방법 옆 AI 표시) */
  ai?: boolean
  /** 진행상태(예 「검색」 · 「확인대상선정」 · 「결과확인완료」) */
  status: string
  /** 결과수 「확인대상 수 / 전체 후보 수」 */
  resultCount: string
}

/** +α 확인대상 상자의 다른 후보(첫 확인대상 = 블록 target 말고) */
export interface ConfirmCandidate {
  /** 신발 ID — 문자열 */
  ftwrId: string
  /** 밑창 그림 URL */
  image: string
  /** 찾은 검색번호(예 「572420」) */
  from: string
  /** AI 리랭킹 도움 표시(예 「AI ↑ 14→2위」) */
  aiRerank?: string
  /** 제외됨(☑ 제외) */
  excluded?: boolean
}

/** +α AI 근거 한 줄(확인대상이 없는 블록 — 불발견 · 감정불능 추천 이유) */
export interface ConfirmReason {
  tone: "warn" | "bad"
  text: string
}

/** +α 이미지 블록 하나의 값 묶음 */
export interface BlockInsight {
  /** AI 추천 판정(표시만 — 라디오는 감정관이 고른다) */
  aiRecommend: Judgement
  /** 이력표 SCAS 칸(검색번호 → 값) */
  historyExtra: Readonly<Record<number, HistoryExtra>>
  /** 이력이 없을 때 이유 문구(예 「검색 이력 없음 — 족적이 약 30%만 남아 검색하지 않음」) */
  emptyNote?: string
  /** 첫 확인대상(블록 target)을 찾은 검색번호들(예 「572355 · 572420」) */
  targetFrom?: string
  /** 첫 확인대상 정밀 대조 신뢰도(%) — S06 과 같은 값 */
  targetCompare?: number
  /** 다른 후보 */
  others: readonly ConfirmCandidate[]
  /** 확인대상이 없을 때 AI 근거 2줄 */
  reasons: readonly ConfirmReason[]
  /** 족적이 남은 면적(%) — 있으면 사진 아래를 덮고 칩 */
  remainArea?: number
}

/** +α(시안 r3) 값 묶음 — `showPlus` 일 때만 보인다. 지금 데이터에 없는 SCAS 칸 · AI 추천 · 근거 */
export interface ConfirmInsight {
  /** 머리 안내(예 「사건관리 목록 「확인」에서 열림 · 이미지마다 따로 확인합니다」) */
  headNote: string
  /** 사건 요약표에 더할 SCAS 칸 */
  caseExtra: {
    crimePlace: string
    docNo: string
    suspect: string
    start: string
    end: string
    address: string
    summary: string
  }
  /** 블록별 값(감정물 번호 → 값) */
  blocks: Readonly<Record<string, BlockInsight>>
  /** 교차 검증자 후보(본인 제외) */
  reviewers: readonly { value: string; label: string }[]
}

export interface ResultConfirmScreenProps {
  /** 조회 상태. empty = 확인할 이미지가 없음 */
  status: ScreenStatus
  /** 조회 실패 시각 「시:분」(error 일 때만 보임) */
  errorAt?: string
  /** error 일 때 「다시」 */
  onRetry: () => void
  /** 관리자 여부 */
  isAdmin: boolean
  /** 보는 사람의 기능 권한(판정 저장 = CRIME_SEARCH) */
  features: readonly FeatureCode[]
  /** 사건 요약 */
  caseSummary: ConfirmCaseSummary
  /** 이미지 블록(감정물 번호 순서) */
  blocks: readonly ConfirmImageBlock[]
  /** 블록마다 고른 판정(감정물 번호 → 값). 없으면 아직 안 고름 */
  judgements: Readonly<Record<string, Judgement | null | undefined>>
  /** 판정 라디오 바꿈 */
  onJudgementChange: (aprthngNo: string, result: Judgement) => void
  /** 「결과확인완료」 — 그 블록의 판정 저장 */
  onSaveJudgement: (input: SaveJudgementInput) => void
  /** +α · 실증 요소를 보이나(기본 true). 운영 연결은 false 로 시작 */
  showPlus?: boolean
  /** +α 값 묶음(showPlus 일 때만 쓴다) */
  insight?: ConfirmInsight
  /** 결과확인완료된 블록(감정물 번호 → 저장된 판정). +α 진행 막대 · ✓ · 교차 검증 요청이 읽는다 */
  completed?: Readonly<Record<string, Judgement | undefined>>
  /** 고른 교차 검증자(실증 CROSS_REVIEW) */
  crossReviewer?: string | null
  /** 교차 검증자 바꿈 */
  onCrossReviewerChange?: (reviewer: string) => void
  /** 「교차 검증 요청」 — 모든 블록이 결과확인완료된 뒤 */
  onRequestCrossReview?: (reviewer: string) => void
  /** 동작이 아직 없는 +α 버튼(제외 · 확인 막대 예 …) — 누른 버튼 글자 */
  onPlusAction?: (label: string) => void
}
