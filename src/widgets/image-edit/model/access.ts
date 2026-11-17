import { FEATURES, type FeatureCode } from "@/entities/session"

/** S03 에서 보는 사람이 할 수 있는 일 */
export interface ImageEditAccess {
  /** 편집(도구 · 확인 · 되돌리기) — 1차 규칙: 사건 조회 또는 사건 등록 */
  canEdit: boolean
  /** A 「저장」 — 시안 `data-lock="investigator analyst admin"`(실증 보기에서만 사건 등록 권한으로 좁힘) */
  canSave: boolean
  /** B AI 다시 추출 · AI 보정 — 시안 `data-lock="analyst admin"`(판정 확정 권한 = 감정관) */
  canAiRedo: boolean
  /** 「기술책임자 · 보기만」 칩 — 시안 `data-role="verifier"`(보기 전용 EXAM_VIEW = 기술책임자, 관리자는 시안처럼 다 보임) */
  showVerifierChip: boolean
}

/**
 * 시안 `data-role` · `data-lock` 을 기능 코드로 옮긴다(spec §13-5). 실증 역할 잠금은 `showPlus` 일 때만 —
 * 운영은 `showPlus={false}` 로 시작하므로 지금 기능의 잠금 기준(1차)이 그대로 남는다.
 */
export function imageEditAccess(isAdmin: boolean, features: readonly FeatureCode[], showPlus: boolean): ImageEditAccess {
  const has = (code: FeatureCode) => isAdmin || features.includes(code)
  // 실증 보기에서 기술책임자(보기 전용 EXAM_VIEW · 판정 확정 없음)는 「보기만」 — 칩과 같이 편집 · 되돌리기도 잠근다(3회차 검수 — 칩은 보기만인데 편집이 되던 것)
  const verifierOnly = has(FEATURES.EXAM_VIEW) && !has(FEATURES.EXAM_DECIDE)
  const canEdit = (has(FEATURES.CRIME_SEARCH) || has(FEATURES.CRIME_REGISTER)) && !(showPlus && verifierOnly)
  return {
    canEdit,
    canSave: canEdit && (!showPlus || has(FEATURES.CRIME_REGISTER)),
    canAiRedo: has(FEATURES.EXAM_DECIDE),
    showVerifierChip: has(FEATURES.EXAM_VIEW),
  }
}
