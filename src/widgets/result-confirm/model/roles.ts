import { FEATURES, type FeatureCode } from "@/entities/session"

// 시안 `data-role`(역할 이름)을 기능 권한으로 옮긴 판정(위젯 사이 가져오기 금지라 S05 · S06 위젯과 같은 규칙을 이 위젯에 둔다).
// - 감정관 줄(analyst admin): 판정 확정 EXAM_DECIDE
// - 기술책임자 줄(verifier): 보기 전용 EXAM_VIEW 가 있고 판정 확정은 없음(결재 권한은 서버 0013에서 삭제 — 검증자 역할 기본 = EXAM_VIEW)
// - 수사관 줄(investigator): 진행 상태 조회 CASE_STATUS_VIEW 는 있고 사건 조회 CRIME_SEARCH 는 없음
// - 교차 검증 요청 · 검증자 고르기: 판정 확정 EXAM_DECIDE(서버 H1 · H2 권한과 같음 — [검수] 예전 CROSS_REVIEW 는 「남의 판정을
//   검증하는」 권한이라 요청 권한이 아님)
// 시안처럼 관리자는 모든 역할 줄을 본다(시안 CSS 는 관리자 보기에서 data-role 을 숨기지 않는다).
export interface ViewerRoles {
  analyst: boolean
  verifier: boolean
  investigator: boolean
  crossReview: boolean
}

export function viewerRoles(isAdmin: boolean, features: readonly FeatureCode[]): ViewerRoles {
  const has = (code: FeatureCode) => features.includes(code)
  return {
    analyst: isAdmin || has(FEATURES.EXAM_DECIDE),
    verifier: isAdmin || (has(FEATURES.EXAM_VIEW) && !has(FEATURES.EXAM_DECIDE)),
    investigator: isAdmin || (has(FEATURES.CASE_STATUS_VIEW) && !has(FEATURES.CRIME_SEARCH)),
    crossReview: isAdmin || has(FEATURES.EXAM_DECIDE),
  }
}
