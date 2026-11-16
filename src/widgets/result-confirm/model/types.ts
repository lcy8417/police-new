import type { Crime, CrimeHistoryRow } from "@/entities/crime"
import type { FeatureCode } from "@/entities/session"
import type { ScreenStatus } from "@/shared/lib/screen-status"

/** 판정 — 지금 앱의 두 값(발견 = 매칭 신발 ID 를 실어 이력 저장, 불발견 = 매칭 없이 저장). 감정불능은 지금 기능에 없다 */
export type Judgement = "found" | "notFound"

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
}
