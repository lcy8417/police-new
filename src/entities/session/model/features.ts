/**
 * 기능 권한 코드 — 설계서 §2. 기능 코드 문자열은 이 상수만 쓴다(문자열 직접 입력 금지).
 *
 * 서버가 주는 `features`는 이미 실효 권한(`SHOE_EDIT`가 있으면 `SHOE_VIEW` 포함)이라
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
} as const;

export type FeatureCode = (typeof FEATURES)[keyof typeof FEATURES];

/** 화면에 보일 기능 이름(관리자 권한 토글·안내 문구용). */
export const FEATURE_LABELS: Record<FeatureCode, string> = {
  CRIME_REGISTER: "사건 등록",
  CRIME_SEARCH: "사건 조회",
  SHOE_VIEW: "신발 조회",
  SHOE_EDIT: "신발 등록·수정",
};

/** 화면 표시 순서(서버 `app.feature.sort_ordr`와 같은 순서). */
export const FEATURE_ORDER: readonly FeatureCode[] = [
  FEATURES.CRIME_REGISTER,
  FEATURES.CRIME_SEARCH,
  FEATURES.SHOE_VIEW,
  FEATURES.SHOE_EDIT,
];
