import { FEATURES, type FeatureCode } from "@/entities/session"

/** S04 에서 보는 사람이 할 수 있는 일 */
export interface PatternCodeAccess {
  /** 문양 편집 · 추출 · 검색 — 1차: 사건 조회. 실증 보기면 시안 `data-lock="analyst admin"`(판정 확정 = 감정관)까지 */
  canEdit: boolean
  /** 「기술책임자 · 보기만」 칩 — 시안 `data-role="verifier"`(결재 권한 = 기술책임자) */
  showVerifierChip: boolean
  /** 「수사관 · 볼 수 없음」 칩 — 시안 `data-role="investigator"`(사건 등록만 있고 조회 없음 = 수사관) */
  showInvestigatorChip: boolean
}

/**
 * 시안 `data-role` · `data-lock` 을 기능 코드로 옮긴다(spec §13-5). 관리자는 시안처럼 모두 보이고 모두 누른다.
 * 실증 역할 잠금은 `showPlus` 일 때만 — 운영은 `showPlus={false}` 로 시작하므로 1차 잠금 기준이 그대로 남는다.
 */
export function patternCodeAccess(isAdmin: boolean, features: readonly FeatureCode[], showPlus: boolean): PatternCodeAccess {
  const has = (code: FeatureCode) => isAdmin || features.includes(code)
  return {
    canEdit: has(FEATURES.CRIME_SEARCH) && (!showPlus || has(FEATURES.EXAM_DECIDE)),
    showVerifierChip: has(FEATURES.REPORT_APPROVE),
    showInvestigatorChip: isAdmin || (features.includes(FEATURES.CRIME_REGISTER) && !features.includes(FEATURES.CRIME_SEARCH)),
  }
}
