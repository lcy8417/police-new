/**
 * 기능 권한 코드 — 설계서 §2 + 실증 확장 설계서 §5-A. 기능 코드 문자열은 이 상수만 쓴다(문자열 직접 입력 금지).
 *
 * 서버 목록(police-server `auth/entities.py` FEATURE_ORDER = `app.feature` 초기 행 12개)과 같은
 * 코드 · 이름 · 순서다. 어긋나지 않게 `features.test.ts`가 서버 목록을 그대로 적어 두고 비교한다.
 *
 * 서버가 주는 `features`는 이미 실효 권한(역할 권한 ∪ 개인 권한, `SHOE_EDIT`가 있으면 `SHOE_VIEW` 포함)이라
 * 프론트에서 다시 펼치지 않는다.
 */
export const FEATURES = {
  /** 사건 등록 — `/crimeRegister` */
  CRIME_REGISTER: "CRIME_REGISTER",
  /** 사건 조회 — `/search/...`(목록·상세·이력·결과), `/editormode` */
  CRIME_SEARCH: "CRIME_SEARCH",
  /** 신발 조회 — `/shoesRepository`(보기) */
  SHOE_VIEW: "SHOE_VIEW",
  /** 신발 등록·수정 — `/shoesRepository?mode=new|edit` */
  SHOE_EDIT: "SHOE_EDIT",
  /** 의뢰 진행 상태 조회 — 의뢰 목록(`GET /requests`) */
  CASE_STATUS_VIEW: "CASE_STATUS_VIEW",
  /** 발송된 감정서 조회 */
  REPORT_VIEW: "REPORT_VIEW",
  /** 판정 확정(결과확인완료) */
  EXAM_DECIDE: "EXAM_DECIDE",
  /** 교차 검증 */
  CROSS_REVIEW: "CROSS_REVIEW",
  /** 감정서 작성·제출 */
  REPORT_WRITE: "REPORT_WRITE",
  /** 결재·반려 */
  REPORT_APPROVE: "REPORT_APPROVE",
  /** 발송 */
  REPORT_SEND: "REPORT_SEND",
  /** 신발 수집 검수 */
  SHOE_COLLECT_REVIEW: "SHOE_COLLECT_REVIEW",
} as const;

export type FeatureCode = (typeof FEATURES)[keyof typeof FEATURES];

/** 화면에 보일 기능 이름(관리자 권한 토글·안내 문구용) — 서버 `app.feature.feature_nm` 그대로. */
export const FEATURE_LABELS: Record<FeatureCode, string> = {
  CRIME_REGISTER: "사건 등록",
  CRIME_SEARCH: "사건 조회",
  SHOE_VIEW: "신발 조회",
  SHOE_EDIT: "신발 등록·수정",
  CASE_STATUS_VIEW: "의뢰 진행 상태 조회",
  REPORT_VIEW: "발송된 감정서 조회",
  EXAM_DECIDE: "판정 확정",
  CROSS_REVIEW: "교차 검증",
  REPORT_WRITE: "감정서 작성·제출",
  REPORT_APPROVE: "결재·반려",
  REPORT_SEND: "발송",
  SHOE_COLLECT_REVIEW: "신발 수집 검수",
};

/** 화면 표시 순서(서버 `app.feature.sort_ordr`와 같은 순서 — 10, 20, … 120). */
export const FEATURE_ORDER: readonly FeatureCode[] = [
  FEATURES.CRIME_REGISTER,
  FEATURES.CRIME_SEARCH,
  FEATURES.SHOE_VIEW,
  FEATURES.SHOE_EDIT,
  FEATURES.CASE_STATUS_VIEW,
  FEATURES.REPORT_VIEW,
  FEATURES.EXAM_DECIDE,
  FEATURES.CROSS_REVIEW,
  FEATURES.REPORT_WRITE,
  FEATURES.REPORT_APPROVE,
  FEATURES.REPORT_SEND,
  FEATURES.SHOE_COLLECT_REVIEW,
];
